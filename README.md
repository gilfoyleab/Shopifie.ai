# Buybird

Buybird is a shopping agent that helps a user discover products, compare live offers, and complete a private payment flow on Solana devnet using MagicBlock.

This repository is our MVP workspace. The goal is not to build a fully autonomous bot that buys anything from anywhere. The goal is to build a safe, convincing devnet demo of agentic shopping and agentic payments.

## Locked MVP

The MVP we are building is:

1. A user asks for a product in natural language.
2. The agent finds live offers and ranks them.
3. The user selects one item and clicks `Buy`.
4. The backend creates a checkout session.
5. The backend locks the item, amount, merchant target, and expiry.
6. MagicBlock builds an unsigned private payment transaction.
7. The user wallet signs the transaction.
8. The transaction is submitted on devnet.
9. The app marks the checkout as paid and shows status.

This is already a real agentic payment flow.

The autonomy is in:
- product discovery
- comparison
- ranking
- checkout orchestration

The final payment execution stays inside a controlled approval boundary.

## Product Position

Buybird is not "AI that spends money on its own with no limits."

Buybird is:
- an AI shopping assistant
- a stateful checkout orchestrator
- a private payment demo on MagicBlock devnet

That framing is important because it keeps the MVP safe, explainable, and scalable.

## Goal Tracker

Use this section as the running scoreboard for the MVP. We will keep adding ticks here as endpoints and flows land.

### Core MVP Checklist

- [x] Product search from live data
- [x] Gemini chat route with tool calling
- [x] Product result cards with `Buy via Agent`
- [x] Internal checkout session creation
- [x] Checkout session retrieval endpoint
- [x] Devnet Phantom wallet connection
- [x] MagicBlock-shaped payment preparation endpoint
- [x] Wallet signing of the prepared transaction
- [x] Transaction submission endpoint
- [x] Live `paid` state after devnet submission
- [x] Order receipt endpoint
- [x] Receiver token-account explorer link and balance display
- [ ] Failed payment recovery and retry UX
- [x] Backend test files for checkout flow
- [x] Backend CLI simulation for devnet-style bike checkout
- [x] Demo merchant wallet tooling
- [x] Devnet wallet balance checker script

### Endpoint Tracker

- [x] `POST /api/chat`
  Purpose: Gemini orchestration + search tool invocation
- [x] `POST /api/checkout`
  Purpose: create a locked internal checkout session from a selected live product
- [x] `GET /api/checkout/[checkoutId]`
  Purpose: retrieve a checkout session and current status
- [x] `POST /api/checkout/[checkoutId]/prepare-payment`
  Purpose: validate wallet + prepare a MagicBlock private-payment request for devnet
- [x] `POST /api/checkout/[checkoutId]/submit-payment`
  Purpose: accept a signed transaction or simulation mode and submit it
- [x] `GET /api/checkout/[checkoutId]/receipt`
  Purpose: return a payment receipt / order confirmation payload

### Current Focus

- [x] Search -> product selection
- [x] Product selection -> checkout session
- [x] Checkout session -> payment preparation
- [x] Payment preparation -> Phantom signing
- [x] Backend submission path -> paid state
- [x] Paid state -> receipt payload
- [x] Receipt payload -> correct receiver token-account explorer link

## Current Stage

We are currently in `Stage 3: Devnet Private Payment`, moving into hardening and explorer/receipt polish.

What is already in the codebase:
- Next.js app with App Router
- chat-style shopping UI
- Gemini-powered chat route
- SerpAPI-based product search tool
- result cards with product selection entry point
- internal checkout session APIs
- Phantom wallet integration on devnet
- payment preparation flow for MagicBlock private transfers
- Phantom signing and live devnet submission
- receipt UI with transaction and receiver settlement links

Current implementation files:
- [src/app/page.tsx](</Users/sumangiri/Desktop/shopping-agent-mvp/src/app/page.tsx>)
- [src/app/api/chat/route.ts](</Users/sumangiri/Desktop/shopping-agent-mvp/src/app/api/chat/route.ts>)
- [src/app/api/checkout/route.ts](</Users/sumangiri/Desktop/shopping-agent-mvp/src/app/api/checkout/route.ts>)
- [src/app/api/checkout/[checkoutId]/route.ts](</Users/sumangiri/Desktop/shopping-agent-mvp/src/app/api/checkout/[checkoutId]/route.ts>)
- [src/app/api/checkout/[checkoutId]/prepare-payment/route.ts](</Users/sumangiri/Desktop/shopping-agent-mvp/src/app/api/checkout/[checkoutId]/prepare-payment/route.ts>)
- [src/components/solana-provider.tsx](</Users/sumangiri/Desktop/shopping-agent-mvp/src/components/solana-provider.tsx>)
- [src/lib/checkout/store.ts](</Users/sumangiri/Desktop/shopping-agent-mvp/src/lib/checkout/store.ts>)
- [src/lib/tools/search.ts](</Users/sumangiri/Desktop/shopping-agent-mvp/src/lib/tools/search.ts>)
- [src/app/globals.css](</Users/sumangiri/Desktop/shopping-agent-mvp/src/app/globals.css>)

What is not built yet:
- failed payment retry / recovery UX
- persistent storage beyond in-memory session state

## Current Architecture

### Frontend
- Next.js
- React
- TypeScript
- custom chat and product-card interface

### Agent Layer
- Gemini via Vercel AI SDK
- tool calling from chat route

### Product Data
- SerpAPI
- Google Shopping where supported
- fallback Google result extraction for unsupported shopping regions

### Payment Layer
- current: MagicBlock-shaped payment preparation on Solana devnet
- next: signed transaction submission and confirmation flow
- later: Mirage-assisted execution and testing flow

## Locked User Flow

### Stage 1: Find
The user describes what they want.

Example:
`Find me a MacBook Air under $700`

The agent:
- interprets the request
- queries live shopping data
- returns ranked product cards

### Stage 2: Choose
The user reviews the results and clicks `Buy via Agent` on one item.

At this point, the selected product becomes the `checkout candidate`.

### Stage 3: Checkout Session
The backend creates a checkout session with:
- `checkoutId`
- selected product data
- source link
- displayed amount
- payment mint
- merchant destination or test receiver
- expiry time
- current status

### Stage 4: Payment Preparation
The backend calls MagicBlock to build a private payment transaction.

The transaction should include:
- amount
- sender
- destination
- `clientRefId` or checkout reference
- private visibility
- devnet cluster settings

### Stage 5: Signature
The user wallet signs the unsigned transaction.

The app does not let the model directly broadcast raw arbitrary values. The backend owns validation, and the wallet remains the final signer.

### Stage 6: Submission
The signed transaction is submitted on devnet.

### Stage 7: Status
The UI updates the checkout state:
- `checkout_ready`
- `payment_pending`
- `paid`
- `failed`

## Target Architecture For Stage 2

```text
User
  -> Chat UI
  -> Gemini Agent
  -> Search Tool
  -> Ranked Product Results
  -> Buy Click
  -> Checkout Session API
  -> MagicBlock Payment Builder
  -> Wallet Signature
  -> Devnet Submission
  -> Payment Status UI
```

Core system pieces we need:
- `shopping agent`
- `search tool`
- `checkout session service`
- `payment adapter`
- `wallet integration`
- `order/payment state store`

## Roadmap

### Stage 1: Product Discovery
Status: `In progress / partially built`

Goals:
- polished shopping chat
- reliable product search
- ranking logic
- product selection flow

### Stage 2: Agentic Checkout
Status: `Built`

Goals:
- replace pure outbound store flow with internal checkout flow
- create checkout session object
- attach selected product to session
- show review state before payment

### Stage 3: Devnet Private Payment
Status: `In progress`

Goals:
- connect wallet
- build MagicBlock private transfer request
- sign and submit on devnet
- show receipt and payment confirmation

### Stage 4: Hardening
Status: `Later`

Goals:
- idempotency
- stale price protection
- failed payment recovery
- better source verification
- order history and audit trail

## Coming Goals

The immediate goals from here are:

1. Sign the prepared transaction with Phantom.
2. Connect Phantom signing output to the submit-payment endpoint.
3. Confirm live devnet transaction success and move the checkout to `paid`.
4. Show the receipt / payment success state in-app.
5. Add retry handling for failed submissions.

## Definition Of Done For The MVP

We can call the MVP successful when:
- a user can search for a product
- the agent can return live product options
- the user can select an item
- the backend can create a checkout session
- the app can prepare a MagicBlock private payment on devnet
- the user wallet can sign it
- the app can show `paid` status after submission

## Out Of Scope For This MVP

We are not trying to build:
- full open-web autonomous purchasing
- merchant fulfillment across arbitrary stores
- invisible or automatic spending without approval
- cross-chain payments
- production mainnet settlement in v1

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| Agent | Gemini via Vercel AI SDK |
| Search | SerpAPI |
| Payments | MagicBlock Private Payments API |
| Network | Solana devnet |
| UI | Custom CSS |

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run backend tests:

```bash
npm test
```

Run the bike checkout simulation:

```bash
npm run simulate:bike
```

Create or reuse a local demo merchant wallet:

```bash
npm run wallet:merchant
```

Check merchant and buyer devnet balances:

```bash
npm run wallet:balances -- --buyer=<BUYER_PUBKEY>
```

Environment variables currently used:

```env
GOOGLE_GENERATIVE_AI_API_KEY=...
SERPAPI_API_KEY=...
```

More environment variables will be added when wallet and MagicBlock payment flows are wired in.

## Working Rule

This README is the current source of truth for:
- what the MVP is
- what stage we are in
- what we are building next
- what is intentionally out of scope

If the product direction changes, this file should be updated first.
