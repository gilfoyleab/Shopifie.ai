export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const DEFAULT_DEMO_MERCHANT_WALLET = "Bt9oNR5cCtnfuMmXgWELd6q5i974PdEMQDUE55nBC57L";

export type CheckoutStatus =
  | "checkout_ready"
  | "payment_preparing"
  | "payment_pending"
  | "paid"
  | "failed"
  | "expired";

export type CheckoutProductInput = {
  id?: string | number | null;
  title: string;
  source?: string | null;
  price?: string | number | null;
  extractedPrice?: number | null;
  link?: string | null;
  thumbnail?: string | null;
  rating?: number | null;
  reviews?: number | null;
  delivery?: string | null;
  description?: string | null;
};

export type CheckoutProductSnapshot = {
  id: string;
  title: string;
  source: string;
  merchantPriceLabel: string;
  extractedPrice: number | null;
  link: string;
  thumbnail: string | null;
  rating: number | null;
  reviews: number | null;
  delivery: string | null;
  description: string | null;
};

export type CheckoutPricing = {
  merchantPriceLabel: string;
  demoSettlementLabel: string;
  settlementAtomicAmount: number;
  settlementUiAmount: number;
  settlementMint: string;
  settlementSymbol: string;
  shippingLabel: string;
  feeLabel: string;
  totalLabel: string;
};

export type DemoMerchant = {
  label: string;
  wallet: string;
  network: "devnet";
};

export type PrivateMppIntent = {
  profile: "private-mpp";
  protocol: "x402";
  rail: "magicblock-private-payments";
  privacyLayer: "per";
  erUsage: "payment-on-per-with-private-payment-api";
  technicalDesign: "x402-with-private-payment-api";
  paymentType: "spl-transfer";
  resource: string;
  description: string;
  network: "solana-devnet";
  merchantWallet: string;
  mint: string;
  amount: number;
  amountLabel: string;
  clientRefId: string;
};

export type MagicBlockTransferRequest = {
  from: string;
  to: string;
  mint: string;
  amount: number;
  visibility: "private";
  fromBalance: "base";
  toBalance: "base";
  cluster: "devnet";
  initIfMissing: boolean;
  initAtasIfMissing: boolean;
  initVaultIfMissing: false;
  memo?: string;
  minDelayMs: "0";
  maxDelayMs: "0";
  clientRefId: string;
  split: 1;
  gasless: boolean;
  legacy?: boolean;
};

export type MagicBlockPreparedResponse = {
  kind?: "transfer";
  version?: "legacy" | "v0";
  transactionBase64?: string;
  sendTo?: "base" | "ephemeral";
  recentBlockhash?: string;
  lastValidBlockHeight?: number;
  instructionCount?: number;
  requiredSigners?: string[];
  validator?: string;
  demo?: boolean;
};

export type CheckoutPaymentState = {
  customerWallet: string | null;
  clientRefId: string;
  mode: "live" | "demo" | null;
  protocol: "x402";
  rail: "magicblock-private-payments";
  privacyLayer: "per";
  preparedAt: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
  signature: string | null;
  rpcUrl: string | null;
  receiverTokenAccount: string | null;
  receiverTokenBalance: string | null;
  receiverExplorerTarget: "wallet" | "token_account" | null;
  request: MagicBlockTransferRequest | null;
  response: MagicBlockPreparedResponse | null;
  lastError: string | null;
};

export type CheckoutSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  status: CheckoutStatus;
  product: CheckoutProductSnapshot;
  pricing: CheckoutPricing;
  merchant: DemoMerchant;
  mppIntent: PrivateMppIntent;
  note: string;
  payment: CheckoutPaymentState;
};
