import type { CheckoutProductInput } from "@/lib/checkout/types";

export const demoBikeProduct: CheckoutProductInput = {
  id: "bike-demo-001",
  title: "Polygon Cascade 4 Hardtail Mountain Bike",
  source: "Buybird Demo Garage",
  price: "$649.00",
  extractedPrice: 649,
  link: "https://example.com/demo-bike",
  thumbnail:
    "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=900&q=80",
  rating: 4.7,
  reviews: 184,
  delivery: "Ships in 5-7 days",
  description:
    "A demo trail bike fixture used for checkout and devnet payment simulations.",
};
