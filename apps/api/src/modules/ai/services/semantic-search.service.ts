import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { OpenAiService } from "./openai.service";

export interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  status: string;
  createdAt: Date;
  userId: string;
  similarity: number;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  _count: {
    votes: number;
  };
}

interface RawSearchResult {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  status: string;
  createdAt: Date;
  userId: string;
  similarity: number;
  user_id: string;
  user_username: string;
  user_avatarUrl: string | null;
  vote_count: number;
}

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAiService: OpenAiService
  ) {}

  async search(
    query: string,
    limit = 20,
    threshold = 0.5
  ): Promise<SearchResult[]> {
    if (!this.openAiService.isConfigured()) {
      this.logger.warn("OpenAI not configured, falling back to keyword search");
      return this.keywordSearch(query, limit);
    }

    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.openAiService.generateEmbedding(query);
      const embeddingJson = JSON.stringify(queryEmbedding);

      // Perform vector similarity search
      const results = await this.prisma.$queryRaw<RawSearchResult[]>`
        SELECT
          v.id,
          v.title,
          v.description,
          v."videoUrl",
          v."thumbnailUrl",
          v.duration,
          v.status,
          v."createdAt",
          v."userId",
          1 - (v.embedding <=> ${embeddingJson}::vector) as similarity,
          u.id as user_id,
          u.username as user_username,
          u."avatarUrl" as "user_avatarUrl",
          (SELECT COUNT(*) FROM votes WHERE "videoId" = v.id)::int as vote_count
        FROM videos v
        JOIN users u ON v."userId" = u.id
        WHERE v.embedding IS NOT NULL
          AND v.status = 'APPROVED'
          AND 1 - (v.embedding <=> ${embeddingJson}::vector) > ${threshold}
        ORDER BY v.embedding <=> ${embeddingJson}::vector
        LIMIT ${limit}
      `;

      return results.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl,
        duration: r.duration,
        status: r.status,
        createdAt: r.createdAt,
        userId: r.userId,
        similarity: Number(r.similarity),
        user: {
          id: r.user_id,
          username: r.user_username,
          avatarUrl: r.user_avatarUrl,
        },
        _count: {
          votes: r.vote_count,
        },
      }));
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error}`);
      // Fall back to keyword search
      return this.keywordSearch(query, limit);
    }
  }

  async findSimilarVideos(videoId: string, limit = 10): Promise<SearchResult[]> {
    try {
      // Get the video's embedding
      const video = await this.prisma.$queryRaw<{ embedding: string }[]>`
        SELECT embedding::text FROM videos WHERE id = ${videoId}
      `;

      if (!video[0]?.embedding) {
        this.logger.warn(`Video ${videoId} has no embedding`);
        return [];
      }

      // Find similar videos
      const results = await this.prisma.$queryRaw<RawSearchResult[]>`
        SELECT
          v.id,
          v.title,
          v.description,
          v."videoUrl",
          v."thumbnailUrl",
          v.duration,
          v.status,
          v."createdAt",
          v."userId",
          1 - (v.embedding <=> (SELECT embedding FROM videos WHERE id = ${videoId})) as similarity,
          u.id as user_id,
          u.username as user_username,
          u."avatarUrl" as "user_avatarUrl",
          (SELECT COUNT(*) FROM votes WHERE "videoId" = v.id)::int as vote_count
        FROM videos v
        JOIN users u ON v."userId" = u.id
        WHERE v.embedding IS NOT NULL
          AND v.status = 'APPROVED'
          AND v.id != ${videoId}
        ORDER BY v.embedding <=> (SELECT embedding FROM videos WHERE id = ${videoId})
        LIMIT ${limit}
      `;

      return results.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl,
        duration: r.duration,
        status: r.status,
        createdAt: r.createdAt,
        userId: r.userId,
        similarity: Number(r.similarity),
        user: {
          id: r.user_id,
          username: r.user_username,
          avatarUrl: r.user_avatarUrl,
        },
        _count: {
          votes: r.vote_count,
        },
      }));
    } catch (error) {
      this.logger.error(`Find similar videos failed: ${error}`);
      return [];
    }
  }

  private async keywordSearch(query: string, limit: number): Promise<SearchResult[]> {
    const videos = await this.prisma.video.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return videos.map((v) => ({
      ...v,
      similarity: 0.5, // Default similarity for keyword matches
    }));
  }
}
