import fs from "node:fs";
import path from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import { DEVNET_USDC_MINT } from "@/lib/checkout/types";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split("=");
    return [key.replace(/^--/, ""), value];
  }),
);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const merchantWalletPath = path.resolve(process.cwd(), ".wallets", "demo-merchant-devnet.json");

function loadMerchantPubkey() {
  if (args.get("merchant")) {
    return new PublicKey(args.get("merchant")!);
  }

  if (process.env.BUYBIRD_DEMO_MERCHANT_WALLET) {
    return new PublicKey(process.env.BUYBIRD_DEMO_MERCHANT_WALLET);
  }

  if (fs.existsSync(merchantWalletPath)) {
    const secret = JSON.parse(fs.readFileSync(merchantWalletPath, "utf8")) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey;
  }

  throw new Error(
    "No merchant wallet found. Run `npm run wallet:merchant` or pass --merchant=<pubkey>.",
  );
}

async function getSolBalance(publicKey: PublicKey) {
  const lamports = await connection.getBalance(publicKey);
  return lamports / 1_000_000_000;
}

async function getTokenBalance(owner: PublicKey, mint: PublicKey) {
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
    mint,
  });

  const amount =
    accounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmountString ?? "0";

  return {
    amount,
    ataCount: accounts.value.length,
  };
}

async function main() {
  const merchant = loadMerchantPubkey();
  const buyer = args.get("buyer") ? new PublicKey(args.get("buyer")!) : null;
  const mint = new PublicKey(args.get("mint") || DEVNET_USDC_MINT);

  const merchantSol = await getSolBalance(merchant);
  const merchantToken = await getTokenBalance(merchant, mint);

  console.log("Merchant devnet balances");
  console.log({
    merchant: merchant.toBase58(),
    sol: merchantSol.toFixed(6),
    mint: mint.toBase58(),
    tokenBalance: merchantToken.amount,
    tokenAccounts: merchantToken.ataCount,
  });

  if (buyer) {
    const buyerSol = await getSolBalance(buyer);
    const buyerToken = await getTokenBalance(buyer, mint);

    console.log("");
    console.log("Buyer devnet balances");
    console.log({
      buyer: buyer.toBase58(),
      sol: buyerSol.toFixed(6),
      mint: mint.toBase58(),
      tokenBalance: buyerToken.amount,
      tokenAccounts: buyerToken.ataCount,
    });
  }

  console.log("");
  console.log(
    "Note: our current private transfer request uses `toBalance: base`, so the merchant wallet should be verified on base-chain devnet token balances after live submission.",
  );
}

main().catch((error) => {
  console.error("Failed to check devnet balances");
  console.error(error);
  process.exitCode = 1;
});
