import { Keypair } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createCheckoutPost } from "@/app/api/checkout/route";
import { POST as preparePaymentPost } from "@/app/api/checkout/[checkoutId]/prepare-payment/route";
import { GET as receiptGet } from "@/app/api/checkout/[checkoutId]/receipt/route";
import { POST as submitPaymentPost } from "@/app/api/checkout/[checkoutId]/submit-payment/route";
import { demoBikeProduct } from "@/lib/checkout/fixtures";
import { resetCheckoutStore } from "@/lib/checkout/store";

describe("checkout API routes", () => {
  beforeEach(() => {
    resetCheckoutStore();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("route test fallback")));
  });

  it("creates, prepares, submits, and returns a receipt for a simulated bike checkout", async () => {
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

    const checkoutId = createPayload.checkout.id as string;
    const buyerWallet = Keypair.generate().publicKey.toBase58();

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
    expect(preparePayload.checkout.payment.mode).toBe("simulated");

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
    expect(submitPayload.receipt.signature).toMatch(/^sim-/);

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
