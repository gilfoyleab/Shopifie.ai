import { readFile } from "node:fs/promises";
import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { POST as createCheckoutPost } from "@/app/api/checkout/route";
import { POST as preparePaymentPost } from "@/app/api/checkout/[checkoutId]/prepare-payment/route";
import { POST as submitPaymentPost } from "@/app/api/checkout/[checkoutId]/submit-payment/route";
import { GET as receiptGet } from "@/app/api/checkout/[checkoutId]/receipt/route";
import { demoBikeProduct } from "@/lib/checkout/fixtures";
import type { CheckoutSession } from "@/lib/checkout/types";

const attemptLiveSubmit = process.argv.includes("--attempt-live-submit");
const keypairArg = process.argv
  .find((arg) => arg.startsWith("--keypair="))
  ?.replace("--keypair=", "");

function bytesToBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

async function loadLiveBuyer() {
  if (!keypairArg) {
    return null;
  }

  const secret = JSON.parse(await readFile(keypairArg, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function signPreparedTransaction(checkout: CheckoutSession, signer: Keypair) {
  const transactionBase64 = checkout.payment.response?.transactionBase64;

  if (!transactionBase64) {
    throw new Error("MagicBlock did not return a transactionBase64 payload.");
  }

  const transactionBytes = Buffer.from(transactionBase64, "base64");

  if (checkout.payment.response?.version === "v0") {
    const transaction = VersionedTransaction.deserialize(transactionBytes);
    transaction.sign([signer]);
    return bytesToBase64(transaction.serialize());
  }

  const transaction = Transaction.from(transactionBytes);
  transaction.partialSign(signer);
  return bytesToBase64(
    transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }),
  );
}

async function main() {
  const liveBuyer = await loadLiveBuyer();

  if (attemptLiveSubmit && !liveBuyer) {
    throw new Error("Pass --keypair=/path/to/devnet-keypair.json for live submit.");
  }

  const buyerWallet = (liveBuyer ?? Keypair.generate()).publicKey.toBase58();

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
  const preparedCheckout = preparePayload.checkout as CheckoutSession;

  const request = preparePayload.checkout.payment.request;
  console.log("Private transfer prepared");
  console.log({
    checkoutId,
    buyerWallet,
    merchantWallet: preparePayload.checkout.merchant.wallet,
    visibility: request.visibility,
    mint: request.mint,
    amount: request.amount,
    mode: preparedCheckout.payment.mode,
    version: preparedCheckout.payment.response?.version,
    sendTo: preparedCheckout.payment.response?.sendTo || "base",
    hasUnsignedTransaction: Boolean(
      preparedCheckout.payment.response?.transactionBase64,
    ),
    prepareError: preparedCheckout.payment.lastError,
  });

  const simulateSubmit =
    !attemptLiveSubmit ||
    preparedCheckout.payment.mode === "demo" ||
    !preparedCheckout.payment.response?.transactionBase64;

  if (attemptLiveSubmit && simulateSubmit) {
    throw new Error(
      `Live submit requested, but MagicBlock preparation was not live: ${preparedCheckout.payment.lastError}`,
    );
  }

  const signedTransactionBase64 =
    attemptLiveSubmit && liveBuyer ? signPreparedTransaction(preparedCheckout, liveBuyer) : undefined;

  const submitResponse = await submitPaymentPost(
    new Request(`http://localhost/api/checkout/${checkoutId}/submit-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        simulate: simulateSubmit,
        signedTransactionBase64,
      }),
    }),
    { params: Promise.resolve({ checkoutId }) },
  );
  const submitPayload = await submitResponse.json();

  console.log("");
  console.log("Payment submission result");
  console.log({
    demoSubmit: simulateSubmit,
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
