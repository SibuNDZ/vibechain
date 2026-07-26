-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastUsernameChangeAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "username_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldUsername" TEXT NOT NULL,
    "newUsername" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "username_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "username_history_userId_idx" ON "username_history"("userId");

-- CreateIndex
CREATE INDEX "username_history_oldUsername_idx" ON "username_history"("oldUsername");

-- AddForeignKey
ALTER TABLE "username_history" ADD CONSTRAINT "username_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
