import fs from "node:fs";
import path from "node:path";
import { Keypair } from "@solana/web3.js";

const walletsDir = path.resolve(process.cwd(), ".wallets");
const merchantWalletPath = path.join(walletsDir, "demo-merchant-devnet.json");

function ensureMerchantWallet() {
  if (fs.existsSync(merchantWalletPath)) {
    const secret = JSON.parse(fs.readFileSync(merchantWalletPath, "utf8")) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  }

  fs.mkdirSync(walletsDir, { recursive: true });

  const keypair = Keypair.generate();
  fs.writeFileSync(
    merchantWalletPath,
    JSON.stringify(Array.from(keypair.secretKey), null, 2),
    "utf8",
  );

  return keypair;
}

const merchant = ensureMerchantWallet();

console.log("Demo merchant wallet ready");
console.log({
  publicKey: merchant.publicKey.toBase58(),
  secretPath: merchantWalletPath,
});
console.log("");
console.log("Use this env value for local testing:");
console.log(`BUYBIRD_DEMO_MERCHANT_WALLET=${merchant.publicKey.toBase58()}`);
