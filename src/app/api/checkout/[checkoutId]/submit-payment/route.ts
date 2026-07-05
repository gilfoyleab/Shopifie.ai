import { z } from "zod";
import {
  getCheckoutSession,
  resolveReceiverSettlementDetails,
  submitPreparedPayment,
  updateCheckoutSession,
} from "@/lib/checkout/store";

const submitPaymentSchema = z.object({
  signedTransactionBase64: z.string().optional(),
  simulate: z.boolean().optional(),
});

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

  if (!checkout.payment.request || !checkout.payment.response) {
    return Response.json(
      {
        success: false,
        message: "Prepare payment before submitting it.",
      },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = submitPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: "Invalid payment submission payload.",
      },
      { status: 400 },
    );
  }

  try {
    const submitted = await submitPreparedPayment(checkout, parsed.data);
    const receiverDetails = await resolveReceiverSettlementDetails(
      checkout.merchant.wallet,
      checkout.pricing.settlementMint,
      submitted.rpcUrl,
    );

    const updated = updateCheckoutSession(checkoutId, (session) => ({
      ...session,
      status: "paid",
      payment: {
        ...session.payment,
        mode: submitted.mode,
        submittedAt: submitted.submittedAt,
        confirmedAt: submitted.confirmedAt,
        signature: submitted.signature,
        rpcUrl: submitted.rpcUrl,
        receiverTokenAccount: receiverDetails.receiverTokenAccount,
        receiverTokenBalance: receiverDetails.receiverTokenBalance,
        receiverExplorerTarget: receiverDetails.receiverExplorerTarget,
        lastError: null,
      },
    }));

    return Response.json({
      success: true,
      checkout: updated,
      receipt: updated
        ? {
            checkoutId: updated.id,
            status: updated.status,
            signature: updated.payment.signature,
            paidAt: updated.payment.confirmedAt,
            mode: updated.payment.mode,
            protocol: updated.payment.protocol,
            rail: updated.payment.rail,
            privacyLayer: updated.payment.privacyLayer,
            mppIntent: updated.mppIntent,
            merchant: updated.merchant.label,
            total: updated.pricing.totalLabel,
            receiverWallet: updated.merchant.wallet,
            receiverTokenAccount: updated.payment.receiverTokenAccount,
            receiverTokenBalance: updated.payment.receiverTokenBalance,
            receiverExplorerTarget: updated.payment.receiverExplorerTarget,
          }
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit the prepared payment.";

    const updated = updateCheckoutSession(checkoutId, (session) => ({
      ...session,
      status: "failed",
      payment: {
        ...session.payment,
        lastError: message,
      },
    }));

    return Response.json(
      {
        success: false,
        message,
        checkout: updated,
      },
      { status: 500 },
    );
  }
}
