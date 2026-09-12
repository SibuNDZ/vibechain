# VibeChain Deployment Guide

## Prerequisites

- Docker and Docker Compose, or Railway
- Node.js 20+
- pnpm 9+
- PostgreSQL 16+ with pgvector
- Solana RPC (public devnet, or Helius/Alchemy/QuickNode for production)
- Optional: Solana CLI + Anchor 0.30.1 to deploy programs

## Environment Setup

### 1. Configure Environment Variables

```bash
cp apps/api/.env.example apps/api/.env.production
cp apps/web/.env.example apps/web/.env.production
```

### 2. Required Secrets

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `JWT_SECRET` | 256-bit secret for JWT signing | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | Your database provider |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Video uploads | Cloudinary dashboard |
| `SOLANA_RPC_URL` | Solana JSON-RPC | Helius, Alchemy, QuickNode, or public cluster |
| `SOLANA_CLUSTER` | `devnet` or `mainnet-beta` | Match the frontend network |
| `NEXT_PUBLIC_CROWDFUNDING_PROGRAM` | Crowdfunding program ID | After `anchor deploy` |
| `NEXT_PUBLIC_VOTING_PROGRAM` | Voting program ID | After `anchor deploy` |
| `SOLANA_KEYPAIR` | Deployer keypair JSON (CI) | `solana-keygen` — never commit this |

Optional: `OPENAI_API_KEY`, `RESEND_API_KEY`, `ADMIN_USER_IDS`, `ANALYTICS_API_URL` / `ANALYTICS_API_KEY`.

## Deployment Options

### Option 1: Docker Compose

```bash
docker-compose -f docker-compose.yml up -d
docker-compose logs -f
docker-compose down
```

Compose starts Postgres (pgvector), Redis, API, and web. Redis is unused by the API today.

### Option 2: Railway

Each app has a `railway.toml`.

- API `startCommand` in `package.json` `start:prod` runs `prisma migrate deploy && node dist/main`. Prefer that over a bare `node dist/main` so migrations apply.
- Web: set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOLANA_NETWORK`, and program IDs at build time.

### Option 3: Manual

#### API

```bash
cd apps/api
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate
pnpm build
NODE_ENV=production pnpm start:prod
```

#### Web

```bash
cd apps/web
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

## Database Migrations

```bash
DATABASE_URL=your_production_url pnpm --filter @vibechain/api db:migrate
pnpm --filter @vibechain/api db:generate
```

The AI migration enables `CREATE EXTENSION vector`. Use a pgvector-capable Postgres image or Neon with the extension allowed.

## Solana Program Deployment

Need: Solana CLI, Anchor 0.30.1, a funded keypair.

```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --url devnet
solana airdrop 2
```

### Devnet

```bash
cd packages/contracts
pnpm compile
pnpm test
pnpm deploy:devnet
```

Copy the printed program IDs into:

- `apps/web/.env` → `NEXT_PUBLIC_CROWDFUNDING_PROGRAM`, `NEXT_PUBLIC_VOTING_PROGRAM`
- `packages/shared/src/constants.ts` → `PROGRAM_IDS.devnet`
- `packages/contracts/Anchor.toml` and each program `declare_id!` if you generated new keypairs

GitHub Actions: `.github/workflows/deploy-contracts.yml` (workflow_dispatch, needs `SOLANA_KEYPAIR` secret).

### Mainnet

```bash
pnpm --filter @vibechain/contracts deploy:mainnet
```

Use a private RPC. Programs are upgradeable by the deployer keypair — treat that key as production secret.

## Health Checks

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Full health check | `{ status: "ok", ... }` |
| `GET /health/ready` | Readiness probe | `{ status: "ok" }` |
| `GET /health/live` | Liveness probe | `{ status: "ok" }` |

## CI

`.github/workflows/ci.yml` runs on `master`, `main`, and `develop`:

- Lint
- API Jest tests (Postgres 16 service)
- Anchor build + tests (Rust, Solana CLI, Anchor)
- Frontend Vitest
- `pnpm build`

## Monitoring

- Logs: Railway, Docker, or journald
- Suggested: Sentry for errors, UptimeRobot for `/health`

## SSL/TLS

Terminate TLS at a reverse proxy. Example nginx:

```nginx
server {
    listen 443 ssl;
    server_name api.vibechain.app;

    ssl_certificate /etc/letsencrypt/live/vibechain.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibechain.app/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Request-ID $request_id;
    }
}
```

## Rollback

### API

Redeploy the previous image or git SHA, then `pnpm build &&` restart the process.

### Database

Prefer a forward fix migration. `prisma migrate reset` destroys data — do not use it in production.

### Programs

Programs are immutable except via upgrade authority. Deploy a new version or upgrade with the deployer keypair, then update frontend program IDs.

## Troubleshooting

### Database connection

1. Check `DATABASE_URL`: `postgresql://user:password@host:port/database`
2. Confirm pgvector is available if embeddings are used
3. Check connection pool size

### Program deploy failed

1. `solana balance` — deployer needs SOL (devnet: `solana airdrop 2`)
2. `declare_id!` must match the keypair in `target/deploy/*-keypair.json`
3. RPC rate limits — use a dedicated provider

### Frontend build

1. Clear `.next`
2. Set `NEXT_PUBLIC_API_URL` and Solana public env vars
3. `pnpm --filter @vibechain/shared build` first
4. `pnpm tsc --noEmit`
