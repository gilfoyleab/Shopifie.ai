import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { SOLANA_DEVNET_CAIP2, toClientSvmSigner } from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { DEFAULT_DEMO_MERCHANT_WALLET } from "@/lib/checkout/types";

const RPC_URL = process.env.SOLANA_DEVNET_RPC || "https://api.devnet.solana.com";
const PORT = Number(process.env.X402_E2E_PORT || 3042);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WALLET_DIR = path.join(process.cwd(), ".wallets");
const PAYER_WALLET_PATH =
  process.env.X402_E2E_PAYER_KEYPAIR || path.join(WALLET_DIR, "x402-e2e-payer.json");
const MERCHANT_WALLET = process.env.BUYBIRD_DEMO_MERCHANT_WALLET || DEFAULT_DEMO_MERCHANT_WALLET;
const TOKEN_DECIMALS = 6;
const TOKEN_UNITS_TO_MINT = 10n * 10n ** BigInt(TOKEN_DECIMALS);

type CheckoutCreateResponse = {
  checkout: {
    id: string;
    merchant: {
      wallet: string;
    };
    pricing: {
      settlementAtomicAmount: number;
      settlementMint: string;
    };
  };
};

async function loadOrCreatePayer() {
  await mkdir(WALLET_DIR, { recursive: true });

  try {
    const raw = await readFile(PAYER_WALLET_PATH, "utf8");
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
  } catch {
    if (process.env.X402_E2E_PAYER_KEYPAIR) {
      throw new Error(`Unable to load X402_E2E_PAYER_KEYPAIR at ${PAYER_WALLET_PATH}`);
    }

    const payer = Keypair.generate();
    await writeFile(PAYER_WALLET_PATH, JSON.stringify(Array.from(payer.secretKey)), {
      mode: 0o600,
    });
    return payer;
  }
}

async function confirmAirdrop(connection: Connection, signature: string) {
  const blockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    },
    "confirmed",
  );
}

async function ensureSolBalance(connection: Connection, payer: Keypair) {
  const balance = await connection.getBalance(payer.publicKey, "confirmed");
  if (balance >= 0.35 * LAMPORTS_PER_SOL) {
    return;
  }

  const signature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
  await confirmAirdrop(connection, signature);
}

async function createFundedTestMint(connection: Connection, payer: Keypair) {
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    TOKEN_DECIMALS,
    undefined,
    undefined,
    undefined,
  );
  const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );
  const merchantTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    new PublicKey(MERCHANT_WALLET),
  );

  await mintTo(
    connection,
    payer,
    mint,
    payerTokenAccount.address,
    payer,
    TOKEN_UNITS_TO_MINT,
  );

  return {
    mint,
    payerTokenAccount: payerTokenAccount.address,
    merchantTokenAccount: merchantTokenAccount.address,
  };
}

function startDevServer(settlementMint: string) {
  const child = spawn("npm", ["run", "dev", "--", "--port", String(PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BUYBIRD_DEMO_MERCHANT_WALLET: MERCHANT_WALLET,
      BUYBIRD_SETTLEMENT_MINT: settlementMint,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[next] ${data}`);
  });
  child.stderr.on("data", (data) => {
    process.stderr.write(`[next] ${data}`);
  });

  return child;
}

async function waitForServer(child: ChildProcessWithoutNullStreams) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 60_000) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev server exited with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(BASE_URL, { cache: "no-store" });
      if (response.status < 500) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error("Timed out waiting for Next dev server");
}

async function createCheckout() {
  const response = await fetch(`${BASE_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product: {
        title: "Solana x402 Private MPP E2E",
        source: "Devnet E2E",
        price: "$0.53",
        extractedPrice: 0.53,
        link: "https://example.com/private-mpp-e2e",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Create checkout failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as CheckoutCreateResponse;
}

function buildPaidFetch(payer: Keypair) {
  return async (url: string) => {
    const keypairSigner = await createKeyPairSignerFromBytes(payer.secretKey);
    const svmSigner = toClientSvmSigner(keypairSigner);
    const client = registerExactSvmScheme(new x402Client(), {
      signer: svmSigner,
      networks: [SOLANA_DEVNET_CAIP2],
    });
    const paidFetch = wrapFetchWithPayment(fetch, client);

    return paidFetch(url, { cache: "no-store" });
  };
}

function decodePaymentHeader(response: Response) {
  const encoded =
    response.headers.get("x-payment-response") || response.headers.get("payment-response");

  if (!encoded) {
    return null;
  }

  try {
    return decodePaymentResponseHeader(encoded);
  } catch {
    return { raw: encoded };
  }
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const payer = await loadOrCreatePayer();
  await ensureSolBalance(connection, payer);

  const testToken = await createFundedTestMint(connection, payer);
  const server = startDevServer(testToken.mint.toBase58());

  try {
    await waitForServer(server);

    const checkout = await createCheckout();
    const checkoutId = checkout.checkout.id;
    const protectedUrl = `${BASE_URL}/api/checkout/${checkoutId}/protected`;

    const unpaidResponse = await fetch(protectedUrl, { cache: "no-store" });
    if (unpaidResponse.status !== 402) {
      throw new Error(`Expected unpaid request to return 402, got ${unpaidResponse.status}`);
    }

    const beforeMerchantAccount = await getAccount(connection, testToken.merchantTokenAccount);
    const paidResponse = await buildPaidFetch(payer)(protectedUrl);
    const paidBody = await paidResponse.json();

    if (!paidResponse.ok) {
      throw new Error(`Paid request failed: ${paidResponse.status} ${JSON.stringify(paidBody)}`);
    }

    const afterMerchantAccount = await getAccount(connection, testToken.merchantTokenAccount);
    const merchantDelta = afterMerchantAccount.amount - beforeMerchantAccount.amount;

    if (merchantDelta < BigInt(checkout.checkout.pricing.settlementAtomicAmount)) {
      throw new Error(
        `Merchant token delta ${merchantDelta} is smaller than quoted amount ${checkout.checkout.pricing.settlementAtomicAmount}`,
      );
    }

    const paymentResponse = decodePaymentHeader(paidResponse);

    console.log("");
    console.log("Solana x402 devnet E2E passed");
    console.log({
      checkoutId,
      protectedStatus: paidResponse.status,
      unlocked: paidBody.unlocked,
      network: SOLANA_DEVNET_CAIP2,
      mint: testToken.mint.toBase58(),
      payer: payer.publicKey.toBase58(),
      payerTokenAccount: testToken.payerTokenAccount.toBase58(),
      merchant: MERCHANT_WALLET,
      merchantTokenAccount: testToken.merchantTokenAccount.toBase58(),
      quotedAtomicAmount: checkout.checkout.pricing.settlementAtomicAmount,
      merchantTokenDelta: merchantDelta.toString(),
      paymentResponse,
    });
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error("Solana x402 devnet E2E failed");
  console.error(error);
  process.exitCode = 1;
});
