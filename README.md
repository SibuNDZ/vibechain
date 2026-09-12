# VibeChain

A social music-video platform with community voting and Solana-powered crowdfunding.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, Solana Wallet Adapter
- **Backend**: NestJS, Prisma, PostgreSQL (pgvector)
- **Blockchain**: Anchor 0.30, Solana (devnet / mainnet-beta)
- **Infrastructure**: Docker, pnpm workspaces, Turborepo, Railway

## Project Structure

```
vibechain/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── contracts/    # Anchor programs (crowdfunding + voting)
│   └── shared/       # Shared TypeScript types
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Phantom or Solflare (for wallet login and funding)
- Optional: Solana CLI + Anchor 0.30.1 to build or deploy programs

## Getting Started

### 1. Clone and Install

```bash
cd vibechain
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit the `.env` files. At minimum the API needs `DATABASE_URL` and `JWT_SECRET`. Video uploads need Cloudinary keys. AI features need `OPENAI_API_KEY`.

### 3. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

Postgres is required. Redis is started for local compose but is not used by the API yet.

### 4. Database Setup

```bash
pnpm db:migrate
```

### 5. Build Shared Package

```bash
pnpm --filter @vibechain/shared build
```

### 6. Start Development Servers

```bash
pnpm dev

# Or start individually
pnpm --filter @vibechain/api dev
pnpm --filter @vibechain/web dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Solana Programs

Programs live in `packages/contracts`:

- `vibe-crowdfunding` — campaigns, SOL contributions, claim, refund
- `vibe-voting` — on-chain voting rounds (off-chain voting in Postgres is what the app uses today)

### Build and test

```bash
pnpm contracts:compile
cd packages/contracts && pnpm test
```

### Deploy

```bash
# Devnet
pnpm contracts:deploy

# Mainnet
pnpm --filter @vibechain/contracts deploy:mainnet
```

After deploy, put the program IDs in `apps/web/.env`:

```
NEXT_PUBLIC_CROWDFUNDING_PROGRAM=<program id>
NEXT_PUBLIC_VOTING_PROGRAM=<program id>
```

and in `packages/shared/src/constants.ts` (`PROGRAM_IDS`).

## Features

- **Video upload & streaming**: Cloudinary signed uploads, HLS playback, YouTube/Vimeo
- **Community voting**: Off-chain votes stored in Postgres
- **Crowdfunding**: Campaign list + detail; wallet transfer + API contribution record
- **Wallet authentication**: Solana nonce signature (Phantom / Solflare)
- **Social**: Comments, @mentions, follows, DMs, notifications, hashtags
- **AI (optional)**: Semantic search, chat, recommendations when `OPENAI_API_KEY` is set

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login with email/password |
| `/auth/wallet/nonce` | GET | Get wallet login nonce |
| `/auth/wallet` | POST | Authenticate with Solana wallet |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password |
| `/videos` | GET | List videos |
| `/videos` | POST | Create video after upload |
| `/voting/:videoId` | POST | Vote for video |
| `/voting/leaderboard` | GET | Get voting leaderboard |
| `/crowdfunding/campaigns` | GET | List campaigns |
| `/crowdfunding/campaigns/:id` | GET | Campaign detail |
| `/crowdfunding/campaigns/:id/contribute` | POST | Record on-chain contribution |
| `/crowdfunding/campaigns/:id/contributions` | GET | List contributions |

## License

MIT
