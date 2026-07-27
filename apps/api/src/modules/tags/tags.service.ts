import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { handleDatabaseError } from "../../common/exceptions/database.exceptions";

const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrending(limit = 10) {
    try {
      const since = new Date(Date.now() - TRENDING_WINDOW_MS);

      const grouped = await this.prisma.videoTag.groupBy({
        by: ["tagId"],
        where: {
          createdAt: { gte: since },
          video: { status: "APPROVED" },
        },
        _count: { videoId: true },
        orderBy: { _count: { videoId: "desc" } },
        take: limit,
      });

      if (grouped.length === 0) {
        return { data: [] };
      }

      const tags = await this.prisma.tag.findMany({
        where: { id: { in: grouped.map((g) => g.tagId) } },
        select: { id: true, name: true },
      });
      const byId = new Map(tags.map((t) => [t.id, t]));

      return {
        data: grouped
          .map((g) => {
            const tag = byId.get(g.tagId);
            return tag ? { ...tag, videoCount: g._count.videoId } : null;
          })
          .filter((t): t is { id: string; name: string; videoCount: number } => t !== null),
      };
    } catch (error) {
      handleDatabaseError(error, "TagsService.getTrending");
    }
  }

  async getVideosByTag(name: string, page = 1, limit = 20) {
    try {
      const tag = await this.prisma.tag.findUnique({
        where: { name: name.toLowerCase() },
      });

      if (!tag) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }

      const skip = (page - 1) * limit;
      const where = {
        status: "APPROVED" as const,
        tags: { some: { tagId: tag.id } },
      };

      const [videos, total] = await Promise.all([
        this.prisma.video.findMany({
          where,
          skip,
          take: limit,
          orderBy: { votes: { _count: "desc" } },
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
            _count: { select: { votes: true } },
          },
        }),
        this.prisma.video.count({ where }),
      ]);

      return {
        data: videos,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      handleDatabaseError(error, "TagsService.getVideosByTag");
    }
  }
}
