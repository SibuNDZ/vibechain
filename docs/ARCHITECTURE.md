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
            │  Next.js Web   │     │  RainbowKit    │     │    Polygon     │
            │  (Frontend)    │────▶│  (Wallet UI)   │────▶│   Blockchain   │
            └───────┬────────┘     └────────────────┘     └───────┬────────┘
                    │                                             │
                    │ REST API                                    │ JSON-RPC
                    ▼                                             │
            ┌────────────────┐                                    │
            │  NestJS API    │◀───────────────────────────────────┘
            │  (Backend)     │           Events/Queries
            └───────┬────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌────────────────┐     ┌────────────────┐
│  PostgreSQL    │     │     Redis      │
│  (Database)    │     │   (Cache)      │
└────────────────┘     └────────────────┘
```

## Package Structure

### Monorepo Layout

```
vibechain/
├── apps/
│   ├── api/                 # NestJS Backend
│   └── web/                 # Next.js Frontend
├── packages/
│   ├── shared/              # Shared TypeScript types
│   └── contracts/           # Solidity smart contracts
├── docs/                    # Documentation
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Local development
├── turbo.json               # Turborepo configuration
└── pnpm-workspace.yaml      # pnpm workspace config
```

### API Structure (apps/api)

```
src/
├── main.ts                     # Application entry point
├── app.module.ts               # Root module
├── config/
│   ├── configuration.ts        # Typed configuration
│   └── env.validation.ts       # Environment validation
├── database/
│   ├── database.module.ts      # Prisma module
│   └── prisma.service.ts       # Prisma client wrapper
├── health/
│   ├── health.module.ts        # Health check module
│   ├── health.controller.ts    # Health endpoints
│   └── prisma.health.ts        # Database health indicator
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts   # Global error handling
│   ├── middleware/
│   │   └── logging.middleware.ts      # Request logging
│   └── exceptions/
│       └── business.exceptions.ts     # Custom exceptions
└── modules/
    ├── auth/                   # Authentication
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   ├── jwt.strategy.ts
    │   └── dto/auth.dto.ts
    ├── users/                  # User management
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── users.module.ts
    ├── videos/                 # Video CRUD
    │   ├── videos.controller.ts
    │   ├── videos.service.ts
    │   ├── videos.module.ts
    │   └── dto/video.dto.ts
    ├── voting/                 # Vote tracking
    │   ├── voting.controller.ts
    │   ├── voting.service.ts
    │   └── voting.module.ts
    └── crowdfunding/           # Campaign management
        ├── crowdfunding.controller.ts
        ├── crowdfunding.service.ts
        ├── crowdfunding.module.ts
        └── dto/crowdfunding.dto.ts
```

### Frontend Structure (apps/web)

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── (auth)/                 # Auth routes group
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (main)/                 # Main routes group
│       ├── videos/page.tsx
│       ├── videos/[id]/page.tsx
│       └── crowdfunding/page.tsx
├── components/
│   ├── video/
│   │   ├── VideoCard.tsx
│   │   └── VideoPlayer.tsx
│   ├── voting/
│   │   └── VoteButton.tsx
│   └── crowdfunding/
│       ├── CampaignCard.tsx
│       └── FundButton.tsx
├── hooks/
│   └── useAuth.ts              # Authentication hook
├── lib/
│   ├── api.ts                  # API client
│   ├── wagmi.ts                # Web3 configuration
│   └── utils.ts                # Utilities
├── providers/
│   └── index.tsx               # Provider wrapper
└── test/
    └── setup.ts                # Test configuration
```

### Smart Contracts (packages/contracts)

```
contracts/
├── VibeCrowdfunding.sol        # Crowdfunding logic
└── VibeVoting.sol              # Voting rounds
test/
├── VibeCrowdfunding.test.ts
└── VibeVoting.test.ts
scripts/
└── deploy.ts                   # Deployment script
```

## Data Flow

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │────▶│ Next.js │────▶│ NestJS  │────▶│ Prisma  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     │  1. Submit    │  2. POST      │  3. Verify    │
     │     creds     │    /auth      │     + hash    │
     │               │               │               │
     │               │◀──────────────│◀──────────────│
     │◀──────────────│  4. JWT Token │  5. User data │
     │               │               │               │
```

### Voting Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│   API    │────▶│   DB     │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     │ 1. Vote        │ 2. Check       │
     │    (JWT)       │    duplicate   │
     │                │                │
     │                │ 3. Create      │
     │                │    vote        │
     │                │                │
     │◀───────────────│◀───────────────│
     │ 4. Updated     │                │
     │    count       │                │
```

### Crowdfunding Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ RainbowKit│────▶│ Polygon  │────▶│   API    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ 1. Connect     │ 2. Sign        │ 3. Tx hash     │
     │    wallet      │    transaction │    confirmed   │
     │                │                │                │
     │                │                │ 4. Record      │
     │                │                │    contribution│
     │◀───────────────│◀───────────────│◀───────────────│
     │ 5. Success     │                │                │
     │    message     │                │                │
```

## Security Measures

### API Security

- **Authentication**: JWT tokens (7-day expiry)
- **Password Hashing**: bcrypt with salt rounds
- **Wallet Auth**: ethers.js signature verification
- **Rate Limiting**: 100 requests/minute per IP
- **CORS**: Restricted to frontend origin
- **Validation**: class-validator for all inputs
- **Exception Filter**: Sanitized error responses

### Smart Contract Security

- **Access Control**: OpenZeppelin Ownable
- **Reentrancy Protection**: ReentrancyGuard on contribute()
- **Input Validation**: Require statements for all inputs
- **Platform Fee Cap**: Maximum 10% fee

## Database Schema

### Core Entities

```
User
├── id (UUID)
├── email
├── username
├── passwordHash
├── walletAddress
├── avatarUrl
├── bio
└── timestamps

Video
├── id (UUID)
├── title
├── description
├── videoUrl
├── thumbnailUrl
├── status (PENDING|APPROVED|REJECTED)
├── userId (FK)
└── timestamps

Vote
├── id (UUID)
├── userId (FK)
├── videoId (FK)
└── createdAt

Campaign
├── id (UUID)
├── videoId (FK)
├── goalAmount
├── raisedAmount
├── status (ACTIVE|SUCCESSFUL|FAILED|CANCELLED)
├── endDate
├── contractAddress
└── timestamps

Contribution
├── id (UUID)
├── campaignId (FK)
├── userId (FK)
├── amount
├── txHash
└── createdAt
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TailwindCSS |
| Web3 | wagmi, viem, RainbowKit |
| API | NestJS 10, TypeScript 5 |
| Database | PostgreSQL 16, Prisma ORM |
| Blockchain | Polygon, Solidity 0.8.24 |
| Testing | Jest, Vitest, Hardhat |
| CI/CD | GitHub Actions |
| Container | Docker, Docker Compose |

## Performance Considerations

- **Database Indexes**: On frequently queried columns (email, walletAddress, videoId)
- **Pagination**: All list endpoints support limit/offset
- **Connection Pooling**: Prisma connection pool (2-10 connections)
- **Rate Limiting**: Throttler module prevents abuse
- **Static Assets**: Next.js optimized image loading
