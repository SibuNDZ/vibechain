-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VideoGenre" ADD VALUE 'AMAPIANO';
ALTER TYPE "VideoGenre" ADD VALUE 'KWAITO';
ALTER TYPE "VideoGenre" ADD VALUE 'GQOM';
ALTER TYPE "VideoGenre" ADD VALUE 'MASKANDI';
ALTER TYPE "VideoGenre" ADD VALUE 'MBAQANGA';
ALTER TYPE "VideoGenre" ADD VALUE 'ISICATHAMIYA';
ALTER TYPE "VideoGenre" ADD VALUE 'MARABI';
ALTER TYPE "VideoGenre" ADD VALUE 'KWELA';
ALTER TYPE "VideoGenre" ADD VALUE 'BOEREMUSIEK';
ALTER TYPE "VideoGenre" ADD VALUE 'LEKOMPO';
