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

  return Response.json({
    success: true,
    checkout,
  });
}
