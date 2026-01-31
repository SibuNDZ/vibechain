-- DropForeignKey
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_userId_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_userId_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_videoId_fkey";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "contractCampaignId" INTEGER;

-- CreateTable
CREATE TABLE "direct_conversations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,

    CONSTRAINT "direct_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direct_conversations_user1Id_idx" ON "direct_conversations"("user1Id");

-- CreateIndex
CREATE INDEX "direct_conversations_user2Id_idx" ON "direct_conversations"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "direct_conversations_user1Id_user2Id_key" ON "direct_conversations"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "direct_messages_conversationId_idx" ON "direct_messages"("conversationId");

-- CreateIndex
CREATE INDEX "direct_messages_senderId_idx" ON "direct_messages"("senderId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "contributions_userId_idx" ON "contributions"("userId");

-- CreateIndex
CREATE INDEX "contributions_campaignId_idx" ON "contributions"("campaignId");

-- CreateIndex
CREATE INDEX "videos_status_idx" ON "videos"("status");

-- CreateIndex
CREATE INDEX "videos_userId_idx" ON "videos"("userId");

-- CreateIndex
CREATE INDEX "videos_createdAt_idx" ON "videos"("createdAt");

-- CreateIndex
CREATE INDEX "votes_videoId_idx" ON "votes"("videoId");

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "direct_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
