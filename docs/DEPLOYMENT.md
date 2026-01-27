# VibeChain Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Access to Polygon RPC endpoints

## Environment Setup

### 1. Configure Environment Variables

```bash
# Copy production templates
cp apps/api/.env.example apps/api/.env.production
cp apps/web/.env.example apps/web/.env.production
```

### 2. Required Secrets

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `JWT_SECRET` | 256-bit secret for JWT signing | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | Your database provider |
| `WALLET_CONNECT_PROJECT_ID` | WalletConnect Cloud project ID | [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `PRIVATE_KEY` | Deployer wallet private key | Your deployment wallet |
| `POLYGONSCAN_API_KEY` | For contract verification | [polygonscan.com/apis](https://polygonscan.com/apis) |

## Deployment Options

### Option 1: Docker Compose (Recommended for small deployments)

```bash
# Build and start all services
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Manual Deployment

#### API Server

```bash
cd apps/api

# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Build
pnpm build

# Start production server
NODE_ENV=production pnpm start:prod
```

#### Web Frontend

```bash
cd apps/web

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build

# Start production server
pnpm start
```

### Option 3: Vercel (Frontend only)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_CROWDFUNDING_CONTRACT`
   - `NEXT_PUBLIC_VOTING_CONTRACT`
3. Deploy

## Database Migrations

```bash
# Run migrations in production
DATABASE_URL=your_production_url pnpm --filter @vibechain/api db:migrate

# Generate Prisma client
pnpm --filter @vibechain/api db:generate
```

## Smart Contract Deployment

### Testnet (Polygon Amoy)

```bash
cd packages/contracts

# Set environment variables
export PRIVATE_KEY=your_deployer_private_key
export POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
export POLYGONSCAN_API_KEY=your_api_key

# Deploy
pnpm deploy:testnet

# Verify contracts
npx hardhat verify --network polygonAmoy <CONTRACT_ADDRESS>
```

### Mainnet (Polygon)

```bash
# Deploy
pnpm deploy:mainnet

# Verify
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

## Health Checks

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Full health check | `{ status: "ok", ... }` |
| `GET /health/ready` | Readiness probe | `{ status: "ok" }` |
| `GET /health/live` | Liveness probe | `{ status: "ok" }` |

## Monitoring

### Application Logs

```bash
# Docker
docker-compose logs -f api

# Systemd
journalctl -u vibechain-api -f
```

### Recommended Monitoring Stack

- **Logs**: ELK Stack or Loki
- **Metrics**: Prometheus + Grafana
- **Error Tracking**: Sentry
- **Uptime**: UptimeRobot or Pingdom

## SSL/TLS Configuration

Use a reverse proxy (nginx, Caddy, Traefik) for SSL termination:

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

## Rollback Procedures

### API Rollback

```bash
# Docker
docker-compose pull api
docker-compose up -d api

# Manual
git checkout <previous-tag>
pnpm install && pnpm build
pm2 restart api
```

### Database Rollback

```bash
# Revert last migration
npx prisma migrate reset --skip-seed
```

### Contract Rollback

Smart contracts are immutable. Deploy new versions and update frontend configuration.

## Troubleshooting

### Database Connection Issues

1. Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
2. Check network connectivity
3. Verify connection pool settings

### Contract Verification Failed

1. Ensure `POLYGONSCAN_API_KEY` is valid
2. Wait 30-60 seconds after deployment
3. Verify compiler settings match

### Frontend Build Errors

1. Clear `.next` cache: `rm -rf .next`
2. Verify all environment variables are set
3. Check for TypeScript errors: `pnpm tsc --noEmit`
