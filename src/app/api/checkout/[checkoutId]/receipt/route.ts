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

  if (checkout.status !== "paid") {
    return Response.json(
      {
        success: false,
        message: "Receipt is only available after payment succeeds.",
        checkout,
      },
      { status: 409 },
    );
  }

  return Response.json({
    success: true,
    receipt: {
      checkoutId: checkout.id,
      productTitle: checkout.product.title,
      merchant: checkout.merchant.label,
      listingPrice: checkout.pricing.merchantPriceLabel,
      settledAmount: checkout.pricing.totalLabel,
      clientRefId: checkout.payment.clientRefId,
      signature: checkout.payment.signature,
      rpcUrl: checkout.payment.rpcUrl,
      paidAt: checkout.payment.confirmedAt,
      mode: checkout.payment.mode,
      protocol: checkout.payment.protocol,
      rail: checkout.payment.rail,
      privacyLayer: checkout.payment.privacyLayer,
      mppIntent: checkout.mppIntent,
      receiverWallet: checkout.merchant.wallet,
      receiverTokenAccount: checkout.payment.receiverTokenAccount,
      receiverTokenBalance: checkout.payment.receiverTokenBalance,
      receiverExplorerTarget: checkout.payment.receiverExplorerTarget,
      settlementMint: checkout.pricing.settlementMint,
      note: checkout.note,
    },
  });
}
