FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm db:generate

# Development stage
FROM base AS development
WORKDIR /app/apps/api
CMD ["pnpm", "dev"]

# Production build
FROM base AS build
WORKDIR /app/apps/api
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
RUN npm install -g pnpm

WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/main"]
