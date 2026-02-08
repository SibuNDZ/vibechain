-- Add video genre enum and column
CREATE TYPE "VideoGenre" AS ENUM (
  'POP',
  'ROCK',
  'REGGAE',
  'GOSPEL_LOCAL',
  'GOSPEL_INTERNATIONAL',
  'RNB',
  'HIPHOP'
);

ALTER TABLE "videos" ADD COLUMN "genre" "VideoGenre";

CREATE INDEX "videos_genre_idx" ON "videos"("genre");
