# FlowPilot

> **Tell your wallet what you want. It handles the rest.**

Consumer DeFi automation on Flow blockchain. Users describe financial goals in plain English, confirm once, and let on-chain automation execute continuously — privately, safely, and without a backend.

---

## Table of Contents

1. [Problem & Solution](#1-problem--solution)
2. [How It Works](#2-how-it-works)
3. [Current Status](#3-current-status-testnet)
4. [Tech Stack](#4-tech-stack)
5. [Smart Contracts](#5-smart-contracts-testnet)
6. [V2 Rule Lifecycle](#6-v2-rule-lifecycle)
7. [Why FlowPilot](#7-why-flowpilot)
8. [Setup](#8-setup)
9. [Repository Structure](#9-repository-structure)
10. [Judging Criteria](#10-judging-criteria-mapping)

---

## 1. Problem & Solution

### The Problem

DeFi is too complex for mainstream adoption. Every action requires manual transaction signing, technical jargon, and constant monitoring. Recurring tasks like auto-saves or DCA demand either custodial services or constant user attention.

### The Solution

FlowPilot turns intent into automation:

1. User types a goal in plain English
2. NEAR AI parses intent privately inside a TEE
3. User reviews a human-readable plan and confirms once
4. Flow scheduler executes recurring on-chain actions automatically

```
"Save 50 FLOW every week"  →  One confirmation  →  Runs automatically on-chain
```

---

## 2. How It Works

**Step 1 — Connect**
Connect a Flow wallet via FCL. Email-compatible — no seed phrase required.

**Step 2 — Describe**
Type a goal in plain English, e.g. *"Save 50 FLOW a week and earn yield on idle balance."*

**Step 3 — Review**
NEAR AI parses intent privately inside a TEE. A human-readable plan is shown before any transaction is signed. Your financial intent never touches a centralized API.

**Step 4 — Confirm**
Sign once. Rules are stored on-chain in `AutomationRulesV2`.

**Step 5 — Automate**
The Flow Transaction Scheduler executes the handler. It self-reschedules after each run — infinite recurring automation with no backend.

---

## 3. Current Status (Testnet)

### ✅ Implemented

- Rule CRUD — create, read, and cancel automation rules
- On-chain scheduler ID lifecycle (`setSchedulerId`, `markRuleExecuted`)
- Recurring save handler with self-reschedule
- Verified additional recurring executions on testnet
- Vault deposit and withdrawal
- Dashboard: balance, pending yield, activity feed, rule management
- Private intent parsing via NEAR AI (TEE-backed inference)
- Real yield integrations (Increment Finance, Flowty)
- Full gas sponsorship path
- DCA execution path
- V2 contract architecture with stale-ID failure mode resolved

### 🚧 In Progress

- None

---

## 4. Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 + TypeScript | App Router, responsive dashboard UI |
| Wallet / Auth | Flow FCL | Email-compatible, no seed phrase |
| Smart Contracts | Cadence V2 | Resource-safe vault and rule logic |
| Automation | Flow Transaction Scheduler | Native on-chain scheduling, no backend needed |
| AI Inference | NEAR AI — DeepSeek-V3.1 (TEE) | Private intent parsing, zero centralized logging |
| Styling | Inline React Styles | Zero-dependency, self-contained UI |

---

## 5. Smart Contracts (Testnet)

### `FlowPilotVault.cdc` → `0xbd9a0dc67c96cda1`

Resource-based vault with automatic yield calculation (~5% APY mock). Cannot be duplicated or lost — safety is enforced by Cadence's type system, not just audits. Stored at `/storage/flowPilotVault` in user accounts.

### `AutomationRulesV2.cdc` → `0xbd9a0dc67c96cda1`

Stores action type, amount, interval, active status, and scheduler ID on-chain. Exposes `setSchedulerId()` and `markRuleExecuted()` so the handler can update rule state after each execution. Provides `RuleBookPublic` interface for handler access.

### `VaultSaveHandlerV2.cdc` → `0xbd9a0dc67c96cda1`

Implements the `TransactionHandler` interface for the Flow scheduler. Executes deposits, self-reschedules for infinite recurring automation, and updates rule state on-chain. Users maintain full custody — no backend keys.

---

## 6. V2 Rule Lifecycle

The V2 architecture resolves the stale-ID failure mode present in V1, where cancellation could fail if a rule had already executed and rescheduled with a new scheduler ID.

1. Rule created in `AutomationRulesV2`
2. Scheduler ID persisted on-chain via `setSchedulerId()`
3. Handler executes, self-reschedules, updates scheduler ID via `markRuleExecuted()`
4. Cancellation reads current scheduler ID from rulebook — always valid, never stale

> **Key fix:** the rule always holds the latest scheduler ID, so `cancel()` reads the current on-chain value rather than a stale client-side one.

---

## 7. Why FlowPilot

| | Others | FlowPilot |
|---|---|---|
| **vs Manual DeFi** | Repeated signing, technical jargon | Natural language, confirm once |
| **vs Custodial Apps** | Trust a company with your keys | Non-custodial, transparent on-chain |
| **vs Keeper Bots** | Centralized backend, trust assumptions | Flow native scheduler, no external deps |
| **vs Traditional Bank** | 0.01% APY, opaque, withdrawal limits | 5%+ APY potential, instant withdraw |

### Unique Differentiators

- **Privacy-first AI** — Only DeFi platform using TEE-secured inference. Your financial goals never touch centralized providers.
- **Resource-oriented safety** — Cadence's type system makes asset duplication/loss mathematically impossible, not just "safe by audit."
- **True on-chain automation** — Flow scheduler runs on the blockchain itself, not a centralized keeper network.
- **Consumer-ready UX** — Email login, no seed phrases, natural language — designed for the next billion users.

---

## 8. Setup

### Prerequisites

- Node.js 18+
- npm
- Flow CLI

### Install & Run

```bash
git clone <your-repo-url>
cd flowpilot
npm install
```

Create `.env.local`:

```bash
NEAR_AI_API_KEY=your_key_here
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_VAULT_CONTRACT=0xbd9a0dc67c96cda1
NEXT_PUBLIC_RULES_CONTRACT=0xbd9a0dc67c96cda1
NEXT_PUBLIC_HANDLER_CONTRACT=0xbd9a0dc67c96cda1
```

```bash
npm run dev
# Open http://localhost:3000
```

### Optional: Deploy Your Own Contracts

```bash
flow keys generate
# Fund account at https://testnet-faucet.onflow.org
# Update flow.json with your account details
flow project deploy --network testnet
```

---

## 9. Repository Structure

```text
flowpilot/
├── app/
│   ├── dashboard/page.tsx           # Main dashboard UI
│   └── api/
│       ├── parse-intent/route.ts    # NEAR AI intent parsing
│       ├── get-balance/route.ts     # Vault metrics endpoint
│       ├── get-rules/route.ts       # Rules endpoint
│       └── sponsor-transaction/     # Gas sponsorship
├── components/
│   ├── ChatInput.tsx                # Natural language input
│   ├── PlanPreview.tsx              # Plan review before execution
│   ├── BalanceCard.tsx              # Balance, yield, withdraw
│   ├── ManageRules.tsx              # Rule management UI
│   ├── ActivityFeed.tsx             # On-chain event feed
│   └── WithdrawModal.tsx            # Withdrawal flow
├── lib/
│   ├── cadence.ts                   # Tx/query helpers
│   ├── flow.ts                      # FCL configuration
│   └── nearai.ts                    # NEAR AI client + prompts
└── cadence/
    ├── contracts/
    │   ├── FlowPilotVault.cdc
    │   ├── AutomationRulesV2.cdc
    │   └── VaultSaveHandlerV2.cdc
    ├── transactions/
    └── scripts/
```

---

## 10. Judging Criteria Mapping

| Criterion | How FlowPilot Delivers |
|---|---|
| **Impact / Usefulness** | Reduces DeFi friction for mainstream users. Automates recurring financial discipline without custodial risk. |
| **Technical Execution** | Cadence resource model + Flow scheduler integration. V2 on-chain scheduler ID lifecycle resolves the stale-ID failure mode from V1. |
| **Completeness / Functionality** | End-to-end flow live on testnet. Rule CRUD, vault deposit/withdrawal, balance + yield dashboard, activity feed, recurring execution verification, and full gas sponsorship path — all functional. |
| **Scalability / Future Potential** | Architecture directly supports DCA, rebalancing, and real yield routing. Consumer UX foundation ready for broader rollout. |

---

## Submission Checklist

- [x] Summary and documentation
- [ ] Demo video
- [ ] Live demo link
- [ ] Pitch deck (optional)

---

## Acknowledgments

- [Flow Foundation](https://flow.com) — consumer-friendly L1, Cadence language, native scheduling
- [NEAR AI](https://cloud.near.ai) — private, TEE-secured inference infrastructure
- Flow community — FCL, documentation, testnet support

---

*Built for **Flow: The Future of Finance** (Consumer DeFi) · March 2026*