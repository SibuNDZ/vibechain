-- CreateTable
CREATE TABLE "comment_mentions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,

    CONSTRAINT "comment_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_mentions_commentId_idx" ON "comment_mentions"("commentId");

-- CreateIndex
CREATE INDEX "comment_mentions_mentionedUserId_idx" ON "comment_mentions"("mentionedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_mentions_commentId_mentionedUserId_key" ON "comment_mentions"("commentId", "mentionedUserId");

-- AddForeignKey
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
