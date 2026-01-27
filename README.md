# VibeChain

A decentralized social media platform for music video streaming, community voting, and blockchain-powered crowdfunding.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, wagmi, RainbowKit
- **Backend**: NestJS, Prisma, PostgreSQL, Redis
- **Blockchain**: Solidity, Hardhat, Polygon/Amoy
- **Infrastructure**: Docker, pnpm workspaces, Turborepo

## Project Structure

```
vibechain/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── contracts/    # Solidity smart contracts
│   └── shared/       # Shared TypeScript types
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- A WalletConnect Project ID (get one at https://cloud.walletconnect.com)

## Getting Started

### 1. Clone and Install

```bash
cd vibechain
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit the `.env` files with your configuration.

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis
```

### 4. Database Setup

```bash
# Generate Prisma client and run migrations
pnpm db:migrate
```

### 5. Build Shared Package

```bash
cd packages/shared && pnpm build && cd ../..
```

### 6. Start Development Servers

```bash
# Start all services
pnpm dev

# Or start individually
pnpm --filter @vibechain/api dev
pnpm --filter @vibechain/web dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Smart Contracts

### Compile

```bash
pnpm contracts:compile
```

### Test

```bash
cd packages/contracts && pnpm test
```

### Deploy

```bash
# Testnet (Polygon Amoy)
pnpm contracts:deploy -- --network polygonAmoy

# Mainnet (Polygon)
pnpm contracts:deploy -- --network polygon
```

## Features

- **Video Upload & Streaming**: Upload music videos with HLS streaming
- **Community Voting**: Vote for your favorite videos (limited votes per user)
- **Crowdfunding**: Top-voted videos can launch blockchain-based campaigns
- **Wallet Authentication**: Sign in with Ethereum wallet (SIWE)
- **On-chain Transparency**: All crowdfunding contributions tracked on Polygon

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login with email/password |
| `/auth/wallet` | POST | Authenticate with wallet |
| `/videos` | GET | List videos |
| `/videos` | POST | Upload video |
| `/voting/:videoId` | POST | Vote for video |
| `/voting/leaderboard` | GET | Get voting leaderboard |
| `/crowdfunding/campaigns` | GET | List campaigns |
| `/crowdfunding/campaigns/:id/contribute` | POST | Record contribution |

## License

MIT
