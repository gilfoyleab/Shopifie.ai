import { Keypair } from "@solana/web3.js";
import { POST as createCheckoutPost } from "@/app/api/checkout/route";
import { POST as preparePaymentPost } from "@/app/api/checkout/[checkoutId]/prepare-payment/route";
import { GET as receiptGet } from "@/app/api/checkout/[checkoutId]/receipt/route";
import { POST as submitPaymentPost } from "@/app/api/checkout/[checkoutId]/submit-payment/route";
import { demoBikeProduct } from "@/lib/checkout/fixtures";

async function main() {
  const buyerWallet = Keypair.generate().publicKey.toBase58();

  const createResponse = await createCheckoutPost(
    new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: demoBikeProduct }),
    }),
  );
  const createPayload = await createResponse.json();
  const checkoutId = createPayload.checkout.id as string;

  console.log("1. checkout created");
  console.log({
    checkoutId,
    settlement: createPayload.checkout.pricing.totalLabel,
    merchant: createPayload.checkout.merchant.label,
  });

  const prepareResponse = await preparePaymentPost(
    new Request(`http://localhost/api/checkout/${checkoutId}/prepare-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: buyerWallet }),
    }),
    { params: Promise.resolve({ checkoutId }) },
  );
  const preparePayload = await prepareResponse.json();

  console.log("2. payment prepared");
  console.log({
    mode: preparePayload.checkout.payment.mode,
    clientRefId: preparePayload.checkout.payment.clientRefId,
    wallet: buyerWallet,
    rpcTarget: preparePayload.checkout.payment.response?.sendTo || "base",
    prepError: preparePayload.checkout.payment.lastError,
  });

  const submitResponse = await submitPaymentPost(
    new Request(`http://localhost/api/checkout/${checkoutId}/submit-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulate: true }),
    }),
    { params: Promise.resolve({ checkoutId }) },
  );
  const submitPayload = await submitResponse.json();

  console.log("3. payment submitted");
  console.log({
    status: submitPayload.checkout.status,
    signature: submitPayload.checkout.payment.signature,
    confirmedAt: submitPayload.checkout.payment.confirmedAt,
  });

  const receiptResponse = await receiptGet(
    new Request(`http://localhost/api/checkout/${checkoutId}/receipt`),
    { params: Promise.resolve({ checkoutId }) },
  );
  const receiptPayload = await receiptResponse.json();

  console.log("4. receipt ready");
  console.log(receiptPayload.receipt);
}

main().catch((error) => {
  console.error("Bike checkout simulation failed");
  console.error(error);
  process.exitCode = 1;
});
