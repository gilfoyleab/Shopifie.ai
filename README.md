# Shopping Agent MVP

An agentic shopping MVP that helps a user discover products, verify real offers, compare options, and complete a private payment flow on MagicBlock devnet with explicit user confirmation.

## What We Are Building

We are building a focused shopping assistant, not a fully autonomous buyer.

The MVP will:
- Understand a user request in natural language
- Search for relevant products
- Verify product facts from evidence
- Rank the best options
- Show a clean shortlist in the UI
- Create a checkout session
- Run a private payment demo through MagicBlock / Mirage on devnet
- Track the order state after payment

## Why We Are Building It

The goal is to make shopping feel like a guided, trustworthy workflow instead of a black-box chatbot.

This MVP is designed to:
- Reduce search friction
- Surface better product choices
- Keep the user in control before payment
- Use MagicBlock for a private payment rail
- Keep the system realistic and demoable on devnet

## MVP Scope

### In Scope
- One orchestration agent
- Product discovery from the web or approved sources
- Product verification and ranking
- Stateful checkout sessions
- Manual user confirmation before payment
- MagicBlock / Mirage private payment flow on devnet
- Basic order status tracking

### Out of Scope For v1
- Fully autonomous buying without confirmation
- Scraping the entire internet indiscriminately
- Supporting every merchant on day one
- Real-world merchant fulfillment across all stores
- Complex multi-agent orchestration before the core flow works

## Core User Flow

1. User types a shopping request.
2. The agent rewrites the request into structured search constraints.
3. The discovery layer finds candidate products.
4. The verifier checks price, availability, seller, shipping, and return policy.
5. The ranker sorts the best options.
6. The UI shows a shortlist with evidence.
7. The user selects one item and confirms purchase.
8. The backend creates a checkout session.
9. Mirage builds the private payment transaction flow.
10. The wallet signs and the transaction is submitted on devnet.
11. The app marks the order as paid and tracks status.

## System Architecture

### 1. Gemini Orchestrator
The single agent that understands intent and coordinates tools.

Responsibilities:
- Parse user requests
- Ask for clarifications when needed
- Choose which tools to call
- Produce the final shortlist
- Gate checkout behind explicit confirmation

### 2. Discovery Service
Finds possible products from the web or approved product sources.

Responsibilities:
- Search candidates
- Gather source URLs
- Return raw product leads

### 3. Verification Service
Turns product leads into trusted, evidence-backed offers.

Responsibilities:
- Read product pages
- Extract price, shipping, availability, and returns
- Attach evidence links
- Detect stale or inconsistent information

### 4. Normalization Layer
Converts raw results into a strict schema.

Suggested objects:
- `Product`
- `Offer`
- `Seller`
- `Shipping`
- `ReturnPolicy`
- `Evidence`
- `CheckoutSession`

### 5. Checkout Engine
Manages state and prevents duplicate payment actions.

Responsibilities:
- Create checkout sessions
- Store selected offers
- Track payment state
- Log all state transitions

### 6. MagicBlock / Mirage Adapter
Handles the private payment demo on devnet.

Responsibilities:
- Fund or prepare the wallet flow if needed
- Build the payment transaction
- Sign and submit through the wallet
- Reconcile the payment with the checkout session

### 7. Database
Stores the app state.

Suggested data:
- User sessions
- Search queries
- Candidate offers
- Selected product
- Checkout sessions
- Payment references
- Audit log

### 8. Frontend UI
Presents the shopping flow clearly and keeps the user informed.

Suggested screens:
- Search
- Product comparison
- Checkout review
- Payment status
- Order history

## Application Layout

The MVP UI should have four major areas:

### Search Panel
- Natural language prompt box
- Budget filters
- Category filters
- Shipping preference

### Results Grid
- Product cards
- Evidence links
- Price, seller, shipping, returns
- Confidence score

### Checkout Sidebar
- Selected product summary
- Total amount
- Payment status
- Confirm purchase button

### Activity Timeline
- Search started
- Offers found
- Offers verified
- Item selected
- Checkout created
- Payment submitted
- Order confirmed

## MVP State Machine

The app should behave as a stateful system.

```text
idle -> searching -> verifying -> ranking -> review -> checkout_ready -> payment_pending -> paid -> fulfilled
```

Error states should be tracked too:

```text
any_state -> error
```

## Recommended Tech Direction

### Frontend
- Next.js (App Router)
- TypeScript
- `@solana/wallet-adapter-react` for wallet connection (required for MagicBlock auth)
- A clean, responsive hybrid UI (chat-first with card results)

### Backend & Database
- Node.js API routes for orchestration
- **Database:** SQLite via Prisma (perfect for local MVP, easily portable)
- Deterministic tool functions

### Agent
- **Gemini as the main orchestrator** (using `gemini-2.5-flash` for fast function calling)
- **Vercel AI SDK** (`ai`, `@ai-sdk/google`, `zod`) for agentic loops, streaming, and tool schemas
- One agent first, not a multi-agent system

### Product Data Source
- **MVP Phase 1:** Fake Store API (free, realistic JSON products)
- **MVP Phase 2:** SerpAPI Google Shopping (for real-world data)

### Payments
- **MagicBlock Private Payments API** (`https://payments.magicblock.app`)
- Flow: Wallet challenge auth (`/v1/spl/challenge` -> `/v1/spl/login`) -> Deposit to Ephemeral Rollup -> Private Transfer
- **RPCs:** Base Devnet + Ephemeral Rollup Devnet (`devnet-us.magicblock.app`)

### Environment Variables Required
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `NEXT_PUBLIC_ER_RPC_URL` (MagicBlock Ephemeral Rollup)
- `NEXT_PUBLIC_TEE_RPC_URL` (MagicBlock TEE)

## Build Plan

### Phase 1: Project Foundation
- Create the app folder
- Set up README and architecture docs
- Initialize Next.js
- Define the core data model

### Phase 2: Shopping Intelligence
- Build search and discovery tools
- Add verification and evidence capture
- Add ranking logic

### Phase 3: Checkout Flow
- Create stateful checkout sessions
- Add user confirmation before payment
- Add audit logging and idempotency

### Phase 4: MagicBlock Integration
- Wire in Mirage private payments on devnet
- Test wallet funding and transaction submission
- Link payment references to checkout sessions

### Phase 5: Demo Hardening
- Handle price changes
- Handle missing stock
- Handle payment failure
- Improve loading states and empty states

## Definition Of Done For MVP

The MVP is successful when:
- A user can search for a product
- The system shows verified results
- The user can review and choose one
- The checkout session is created
- A private payment demo can be completed on devnet
- The order state is visible and persistent

## Tracking Notes

Use this repository to track:
- Product decisions
- Architecture changes
- API assumptions
- MagicBlock integration steps
- UI/UX flow changes
- Open questions and risks

## Resolved Architecture Decisions

- **Product category for v1:** Electronics or general items via Fake Store API.
- **Merchant source for v1:** Fake Store API for initial build, SerpAPI for final demo.
- **Fulfillment:** Simulate only. We will mark as "fulfilled" locally; no real merchant integration for v1.
- **Frontend layout:** Hybrid — natural language chat input at the top, visual product cards and checkout sidebar below.
- **Payment flow:** Strictly MagicBlock devnet-only for the first release.

## Next Step

The Next.js app has been initialized in this folder. The next step is to begin Phase 2: wiring up the Vercel AI SDK with Gemini, defining the product search tools, and building the conversational UI.
