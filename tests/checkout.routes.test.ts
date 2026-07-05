import { Keypair } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createCheckoutPost } from "@/app/api/checkout/route";
import { POST as preparePaymentPost } from "@/app/api/checkout/[checkoutId]/prepare-payment/route";
import { GET as receiptGet } from "@/app/api/checkout/[checkoutId]/receipt/route";
import { POST as submitPaymentPost } from "@/app/api/checkout/[checkoutId]/submit-payment/route";
import { GET as x402Get } from "@/app/api/checkout/[checkoutId]/x402/route";
import { demoBikeProduct } from "@/lib/checkout/fixtures";
import { resetCheckoutStore } from "@/lib/checkout/store";

describe("checkout API routes", () => {
  beforeEach(() => {
    resetCheckoutStore();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("route test fallback")));
  });

  it("creates, prepares, submits, and returns a receipt for a demo private MPP checkout", async () => {
    const createResponse = await createCheckoutPost(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: demoBikeProduct }),
      }),
    );
    const createPayload = await createResponse.json();

    expect(createResponse.status).toBe(200);
    expect(createPayload.success).toBe(true);
    expect(createPayload.checkout.mppIntent.protocol).toBe("x402");
    expect(createPayload.checkout.mppIntent.privacyLayer).toBe("per");

    const checkoutId = createPayload.checkout.id as string;
    const buyerWallet = Keypair.generate().publicKey.toBase58();

    const x402Response = await x402Get(
      new Request(`http://localhost/api/checkout/${checkoutId}/x402`),
      { params: Promise.resolve({ checkoutId }) },
    );
    const x402Payload = await x402Response.json();

    expect(x402Response.status).toBe(402);
    expect(x402Response.headers.get("X-Payment-Protocol")).toBe("x402");
    expect(x402Payload.profile).toBe("private-mpp");
    expect(x402Payload.technicalDesign).toBe("x402-with-private-payment-api");
    expect(x402Payload.accepts[0].extra.rail).toBe("magicblock-private-payments");
    expect(x402Payload.accepts[0].extra.erUsage).toBe("payment-on-per-with-private-payment-api");
    expect(x402Payload.accepts[0].extra.solanaX402ProtectedUrl).toContain(checkoutId);
    expect(x402Payload.accepts[0].extra.prepareUrl).toContain(checkoutId);

    const prepareResponse = await preparePaymentPost(
      new Request(`http://localhost/api/checkout/${checkoutId}/prepare-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: buyerWallet }),
      }),
      { params: Promise.resolve({ checkoutId }) },
    );
    const preparePayload = await prepareResponse.json();

    expect(prepareResponse.status).toBe(200);
    expect(preparePayload.checkout.payment.mode).toBe("demo");
    expect(preparePayload.checkout.payment.request.visibility).toBe("private");
    expect(preparePayload.checkout.payment.request.gasless).toBe(true);

    const submitResponse = await submitPaymentPost(
      new Request(`http://localhost/api/checkout/${checkoutId}/submit-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate: true }),
      }),
      { params: Promise.resolve({ checkoutId }) },
    );
    const submitPayload = await submitResponse.json();

    expect(submitResponse.status).toBe(200);
    expect(submitPayload.checkout.status).toBe("paid");
    expect(submitPayload.receipt.signature).toMatch(/^demo-/);
    expect(submitPayload.receipt.protocol).toBe("x402");

    const receiptResponse = await receiptGet(
      new Request(`http://localhost/api/checkout/${checkoutId}/receipt`),
      { params: Promise.resolve({ checkoutId }) },
    );
    const receiptPayload = await receiptResponse.json();

    expect(receiptResponse.status).toBe(200);
    expect(receiptPayload.success).toBe(true);
    expect(receiptPayload.receipt.productTitle).toBe(demoBikeProduct.title);
  });
});
