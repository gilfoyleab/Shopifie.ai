import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import {
  getCheckoutSession,
  prepareMagicBlockPayment,
  resolveReceiverSettlementDetails,
  updateCheckoutSession,
} from "@/lib/checkout/store";

const preparePaymentSchema = z.object({
  walletAddress: z.string().min(32),
});

function isValidPublicKey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ checkoutId: string }> },
) {
  const { checkoutId } = await params;
  const checkout = getCheckoutSession(checkoutId);

  if (!checkout) {
    return Response.json(
      {
        success: false,
        message: "Checkout session not found.",
      },
      { status: 404 },
    );
  }

  if (checkout.status === "expired") {
    return Response.json(
      {
        success: false,
        message: "Checkout session has expired. Start a new one from the product card.",
      },
      { status: 410 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = preparePaymentSchema.safeParse(body);

  if (!parsed.success || !isValidPublicKey(parsed.data.walletAddress)) {
    return Response.json(
      {
        success: false,
        message: "Enter a valid Solana wallet address before preparing payment.",
      },
      { status: 400 },
    );
  }

  updateCheckoutSession(checkoutId, (session) => ({
    ...session,
    status: "payment_preparing",
    payment: {
      ...session.payment,
      customerWallet: parsed.data.walletAddress,
      lastError: null,
      submittedAt: null,
      confirmedAt: null,
      signature: null,
      rpcUrl: null,
    },
  }));

  const prepared = await prepareMagicBlockPayment(checkout, parsed.data.walletAddress);
  const receiverDetails = await resolveReceiverSettlementDetails(
    checkout.merchant.wallet,
    checkout.pricing.settlementMint,
  );

  const nextStatus = prepared.mode === "live" ? "payment_pending" : "checkout_ready";

  const updated = updateCheckoutSession(checkoutId, (session) => ({
    ...session,
    status: nextStatus,
    payment: {
      ...session.payment,
      customerWallet: parsed.data.walletAddress,
      mode: prepared.mode,
      preparedAt: new Date().toISOString(),
      submittedAt: null,
      confirmedAt: null,
      signature: null,
      rpcUrl: null,
      receiverTokenAccount: receiverDetails.receiverTokenAccount,
      receiverTokenBalance: receiverDetails.receiverTokenBalance,
      receiverExplorerTarget: receiverDetails.receiverExplorerTarget,
      request: prepared.request,
      response: prepared.response,
      lastError: prepared.error,
    },
  }));

  return Response.json({
    success: true,
    checkout: updated,
    prepared: updated?.payment ?? null,
  });
}
