-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateTable
CREATE TABLE "video_tags" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "videoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "video_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_tags_videoId_idx" ON "video_tags"("videoId");

-- CreateIndex
CREATE INDEX "video_tags_tagId_idx" ON "video_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "video_tags_videoId_tagId_key" ON "video_tags"("videoId", "tagId");

-- AddForeignKey
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
