<p align="center">
  <img src="https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Payments-MagicBlock_TEE-10B981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Live_MVP-22c55e?style=for-the-badge" />
</p>

<h1 align="center">🐦 Buybird</h1>

<p align="center">
  <strong>The Private Web3 Concierge — AI-Powered Shopping with TEE Escrow on Solana</strong>
</p>

<p align="center">
  <em>Frictionless AI Shopping · Zero Chargebacks · Total Privacy</em>
</p>

<p align="center">
  <a href="https://buybird.vercel.app">🌐 Live Demo</a> · 
  <a href="https://buybird.vercel.app/pitch.html">📊 Pitch Deck</a> · 
  <a href="https://github.com/shumhn/shopping-agent">📦 Source Code</a>
</p>

---

## 🧠 What is Buybird?

Buybird is an **AI-powered shopping concierge** that finds products and books services from a curated partner network, then completes **private stablecoin payments** through **MagicBlock TEE (Trusted Execution Environment) escrow** on Solana.

> **Think of it as:** Your personal AI shopper that pays in crypto — privately, securely, and with zero chargebacks.

Users simply chat with the Buybird AI, describe what they need, and the agent handles everything — from discovery to private checkout — all without exposing wallet addresses or transaction details on the public ledger.

---

## 🔥 The Problem

| Pain Point | Who It Hurts |
|---|---|
| **Privacy is dead** — Booking a hotel exposes your credit card, identity, and location to dozens of databases | Crypto users, high-net-worth individuals |
| **AI agents hit walls** — Retailers block bots with captchas, giving AI your fiat card is a liability | AI-first shoppers, developers |
| **Merchants suffer** — High chargeback rates and 3%+ card processing fees eat margins | Hotels, e-commerce, small businesses |

> 💡 Crypto holders have billions in stablecoins but **no private, seamless way to spend them in the real world.**

---

## ✨ The Solution

Buybird connects crypto users with a **curated network of crypto-friendly merchants** through an AI concierge:

```
User Prompt → AI Search → Partner Results → USDC Payment → TEE Escrow → Private Settlement
```

- **For Users:** Chat with the AI. It finds exactly what you need from our partner network.
- **For Payments:** Pay in USDC. Funds are locked in a MagicBlock TEE Escrow.
- **For Privacy:** Wallet addresses and transaction details remain entirely private from the public ledger.
- **For Merchants:** Zero chargebacks, instant USDC settlement, simple onboarding.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  Next.js 16 · React · TypeScript · Custom Chat UI       │
│  Solana Wallet Adapter (Phantom / Backpack)              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    AI AGENT LAYER                        │
│  Google Gemini via Vercel AI SDK                         │
│  Tool Calling: Product Search · Checkout Orchestration   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   DATA & SEARCH                         │
│  SerpAPI · Google Shopping · Live Price Extraction        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  PAYMENT LAYER                          │
│  MagicBlock TEE Escrow · Solana Devnet                   │
│  Private Transfers · USDC Settlement                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛒 How It Works

### 1. 🔍 Discover
The user describes what they want in natural language:
> *"Find me a luxury hotel in Bali for next week"*

The AI agent searches the partner network and returns curated, ranked results.

### 2. 🛍️ Select
The user reviews product cards with real pricing and clicks **"Buy via Agent"** to initiate checkout.

### 3. 🔒 Escrow
The backend creates a checkout session and locks the item, amount, merchant destination, and expiry. MagicBlock builds an unsigned private payment transaction.

### 4. ✍️ Sign
The user's wallet (Phantom/Backpack) signs the prepared transaction. The AI never has direct access to funds.

### 5. 🔐 Private Settlement
The signed transaction is submitted on Solana devnet. MagicBlock's TEE ensures the transfer is **completely private** — no wallet addresses or amounts visible on the public ledger.

### 6. ✅ Receipt
The app confirms payment with a full receipt including Solscan explorer links.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React, TypeScript |
| **AI Engine** | Google Gemini via Vercel AI SDK |
| **Search** | SerpAPI + Google Shopping |
| **Wallet** | Solana Wallet Adapter (Phantom, Backpack) |
| **Payments** | MagicBlock TEE Private Transfers |
| **Network** | Solana Devnet |
| **Deployment** | Vercel |
| **Styling** | Custom CSS (no Tailwind) |

---

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/chat` | Gemini AI orchestration + search tool invocation |
| `POST` | `/api/checkout` | Create locked checkout session from selected product |
| `GET` | `/api/checkout/[id]` | Retrieve checkout session and status |
| `POST` | `/api/checkout/[id]/prepare-payment` | Validate wallet + prepare MagicBlock private payment |
| `POST` | `/api/checkout/[id]/submit-payment` | Accept signed transaction and submit to devnet |
| `GET` | `/api/checkout/[id]/receipt` | Return payment receipt / order confirmation |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Solana wallet (Phantom or Backpack) set to **Devnet**

### Installation

```bash
# Clone the repo
git clone https://github.com/gilfoyleab/Shopifie.ai.git
cd Shopifie.ai

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
SERPAPI_API_KEY=your_serpapi_key
NEXT_PUBLIC_ER_RPC_URL=https://devnet-us.magicblock.app
NEXT_PUBLIC_TEE_RPC_URL=https://devnet-tee.magicblock.app
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Commands

```bash
# Run backend tests
npm test

# Simulate a devnet checkout
npm run simulate:bike

# Create/reuse demo merchant wallet
npm run wallet:merchant

# Check devnet balances
npm run wallet:balances -- --buyer=<BUYER_PUBKEY>
```

---

## 🗺️ Roadmap

### ✅ V1 — Consumer Concierge MVP *(Current)*
- [x] AI-powered product discovery with streaming chat
- [x] Real-time search via SerpAPI
- [x] Product cards with "Buy via Agent" flow
- [x] Solana wallet integration (Phantom/Backpack)
- [x] MagicBlock devnet checkout + TEE escrow payment
- [x] Payment receipts with Solscan explorer links
- [x] Investor pitch deck
- [x] Live deployment on Vercel

### 🔨 V2 — Merchant Partner Network *(Next)*
- [ ] Merchant Dashboard for partner onboarding
- [ ] Direct API integrations with hotel chains & e-commerce platforms
- [ ] Production TEE escrow smart contract (Anchor) on mainnet
- [ ] Real USDC settlement with dispute resolution
- [ ] Onboard first 50 curated merchant partners

### 🌐 V3 — Agent-to-Agent (A2A) Economy *(Future)*
- [ ] B2B agent-to-agent payment rails
- [ ] Autonomous AI agents hiring other AI agents via Buybird escrow
- [ ] Machine-to-machine commerce settlement layer
- [ ] Cross-agent discovery and negotiation protocol

---

## 🧪 MVP Status

| Feature | Status |
|---|---|
| Product search from live data | ✅ |
| Gemini chat with tool calling | ✅ |
| Product result cards | ✅ |
| Internal checkout sessions | ✅ |
| Devnet wallet connection | ✅ |
| MagicBlock payment preparation | ✅ |
| Wallet signing | ✅ |
| Devnet transaction submission | ✅ |
| Payment receipts | ✅ |
| Failed payment recovery UX | 🔜 |

---

## 🔒 Security Model

- **Wallet stays sovereign** — The AI agent never has direct access to user funds
- **Escrow-first** — Payments are locked in TEE escrow before merchant settlement
- **Privacy by design** — MagicBlock TEE ensures wallet addresses and amounts are hidden from the public ledger
- **Controlled approval boundary** — The user wallet is always the final signer

---

## 🤝 Contributing

We welcome contributions! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Built with ❤️ on Solana</strong><br/>
  <em>Powered by MagicBlock TEE · Google Gemini · Vercel</em>
</p>
