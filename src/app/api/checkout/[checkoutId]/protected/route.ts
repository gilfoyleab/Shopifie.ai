import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { getCheckoutSession } from "@/lib/checkout/store";
import {
  getPayToForCheckout,
  getPriceForCheckout,
  SOLANA_X402_DEVNET_NETWORK,
  solanaX402Server,
} from "@/lib/x402/solana";

function getCheckoutIdFromRequest(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/\/api\/checkout\/([^/]+)\/protected/);
  return match?.[1] ?? null;
}

type ProtectedCheckoutResponse = {
  success: boolean;
  message?: string;
  unlocked?: boolean;
  checkoutId?: string;
  resource?: string;
  merchant?: string;
  rail?: string;
  privacyLayer?: string;
  next?: {
    prepareMagicBlockPayment: string;
    submitMagicBlockPayment: string;
  };
};

const handler = async (request: NextRequest): Promise<NextResponse<ProtectedCheckoutResponse>> => {
  const checkoutId = getCheckoutIdFromRequest(request);
  const checkout = checkoutId ? getCheckoutSession(checkoutId) : null;

  if (!checkout) {
    return NextResponse.json(
      {
        success: false,
        message: "Checkout session not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    unlocked: true,
    checkoutId: checkout.id,
    resource: checkout.mppIntent.resource,
    merchant: checkout.merchant.label,
    rail: checkout.mppIntent.rail,
    privacyLayer: checkout.mppIntent.privacyLayer,
    next: {
      prepareMagicBlockPayment: `/api/checkout/${checkout.id}/prepare-payment`,
      submitMagicBlockPayment: `/api/checkout/${checkout.id}/submit-payment`,
    },
  });
};

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      network: SOLANA_X402_DEVNET_NETWORK,
      payTo: getPayToForCheckout,
      price: getPriceForCheckout,
      maxTimeoutSeconds: 300,
      extra: {
        rail: "magicblock-private-payments",
        privacyLayer: "per",
      },
    },
    description: "Private MPP merchant checkout action",
    mimeType: "application/json",
    serviceName: "Buybird Private MPP",
    tags: ["private-mpp", "solana", "magicblock"],
  },
  solanaX402Server,
);
