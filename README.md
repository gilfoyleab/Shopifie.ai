<p align="center">
  <img src="https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Payments-Private_MPP-10B981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Live_MVP-22c55e?style=for-the-badge" />
</p>

<h1 align="center">🐦 Buybird</h1>

<p align="center">
  <strong>Private MPP — x402 Agent Payments with MagicBlock Private Payment API</strong>
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

Buybird is an **AI-powered shopping concierge** and **Private MPP** prototype. It lets agents privately transact with merchants by combining an x402-style payment negotiation layer with MagicBlock's Private Payment API on PER.

> **Think of it as:** Your personal AI shopper that pays in crypto — privately, securely, and with zero chargebacks.

Users simply chat with the Buybird AI, describe what they need, and the agent handles everything from discovery to private checkout. The payment path is designed for crypto users who earn and spend through agents while keeping merchant payments private.

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
User Prompt → AI Search → Partner Results → x402 Payment Required → MagicBlock Private Payment API → PER Settlement
```

- **For Users:** Chat with the AI. It finds exactly what you need from our partner network.
- **For Payments:** Pay in USDC through a Private MPP intent.
- **For Privacy:** The payment rail uses MagicBlock Private Payment API on PER.
- **For Merchants:** Zero chargebacks, instant USDC settlement, simple onboarding.

### Private MPP Implementation Status

| Requirement | Current Status |
|---|---|
| Agents privately transact with merchants | Implemented for the Buybird demo merchant checkout flow |
| x402 with Private Payment API | Implemented with `@x402/next`, `@x402/core`, and `@x402/svm`; `/api/checkout/[id]/protected` is Solana x402-protected and `/api/checkout/[id]/x402` exposes checkout discovery metadata |
| Payment on PER with Private Payment API | Implemented and devnet-verified through MagicBlock's Private Payment API returning signed `v0` transfer payloads |
| Fast and gasless | Implemented for approved devnet stablecoin mints at MagicBlock's gasless minimum of `0.5` USDC/USDT |
| Compliant privacy on PER | PER-targeted payment intent is implemented; production compliance policy is not implemented yet |
| Marketplace connections like Amazon, Airbnb, Shopify, Nomadz | Not implemented yet; current app uses live shopping search plus a demo merchant payment rail |

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
│  x402 Negotiation · MagicBlock Private Payment API       │
│  Payment on PER · Private USDC Settlement                │
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

### 3. x402 Payment Required
The backend creates a Private MPP intent and exposes an x402-style `402 Payment Required` response with the amount, merchant destination, asset, and MagicBlock Private Payment API rail metadata.

### 4. Private Payment API
The app asks MagicBlock's Private Payment API to prepare a private SPL transfer for the selected merchant payment.

### 5. Sign and Submit
The user's wallet signs the prepared transaction. The signed transaction is submitted to the target returned by MagicBlock, including PER/ephemeral routing when provided.

### 6. Receipt
The app confirms the Private MPP flow with a receipt. Demo receipts are clearly marked as demo; live receipts include transaction details.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React, TypeScript |
| **AI Engine** | Google Gemini via Vercel AI SDK |
| **Search** | SerpAPI + Google Shopping |
| **Wallet** | Solana Wallet Adapter (Phantom, Backpack) |
| **Payments** | x402 with MagicBlock Private Payment API |
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
| `GET` | `/api/checkout/[id]/x402` | Return Private MPP discovery metadata and links |
| `GET` | `/api/checkout/[id]/protected` | Solana x402-protected merchant action; requires a valid `X-PAYMENT` payload |
| `POST` | `/api/checkout/[id]/prepare-payment` | Validate wallet + prepare MagicBlock Private Payment API transfer |
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
MAGICBLOCK_PAYMENTS_API_URL=https://payments.magicblock.app
MAGICBLOCK_DEVNET_ROUTER=https://devnet-router.magicblock.app
SOLANA_DEVNET_RPC=https://api.devnet.solana.com
X402_FACILITATOR_URL=https://facilitator.payai.network
BUYBIRD_GASLESS_PAYMENTS=true
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
- [x] Private MPP intent for agent-to-merchant payments
- [x] Solana x402 payment-required endpoint
- [x] MagicBlock Private Payment API preparation
- [x] Gasless PER devnet settlement
- [x] Payment receipts with Solscan explorer links
- [x] Investor pitch deck
- [x] Live deployment on Vercel

### 🔨 V2 — Merchant Partner Network *(Next)*
- [ ] Merchant Dashboard for partner onboarding
- [ ] Direct API integrations with hotel chains & e-commerce platforms
- [ ] Production PER settlement and merchant reconciliation
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
| x402-style payment requirement | ✅ |
| MagicBlock Private Payment API preparation | ✅ |
| Wallet signing | ✅ |
| Devnet transaction submission | ✅ |
| Payment receipts | ✅ |
| Failed payment recovery UX | 🔜 |

---

## 🔒 Security Model

- **Wallet stays sovereign** — The AI agent never has direct access to user funds
- **x402-first** — Agents receive a payment-required response before protected merchant checkout proceeds
- **Privacy by design** — Merchant payments are prepared through MagicBlock Private Payment API on PER
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
  <em>Powered by MagicBlock Private Payment API · Google Gemini · Vercel</em>
</p>
