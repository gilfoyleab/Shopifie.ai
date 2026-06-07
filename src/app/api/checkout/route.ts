import { z } from "zod";
import { createCheckoutSession } from "@/lib/checkout/store";

const checkoutProductSchema = z.object({
  id: z.union([z.string(), z.number()]).optional().nullable(),
  title: z.string().min(1),
  source: z.string().optional().nullable(),
  price: z.union([z.string(), z.number()]).optional().nullable(),
  extractedPrice: z.number().optional().nullable(),
  link: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  rating: z.number().optional().nullable(),
  reviews: z.number().optional().nullable(),
  delivery: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutProductSchema.safeParse(body?.product);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "A valid product snapshot is required to create a checkout session.",
        },
        { status: 400 },
      );
    }

    const checkout = createCheckoutSession(parsed.data);

    return Response.json({
      success: true,
      checkout,
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to create checkout session.",
      },
      { status: 500 },
    );
  }
}
