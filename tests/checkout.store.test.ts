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
    expect(checkout.pricing.settlementUiAmount).toBeGreaterThanOrEqual(0.5);
    expect(checkout.pricing.settlementUiAmount).toBeLessThanOrEqual(2);
    expect(checkout.payment.clientRefId).toHaveLength(12);
    expect(checkout.mppIntent.profile).toBe("private-mpp");
    expect(checkout.mppIntent.protocol).toBe("x402");
    expect(checkout.mppIntent.rail).toBe("magicblock-private-payments");
    expect(checkout.mppIntent.privacyLayer).toBe("per");
    expect(checkout.mppIntent.erUsage).toBe("payment-on-per-with-private-payment-api");
    expect(checkout.mppIntent.technicalDesign).toBe("x402-with-private-payment-api");
  });

  it("builds a MagicBlock private transfer payload", () => {
    const checkout = createCheckoutSession(demoBikeProduct);
    const wallet = Keypair.generate().publicKey.toBase58();

    const request = buildMagicBlockTransferRequest(checkout, wallet);

    expect(request.visibility).toBe("private");
    expect(request.cluster).toBe("devnet");
    expect(request.from).toBe(wallet);
    expect(request.to).toBe(checkout.merchant.wallet);
    expect(request.gasless).toBe(true);
    expect(request.initIfMissing).toBe(false);
    expect(request.initAtasIfMissing).toBe(false);
    expect(request.memo).toBeUndefined();
  });

  it("falls back to demo payment preparation when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline test")));
    const checkout = createCheckoutSession(demoBikeProduct);
    const wallet = Keypair.generate().publicKey.toBase58();

    const prepared = await prepareMagicBlockPayment(checkout, wallet);

    expect(prepared.mode).toBe("demo");
    expect(prepared.request.clientRefId).toBe(checkout.payment.clientRefId);
    expect(prepared.response.demo).toBe(true);
    expect(prepared.error).toContain("offline test");
  });

  it("completes demo payment submission and returns a demo signature", async () => {
    const checkout = createCheckoutSession(demoBikeProduct);
    const wallet = Keypair.generate().publicKey.toBase58();

    const hydrated = updateCheckoutSession(checkout.id, (session) => ({
      ...session,
      payment: {
        ...session.payment,
        customerWallet: wallet,
        mode: "demo",
        preparedAt: new Date().toISOString(),
        request: buildMagicBlockTransferRequest(session, wallet),
        response: {
          kind: "transfer",
          version: "legacy",
          sendTo: "base",
          demo: true,
        },
        lastError: "demo path",
      },
      status: "checkout_ready",
    }));

    const submitted = await submitPreparedPayment(hydrated!, { simulate: true });

    expect(submitted.mode).toBe("demo");
    expect(submitted.signature.startsWith("demo-")).toBe(true);
    expect(submitted.rpcUrl).toContain("devnet");
  });
});
