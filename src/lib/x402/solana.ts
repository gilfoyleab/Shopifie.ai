import { HTTPFacilitatorClient } from "@x402/core/server";
import type { HTTPRequestContext } from "@x402/core/server";
import type { Price } from "@x402/core/types";
import { x402ResourceServer } from "@x402/next";
import { registerExactSvmScheme } from "@x402/svm/exact/server";
import { DEVNET_USDC_MINT } from "@/lib/checkout/types";
import { getCheckoutSession } from "@/lib/checkout/store";

export const SOLANA_X402_DEVNET_NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

const facilitatorUrl =
  process.env.X402_FACILITATOR_URL || "https://facilitator.payai.network";

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

export const solanaX402Server = registerExactSvmScheme(
  new x402ResourceServer(facilitatorClient),
  {
    networks: [SOLANA_X402_DEVNET_NETWORK],
  },
);

export function getCheckoutIdFromX402Context(context: HTTPRequestContext) {
  const match = context.path.match(/\/api\/checkout\/([^/]+)\/protected/);
  return match?.[1] ?? null;
}

export function getPayToForCheckout(context: HTTPRequestContext) {
  const checkoutId = getCheckoutIdFromX402Context(context);
  const checkout = checkoutId ? getCheckoutSession(checkoutId) : null;

  return checkout?.merchant.wallet || process.env.BUYBIRD_DEMO_MERCHANT_WALLET || "";
}

export function getPriceForCheckout(context: HTTPRequestContext): Price {
  const checkoutId = getCheckoutIdFromX402Context(context);
  const checkout = checkoutId ? getCheckoutSession(checkoutId) : null;

  if (!checkout) {
    return {
      asset: DEVNET_USDC_MINT,
      amount: "1",
      extra: {
        rail: "magicblock-private-payments",
        error: "checkout-not-found",
      },
    };
  }

  return {
    asset: checkout.pricing.settlementMint,
    amount: String(checkout.pricing.settlementAtomicAmount),
    extra: {
      checkoutId: checkout.id,
      clientRefId: checkout.payment.clientRefId,
      rail: checkout.mppIntent.rail,
      privacyLayer: checkout.mppIntent.privacyLayer,
      erUsage: checkout.mppIntent.erUsage,
      technicalDesign: checkout.mppIntent.technicalDesign,
      magicBlockPrepareUrl: `/api/checkout/${checkout.id}/prepare-payment`,
      magicBlockSubmitUrl: `/api/checkout/${checkout.id}/submit-payment`,
    },
  };
}
