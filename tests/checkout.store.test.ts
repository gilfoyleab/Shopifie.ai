import { Keypair } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoBikeProduct } from "@/lib/checkout/fixtures";
import {
  buildMagicBlockTransferRequest,
  createCheckoutSession,
  prepareMagicBlockPayment,
  resetCheckoutStore,
  submitPreparedPayment,
  updateCheckoutSession,
} from "@/lib/checkout/store";

describe("checkout store", () => {
  beforeEach(() => {
    resetCheckoutStore();
    vi.unstubAllGlobals();
  });

  it("creates a checkout session from a product snapshot", () => {
    const checkout = createCheckoutSession(demoBikeProduct);

    expect(checkout.status).toBe("checkout_ready");
    expect(checkout.product.title).toBe(demoBikeProduct.title);
    expect(checkout.pricing.settlementUiAmount).toBeGreaterThanOrEqual(0.2);
    expect(checkout.pricing.settlementUiAmount).toBeLessThanOrEqual(2);
    expect(checkout.payment.clientRefId).toHaveLength(12);
  });

  it("builds a MagicBlock private transfer payload", () => {
    const checkout = createCheckoutSession(demoBikeProduct);
    const wallet = Keypair.generate().publicKey.toBase58();

    const request = buildMagicBlockTransferRequest(checkout, wallet);

    expect(request.visibility).toBe("private");
    expect(request.cluster).toBe("devnet");
    expect(request.from).toBe(wallet);
    expect(request.to).toBe(checkout.merchant.wallet);
  });

  it("falls back to simulated payment preparation when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline test")));
    const checkout = createCheckoutSession(demoBikeProduct);
    const wallet = Keypair.generate().publicKey.toBase58();

    const prepared = await prepareMagicBlockPayment(checkout, wallet);

    expect(prepared.mode).toBe("simulated");
    expect(prepared.request.clientRefId).toBe(checkout.payment.clientRefId);
    expect(prepared.error).toContain("offline test");
  });

  it("simulates payment submission and returns a signature", async () => {
    const checkout = createCheckoutSession(demoBikeProduct);
    const wallet = Keypair.generate().publicKey.toBase58();

    const hydrated = updateCheckoutSession(checkout.id, (session) => ({
      ...session,
      payment: {
        ...session.payment,
        customerWallet: wallet,
        mode: "simulated",
        preparedAt: new Date().toISOString(),
        request: buildMagicBlockTransferRequest(session, wallet),
        response: {
          kind: "transfer",
          version: "legacy",
          sendTo: "base",
        },
        lastError: "simulated path",
      },
      status: "checkout_ready",
    }));

    const submitted = await submitPreparedPayment(hydrated!, { simulate: true });

    expect(submitted.mode).toBe("simulated");
    expect(submitted.signature.startsWith("sim-")).toBe(true);
    expect(submitted.rpcUrl).toContain("devnet");
  });
});
