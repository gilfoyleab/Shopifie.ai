import { Keypair } from "@solana/web3.js";
import { POST as createCheckoutPost } from "@/app/api/checkout/route";
import { POST as preparePaymentPost } from "@/app/api/checkout/[checkoutId]/prepare-payment/route";
import { POST as submitPaymentPost } from "@/app/api/checkout/[checkoutId]/submit-payment/route";
import { GET as receiptGet } from "@/app/api/checkout/[checkoutId]/receipt/route";
import { demoBikeProduct } from "@/lib/checkout/fixtures";

const attemptLiveSubmit = process.argv.includes("--attempt-live-submit");

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

  const prepareResponse = await preparePaymentPost(
    new Request(`http://localhost/api/checkout/${checkoutId}/prepare-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: buyerWallet }),
    }),
    { params: Promise.resolve({ checkoutId }) },
  );
  const preparePayload = await prepareResponse.json();

  const request = preparePayload.checkout.payment.request;
  console.log("Private transfer prepared");
  console.log({
    checkoutId,
    buyerWallet,
    merchantWallet: preparePayload.checkout.merchant.wallet,
    visibility: request.visibility,
    mint: request.mint,
    amount: request.amount,
    mode: preparePayload.checkout.payment.mode,
    sendTo: preparePayload.checkout.payment.response?.sendTo || "base",
    hasUnsignedTransaction: Boolean(
      preparePayload.checkout.payment.response?.transactionBase64,
    ),
    prepareError: preparePayload.checkout.payment.lastError,
  });

  const simulateSubmit =
    !attemptLiveSubmit ||
    preparePayload.checkout.payment.mode === "simulated" ||
    !preparePayload.checkout.payment.response?.transactionBase64;

  const submitResponse = await submitPaymentPost(
    new Request(`http://localhost/api/checkout/${checkoutId}/submit-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        simulate: simulateSubmit,
      }),
    }),
    { params: Promise.resolve({ checkoutId }) },
  );
  const submitPayload = await submitResponse.json();

  console.log("");
  console.log("Payment submission result");
  console.log({
    simulatedSubmit: simulateSubmit,
    status: submitPayload.checkout.status,
    signature: submitPayload.checkout.payment.signature,
    submittedAt: submitPayload.checkout.payment.submittedAt,
    confirmedAt: submitPayload.checkout.payment.confirmedAt,
    rpcUrl: submitPayload.checkout.payment.rpcUrl,
    error: submitPayload.message || null,
  });

  const receiptResponse = await receiptGet(
    new Request(`http://localhost/api/checkout/${checkoutId}/receipt`),
    { params: Promise.resolve({ checkoutId }) },
  );
  const receiptPayload = await receiptResponse.json();

  console.log("");
  console.log("Receipt");
  console.log(receiptPayload.receipt);
}

main().catch((error) => {
  console.error("Private transfer test flow failed");
  console.error(error);
  process.exitCode = 1;
});
