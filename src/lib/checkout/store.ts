import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  CheckoutProductInput,
  CheckoutSession,
  DEFAULT_DEMO_MERCHANT_WALLET,
  DEVNET_USDC_MINT,
  MagicBlockPreparedResponse,
  MagicBlockTransferRequest,
} from "@/lib/checkout/types";

const CHECKOUT_TTL_MS = 15 * 60 * 1000;
const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";
const MAGICBLOCK_DEVNET_ROUTER = "https://devnet-router.magicblock.app";

declare global {
  var __buybirdCheckoutStore: Map<string, CheckoutSession> | undefined;
}

function getStore() {
  if (!globalThis.__buybirdCheckoutStore) {
    globalThis.__buybirdCheckoutStore = new Map<string, CheckoutSession>();
  }

  return globalThis.__buybirdCheckoutStore;
}

export function resetCheckoutStore() {
  getStore().clear();
}

type ReceiverSettlementDetails = {
  receiverTokenAccount: string | null;
  receiverTokenBalance: string | null;
  receiverExplorerTarget: "wallet" | "token_account";
};

function parseExtractedPrice(input: CheckoutProductInput) {
  if (typeof input.extractedPrice === "number" && Number.isFinite(input.extractedPrice)) {
    return input.extractedPrice;
  }

  if (typeof input.price === "number" && Number.isFinite(input.price)) {
    return input.price;
  }

  if (typeof input.price === "string") {
    const numeric = Number.parseFloat(input.price.replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function deriveDemoSettlementUiAmount() {
  const min = 0.2;
  const max = 2;
  const randomValue = Math.random() * (max - min) + min;
  return Math.round(randomValue * 100) / 100;
}

function toAtomicAmount(uiAmount: number) {
  return Math.max(1, Math.round(uiAmount * 1_000_000));
}

function makeNumericRefId() {
  const seed = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return seed.slice(-12);
}

function ensureCheckoutIsFresh(session: CheckoutSession) {
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    session.status = "expired";
  }

  return session;
}

export function createCheckoutSession(product: CheckoutProductInput) {
  const extractedPrice = parseExtractedPrice(product);
  const settlementUiAmount = deriveDemoSettlementUiAmount();
  const settlementAtomicAmount = toAtomicAmount(settlementUiAmount);
  const checkoutId = crypto.randomUUID();

  const session: CheckoutSession = {
    id: checkoutId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS).toISOString(),
    status: "checkout_ready",
    product: {
      id: String(product.id ?? crypto.randomUUID()),
      title: product.title,
      source: product.source?.trim() || "Unknown merchant",
      merchantPriceLabel: String(product.price ?? "View merchant price"),
      extractedPrice,
      link: product.link?.trim() || "#",
      thumbnail: product.thumbnail ?? null,
      rating: product.rating ?? null,
      reviews: product.reviews ?? null,
      delivery: product.delivery ?? null,
      description: product.description ?? null,
    },
    pricing: {
      merchantPriceLabel: String(product.price ?? "View merchant price"),
      demoSettlementLabel: `${settlementUiAmount.toFixed(2)} dUSDC`,
      settlementAtomicAmount,
      settlementUiAmount,
      settlementMint: DEVNET_USDC_MINT,
      settlementSymbol: "dUSDC",
      shippingLabel: "Calculated off-platform",
      feeLabel: "0.00 dUSDC",
      totalLabel: `${settlementUiAmount.toFixed(2)} dUSDC`,
    },
    merchant: {
      label: "Buybird Demo Merchant",
      wallet: process.env.BUYBIRD_DEMO_MERCHANT_WALLET || DEFAULT_DEMO_MERCHANT_WALLET,
      network: "devnet",
    },
    note:
      "This checkout preserves the real product listing while settling a capped devnet demo amount through Buybird's internal merchant flow.",
    payment: {
      customerWallet: null,
      clientRefId: makeNumericRefId(),
      mode: null,
      preparedAt: null,
      submittedAt: null,
      confirmedAt: null,
      signature: null,
      rpcUrl: null,
      receiverTokenAccount: null,
      receiverTokenBalance: null,
      receiverExplorerTarget: null,
      request: null,
      response: null,
      lastError: null,
    },
  };

  getStore().set(session.id, session);
  return session;
}

export function getCheckoutSession(id: string) {
  const session = getStore().get(id);
  return session ? ensureCheckoutIsFresh(session) : null;
}

export function updateCheckoutSession(id: string, updater: (session: CheckoutSession) => CheckoutSession) {
  const current = getCheckoutSession(id);

  if (!current) {
    return null;
  }

  const next = updater({ ...current });
  getStore().set(id, next);
  return next;
}

export function getPaymentRpcUrl(sendTo: "base" | "ephemeral" | undefined) {
  return sendTo === "ephemeral" ? MAGICBLOCK_DEVNET_ROUTER : SOLANA_DEVNET_RPC;
}

export function createSimulatedSignature(checkoutId: string) {
  return `sim-${checkoutId.slice(0, 8)}-${Date.now()}`;
}

export async function resolveReceiverSettlementDetails(
  ownerWallet: string,
  mintAddress: string,
  rpcUrl = SOLANA_DEVNET_RPC,
): Promise<ReceiverSettlementDetails> {
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const owner = new PublicKey(ownerWallet);
    const mint = new PublicKey(mintAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });
    const parsedAccounts = tokenAccounts.value
      .map((account) => {
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        return {
          pubkey: account.pubkey.toBase58(),
          uiAmount: tokenAmount.uiAmount ?? 0,
          uiAmountString: tokenAmount.uiAmountString || "0",
        };
      })
      .sort((left, right) => right.uiAmount - left.uiAmount);

    const primaryAccount = parsedAccounts[0];

    if (!primaryAccount) {
      return {
        receiverTokenAccount: null,
        receiverTokenBalance: null,
        receiverExplorerTarget: "wallet",
      };
    }

    return {
      receiverTokenAccount: primaryAccount.pubkey,
      receiverTokenBalance: primaryAccount.uiAmountString,
      receiverExplorerTarget: "token_account",
    };
  } catch {
    return {
      receiverTokenAccount: null,
      receiverTokenBalance: null,
      receiverExplorerTarget: "wallet",
    };
  }
}

export function buildMagicBlockTransferRequest(session: CheckoutSession, customerWallet: string): MagicBlockTransferRequest {
  return {
    from: customerWallet,
    to: session.merchant.wallet,
    mint: session.pricing.settlementMint,
    amount: session.pricing.settlementAtomicAmount,
    visibility: "private",
    fromBalance: "base",
    toBalance: "base",
    cluster: "devnet",
    initIfMissing: true,
    initAtasIfMissing: true,
    initVaultIfMissing: false,
    memo: `Buybird checkout ${session.id}`,
    minDelayMs: "0",
    maxDelayMs: "0",
    clientRefId: session.payment.clientRefId,
    split: 1,
    gasless: false,
    legacy: true,
  };
}

export async function prepareMagicBlockPayment(session: CheckoutSession, customerWallet: string) {
  const request = buildMagicBlockTransferRequest(session, customerWallet);
  const apiBaseUrl = process.env.MAGICBLOCK_PAYMENTS_API_URL || "https://payments.magicblock.app";

  try {
    const response = await fetch(`${apiBaseUrl}/v1/spl/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `MagicBlock transfer prep failed with ${response.status}`);
    }

    const payload = (await response.json()) as MagicBlockPreparedResponse;
    return {
      mode: "live" as const,
      request,
      response: payload,
      error: null,
    };
  } catch (error) {
    return {
      mode: "simulated" as const,
      request,
      response: {
        kind: "transfer",
        version: "legacy",
        sendTo: "base",
        instructionCount: 1,
        requiredSigners: [customerWallet],
      } satisfies MagicBlockPreparedResponse,
      error: error instanceof Error ? error.message : "Failed to prepare MagicBlock payment.",
    };
  }
}

export async function submitPreparedPayment(
  session: CheckoutSession,
  options: {
    signedTransactionBase64?: string;
    simulate?: boolean;
  },
) {
  const preparedResponse = session.payment.response;

  if (!session.payment.request || !preparedResponse) {
    throw new Error("Prepare payment before attempting submission.");
  }

  const rpcUrl = getPaymentRpcUrl(preparedResponse.sendTo);
  const submittedAt = new Date().toISOString();

  if (
    options.simulate ||
    session.payment.mode === "simulated" ||
    !preparedResponse.transactionBase64
  ) {
    return {
      mode: "simulated" as const,
      signature: createSimulatedSignature(session.id),
      rpcUrl,
      submittedAt,
      confirmedAt: new Date().toISOString(),
    };
  }

  if (!options.signedTransactionBase64) {
    throw new Error("A signed transaction is required for live devnet submission.");
  }

  const connection = new Connection(rpcUrl, "confirmed");
  const wireTransaction = Buffer.from(options.signedTransactionBase64, "base64");
  const signature = await connection.sendRawTransaction(wireTransaction, {
    skipPreflight: preparedResponse.sendTo === "ephemeral",
    maxRetries: 3,
  });

  if (preparedResponse.recentBlockhash && preparedResponse.lastValidBlockHeight) {
    await connection.confirmTransaction(
      {
        signature,
        blockhash: preparedResponse.recentBlockhash,
        lastValidBlockHeight: preparedResponse.lastValidBlockHeight,
      },
      "confirmed",
    );
  } else {
    await connection.confirmTransaction(signature, "confirmed");
  }

  return {
    mode: "live" as const,
    signature,
    rpcUrl,
    submittedAt,
    confirmedAt: new Date().toISOString(),
  };
}
