import { getCheckoutSession } from "@/lib/checkout/store";

export async function GET(
  _req: Request,
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

  if (checkout.status === "paid") {
    return Response.json({
      success: true,
      paid: true,
      checkoutId: checkout.id,
      signature: checkout.payment.signature,
      mode: checkout.payment.mode,
      receiptUrl: `/api/checkout/${checkout.id}/receipt`,
    });
  }

  return Response.json(
    {
      x402Version: 1,
      error: "X402_PAYMENT_REQUIRED",
      profile: checkout.mppIntent.profile,
      technicalDesign: checkout.mppIntent.technicalDesign,
      accepts: [
        {
          scheme: "exact",
          network: checkout.mppIntent.network,
          resource: checkout.mppIntent.resource,
          description: checkout.mppIntent.description,
          payTo: checkout.mppIntent.merchantWallet,
          asset: checkout.mppIntent.mint,
          maxAmountRequired: String(checkout.mppIntent.amount),
          amountLabel: checkout.mppIntent.amountLabel,
          mimeType: "application/json",
          extra: {
            profile: checkout.mppIntent.profile,
            protocol: checkout.mppIntent.protocol,
            rail: checkout.mppIntent.rail,
            privacyLayer: checkout.mppIntent.privacyLayer,
            erUsage: checkout.mppIntent.erUsage,
            technicalDesign: checkout.mppIntent.technicalDesign,
            paymentType: checkout.mppIntent.paymentType,
            clientRefId: checkout.mppIntent.clientRefId,
            solanaX402ProtectedUrl: `/api/checkout/${checkout.id}/protected`,
            prepareUrl: `/api/checkout/${checkout.id}/prepare-payment`,
            submitUrl: `/api/checkout/${checkout.id}/submit-payment`,
          },
        },
      ],
    },
    {
      status: 402,
      headers: {
        "X-Payment-Protocol": "x402",
        "X-Payment-Rail": "magicblock-private-payments",
      },
    },
  );
}
