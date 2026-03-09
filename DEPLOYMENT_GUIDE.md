# FlowPilot — Deployment Guide

Contracts are already live on testnet. This guide covers frontend deployment only.

---

## Environment Variables

Create `.env.local` in the project root (never commit this file):

```bash
NEAR_AI_API_KEY=your_key_from_cloud.near.ai

NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_VAULT_CONTRACT=0x8d177b02197bf5c8
NEXT_PUBLIC_RULES_CONTRACT=0xbd9a0dc67c96cda1
NEXT_PUBLIC_HANDLER_CONTRACT=0xbd9a0dc67c96cda1

DATABASE_URL=postgres://user:password@host.upstash.io:5432/dbname

# Optional: gas sponsorship
FLOW_SPONSOR_ADDRESS=0xSPONSOR_ADDRESS
FLOW_SPONSOR_PRIVATE_KEY=your_private_key_hex
```

---

## Deploy to Vercel

### 1. Create an Upstash database

Visit [upstash.com](https://upstash.com), create a PostgreSQL database, and copy the connection string.

### 2. Push and deploy

```bash
git add -A
git commit -m "Deploy"
git push origin main
```

Go to [vercel.com/new](https://vercel.com/new), import your repository, add the environment variables above, and click **Deploy**.

---

## API Routes

All routes in `/app/api/` deploy automatically as Vercel serverless functions.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/parse-intent` | POST | NEAR AI parses natural language → structured plan |
| `/api/get-balance` | GET | Vault balance + pending yield |
| `/api/get-rules` | GET | User's automation rules from `AutomationRulesV2` |
| `/api/execute-plan` | POST | Creates rules on-chain after user confirms |
| `/api/sponsor-transaction` | POST | Gasless transaction sponsorship |

---

## Verify Deployment

```bash
# Check rules for an address
flow scripts execute cadence/scripts/getRules.cdc <address> --network testnet

# Check vault balance
flow scripts execute cadence/scripts/getBalance.cdc <address> --network testnet
```

---

## Resources

- [Flow Docs](https://developers.flow.com)
- [Testnet Faucet](https://testnet-faucet.onflow.org)
- [NEAR AI](https://cloud.near.ai)
- [Vercel Docs](https://vercel.com/docs)
- [Upstash Docs](https://upstash.com/docs)