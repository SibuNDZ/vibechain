-- CreateTable
CREATE TABLE "auth_nonces" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "auth_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_nonces_walletAddress_idx" ON "auth_nonces"("walletAddress");

-- CreateIndex
CREATE INDEX "auth_nonces_expiresAt_idx" ON "auth_nonces"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "auth_nonces_walletAddress_nonce_key" ON "auth_nonces"("walletAddress", "nonce");
