import { Keypair } from "@solana/web3.js";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST as createCheckoutPost } from "@/app/api/checkout/route";
import { POST as preparePaymentPost } from "@/app/api/checkout/[checkoutId]/prepare-payment/route";
import { POST as submitPaymentPost } from "@/app/api/checkout/[checkoutId]/submit-payment/route";
import { demoBikeProduct } from "@/lib/checkout/fixtures";
import { resetCheckoutStore } from "@/lib/checkout/store";
import { DEVNET_USDC_MINT } from "@/lib/checkout/types";

describe("private transfer flow", () => {
  beforeEach(() => {
    resetCheckoutStore();
  });

  it("prepares a MagicBlock private transfer request with the demo merchant wallet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline private transfer test")));

    const createResponse = await createCheckoutPost(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: demoBikeProduct }),
      }),
    );
    const createPayload = await createResponse.json();
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
    expect(preparePayload.checkout.mppIntent.profile).toBe("private-mpp");
    expect(preparePayload.checkout.mppIntent.protocol).toBe("x402");
    expect(preparePayload.checkout.mppIntent.rail).toBe("magicblock-private-payments");
    expect(preparePayload.checkout.mppIntent.technicalDesign).toBe("x402-with-private-payment-api");
    expect(preparePayload.checkout.payment.request.visibility).toBe("private");
    expect(preparePayload.checkout.payment.request.mint).toBe(DEVNET_USDC_MINT);
    expect(preparePayload.checkout.payment.request.from).toBe(buyerWallet);
    expect(preparePayload.checkout.payment.request.to).toBe(
      preparePayload.checkout.merchant.wallet,
    );
    expect(preparePayload.checkout.payment.request.clientRefId).toBe(
      preparePayload.checkout.payment.clientRefId,
    );
  });

  it("marks the checkout paid when the private transfer submit route runs in demo mode", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline private transfer test")));

    const createResponse = await createCheckoutPost(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: demoBikeProduct }),
      }),
    );
    const createPayload = await createResponse.json();
    const checkoutId = createPayload.checkout.id as string;
    const buyerWallet = Keypair.generate().publicKey.toBase58();

    await preparePaymentPost(
      new Request(`http://localhost/api/checkout/${checkoutId}/prepare-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: buyerWallet }),
      }),
      { params: Promise.resolve({ checkoutId }) },
    );

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
    expect(submitPayload.checkout.payment.mode).toBe("demo");
    expect(submitPayload.checkout.payment.signature).toMatch(/^demo-/);
    expect(submitPayload.receipt.total).toBe(createPayload.checkout.pricing.totalLabel);
  });
});
