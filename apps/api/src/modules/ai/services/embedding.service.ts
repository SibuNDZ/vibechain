import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { OpenAiService } from "./openai.service";

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAiService: OpenAiService
  ) {}

  async generateAndStoreEmbedding(videoId: string): Promise<void> {
    if (!this.openAiService.isConfigured()) {
      this.logger.warn("OpenAI not configured, skipping embedding generation");
      return;
    }

    try {
      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
        select: { id: true, title: true, description: true },
      });

      if (!video) {
        this.logger.warn(`Video not found: ${videoId}`);
        return;
      }

      // Create text to embed from title and description
      const textToEmbed = `${video.title}${video.description ? ` - ${video.description}` : ""}`;
      const embedding = await this.openAiService.generateEmbedding(textToEmbed);

      // Store embedding using raw SQL (Prisma doesn't support pgvector natively)
      await this.prisma.$executeRaw`
        UPDATE videos
        SET embedding = ${JSON.stringify(embedding)}::vector,
            "embeddingUpdatedAt" = NOW()
        WHERE id = ${videoId}
      `;

      this.logger.log(`Generated embedding for video: ${videoId}`);
    } catch (error) {
      this.logger.error(`Failed to generate embedding for video ${videoId}: ${error}`);
      throw error;
    }
  }

  async batchGenerateEmbeddings(
    videoIds: string[],
    batchSize = 100
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize);

      const videos = await this.prisma.video.findMany({
        where: { id: { in: batch } },
        select: { id: true, title: true, description: true },
      });

      const texts = videos.map(
        (v) => `${v.title}${v.description ? ` - ${v.description}` : ""}`
      );

      try {
        const embeddings = await this.openAiService.generateEmbeddings(texts);

        // Store embeddings one by one (could be optimized with batch update)
        for (let j = 0; j < videos.length; j++) {
          try {
            await this.prisma.$executeRaw`
              UPDATE videos
              SET embedding = ${JSON.stringify(embeddings[j])}::vector,
                  "embeddingUpdatedAt" = NOW()
              WHERE id = ${videos[j].id}
            `;
            processed++;
          } catch (error) {
            this.logger.error(`Failed to store embedding for ${videos[j].id}: ${error}`);
            failed++;
          }
        }
      } catch (error) {
        this.logger.error(`Failed to generate batch embeddings: ${error}`);
        failed += batch.length;
      }

      this.logger.log(`Processed ${processed} embeddings, ${failed} failed`);
    }

    return { processed, failed };
  }

  async migrateExistingVideos(): Promise<{ processed: number; failed: number }> {
    // Find all videos without embeddings
    const videos = await this.prisma.video.findMany({
      where: {
        status: "APPROVED",
      },
      select: { id: true },
    });

    // Filter to those without embeddings using raw query
    const videosWithoutEmbeddings = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM videos
      WHERE embedding IS NULL AND status = 'APPROVED'
    `;

    const videoIds = videosWithoutEmbeddings.map((v) => v.id);

    if (videoIds.length === 0) {
      this.logger.log("No videos need embedding migration");
      return { processed: 0, failed: 0 };
    }

    this.logger.log(`Starting embedding migration for ${videoIds.length} videos`);
    return this.batchGenerateEmbeddings(videoIds);
  }
}
