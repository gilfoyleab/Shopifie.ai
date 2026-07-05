import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { SolanaProvider } from "@/components/solana-provider";

export const metadata: Metadata = {
  title: "Buybird",
  description:
    "A Private MPP MVP for agent-to-merchant payments using x402-style negotiation with MagicBlock Private Payment API on PER.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
