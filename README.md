# 🐦 Buybird

**The future of E-commerce — a shopping agent.**

> Tell the agent what you want to shop for. It finds you the best deal, buys it for you, and pays privately on-chain — all in just one click.

Backed by **[MagicBlock](https://magicblock.gg)**.

---

## ✨ What is Buybird?

Buybird is an AI-powered shopping agent that turns natural language into real purchases. Instead of browsing dozens of tabs and comparing prices yourself, you simply tell Buybird what you want — and it handles the rest.

**How it works:**
1. 🗣️ **Say what you want** — "Find me a MacBook Air M1 under $500"
2. 🔍 **Agent finds the best deals** — Searches across the web, verifies prices, and ranks the top options
3. 🛒 **Buy in one click** — Select a product and pay privately on-chain through MagicBlock

No more endless browsing. No more price comparison tabs. Just tell Buybird, and it shops for you.

---

## 🚀 Features

- **Natural Language Shopping** — Chat with the agent like you'd chat with a friend
- **Real-Time Product Discovery** — Searches Google Shopping via SerpAPI for live products and prices
- **AI-Powered Recommendations** — Gemini-powered agent ranks and explains why each product is a good fit
- **Beautiful Slider UI** — Premium horizontal card slider with "Buybird says..." AI insights
- **Smart Revisions** — "Still looking?" cards let you refine by price, brand, or category in one tap
- **Private On-Chain Payments** — MagicBlock / Mirage private payment flow on Solana devnet

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React, TypeScript |
| **AI Agent** | Google Gemini 2.5 Flash via Vercel AI SDK |
| **Product Data** | SerpAPI (Google Shopping) |
| **Payments** | MagicBlock Private Payments on Solana Devnet |
| **Styling** | Vanilla CSS with custom design system |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/shumhn/shopping-agent.git
cd shopping-agent
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
SERPAPI_API_KEY=your_serpapi_key
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start shopping!

---

## 🏗️ Architecture

```
User → Chat UI → Gemini Agent → Search Tool (SerpAPI) → Product Results
                                                      → Slider UI
                                                      → Checkout → MagicBlock Payment (devnet)
```

### Core Components

| Component | Description |
|-----------|-------------|
| `src/app/page.tsx` | Main chat interface with horizontal product slider |
| `src/app/api/chat/route.ts` | AI chat API route with Gemini + tool calling |
| `src/lib/tools/search.ts` | SerpAPI Google Shopping search tool |
| `src/app/globals.css` | Full design system and slider styles |
| `src/app/layout.tsx` | App layout and metadata |

---

## 🎨 UI Preview

The product results are displayed in a premium horizontal slider:
- **Hero Cards** — Large product cards with images, prices, and AI insights
- **"Buybird says..."** — AI-generated rationale for each recommendation
- **Revisions Grid** — Quick-action cards to refine your search
- **Visit Store** — Direct links to purchase from the retailer

---

## 🗺️ Roadmap

- [x] Natural language chat interface
- [x] Gemini AI agent with tool calling
- [x] Real-time Google Shopping search
- [x] Horizontal slider product UI
- [x] AI recommendation insights
- [ ] Wallet connection (Solana)
- [ ] MagicBlock private payment flow
- [ ] Checkout session management
- [ ] Order tracking

---

## 🤝 Built With

- [MagicBlock](https://magicblock.gg) — Private on-chain payments
- [Google Gemini](https://ai.google.dev) — AI agent backbone
- [Vercel AI SDK](https://sdk.vercel.ai) — Streaming & tool calling
- [SerpAPI](https://serpapi.com) — Real-time product search
- [Next.js](https://nextjs.org) — React framework

---

## 📄 License

MIT

---

**Buybird** — _Shop smarter. Pay privately. One click._
