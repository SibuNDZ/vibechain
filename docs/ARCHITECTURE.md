# VibeChain Architecture

## System Overview

```
                                    ┌─────────────────┐
                                    │   Web Browser   │
                                    └────────┬────────┘
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     │                       │                       │
                     ▼                       ▼                       ▼
            ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
            │  Next.js Web   │     │ Wallet Adapter │     │     Solana     │
            │  (Frontend)    │────▶│ Phantom/Solflare│────▶│  (devnet/main) │
            └───────┬────────┘     └────────────────┘     └───────┬────────┘
                    │                                             │
                    │ REST API                                    │ JSON-RPC
                    ▼                                             │
            ┌────────────────┐                                    │
            │  NestJS API    │◀───────────────────────────────────┘
            │  (Backend)     │           Wallet nonce verify
            └───────┬────────┘
                    │
                    ▼
            ┌────────────────┐
            │  PostgreSQL    │
            │  + pgvector    │
            └────────────────┘
```

Redis appears in `docker-compose.yml` for local infra but the API does not use it.

## Package Structure

### Monorepo Layout

```
vibechain/
├── apps/
│   ├── api/                 # NestJS backend
│   └── web/                 # Next.js frontend
├── packages/
│   ├── shared/              # Shared TypeScript types
│   └── contracts/           # Anchor programs (Rust)
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

### API Structure (`apps/api`)

```
src/
├── main.ts
├── app.module.ts
├── config/
├── database/
├── health/
├── common/                  # filters, username, mentions, email, analytics
└── modules/
    ├── auth/
    ├── users/
    ├── videos/
    ├── voting/              # Off-chain votes
    ├── crowdfunding/        # Campaign + contribution records
    ├── comments/
    ├── follows/
    ├── notifications/
    ├── tags/
    ├── ai/
    ├── messages/
    ├── upload/              # Cloudinary signatures
    └── analytics/
```

### Frontend Structure (`apps/web`)

```
src/
├── app/                     # App Router pages
│   ├── page.tsx             # Marketing landing
│   ├── (auth)/              # login, register, forgot/reset password
│   └── (main)/              # videos, upload, crowdfunding, messages, settings
├── components/
├── hooks/
├── lib/
│   ├── api.ts
│   ├── solana.ts            # cluster, RPC, wallet list
│   └── utils.ts
└── providers/               # Connection + Wallet + React Query
```

### Smart Contracts (`packages/contracts`)

```
programs/
├── vibe-crowdfunding/src/lib.rs
└── vibe-voting/src/lib.rs
tests/
├── crowdfunding.test.ts
└── voting.test.ts
Anchor.toml
```

Devnet program IDs live in `packages/shared/src/constants.ts`. Placeholder Anchor IDs ship until a real deploy replaces them.

## Data Flow

### Authentication

1. Email/password → bcrypt → JWT (7 days, localStorage)
2. Wallet: `GET /auth/wallet/nonce` → wallet signs message (tweetnacl/bs58) → `POST /auth/wallet` → JWT
3. Password reset uses single-use tokens and optional Resend email

### Voting

Votes are written to Postgres (`Vote` unique on userId + videoId). The Solana voting program is not called by the web app yet.

### Crowdfunding

1. Campaign row is created in Postgres (`POST /crowdfunding/campaigns/:videoId`)
2. User connects a Solana wallet and sends SOL to the campaign program/destination
3. After confirmation, the client `POST`s `{ amount, txSignature }` to `/crowdfunding/campaigns/:id/contribute`
4. API stores `Contribution.txHash` and increments `raisedAmount`

Full Anchor `contribute` (vault PDA) requires an on-chain campaign account. Until that create flow is wired, the client records a confirmed transfer plus the API row.

## Security Measures

### API

- JWT bearer auth (7-day expiry)
- bcrypt password hashing
- Solana signature + nonce (replay-protected)
- Rate limits: 100/min default, 10/min auth, 30/min AI
- CORS from `FRONTEND_URL`
- class-validator + helmet + sanitized exception filter
- Username format, reserved names, change cooldown

### Programs

- Anchor account constraints and PDA seeds
- Platform fee cap 10% (1000 bps)
- Campaign duration cap 90 days
- Contribute / claim / refund state checks

## Database Schema (core)

User, UsernameHistory, Video (+ embedding vector 1536), Vote, Campaign, Contribution, Comment, CommentMention, Follow, Notification, Tag, VideoTag, AuthNonce, PasswordResetToken, ChatConversation, ChatMessage, DirectConversation, DirectMessage.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TailwindCSS |
| Wallets | @solana/wallet-adapter, Phantom, Solflare |
| API | NestJS 10, TypeScript 5 |
| Database | PostgreSQL 16, pgvector, Prisma |
| Blockchain | Solana, Anchor 0.30, Rust |
| Media | Cloudinary |
| Testing | Jest, Vitest, Anchor/mocha |
| CI/CD | GitHub Actions (`master`) |
| Hosting | Railway (nixpacks) + Docker Compose |

## Performance

- Indexes on email, wallet, video, campaign, notification inbox
- Paginated list endpoints
- Prisma connection pooling
- Throttler on auth and AI
- Next.js image optimization with host allowlist
