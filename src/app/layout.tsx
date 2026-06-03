import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buybird",
  description:
    "A focused shopping agent MVP with product discovery, verification, checkout state, and MagicBlock private payments on devnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
