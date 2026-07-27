import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateVideoDto, UpdateVideoDto } from "./dto/video.dto";
import { VideoGenre } from "@prisma/client";
import { handleDatabaseError } from "../../common/exceptions/database.exceptions";
import { AnalyticsService } from "../../common/analytics/analytics.service";
import { UploadService } from "../upload/upload.service";
import { mergeTagCandidates } from "../../common/tags/tag-parser";

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly uploadService: UploadService
  ) {}

  private withStreamingUrl<T extends { cloudinaryPublicId?: string | null }>(
    video: T
  ): T & { streamingUrl?: string } {
    if (!video?.cloudinaryPublicId) {
      return video;
    }

    try {
      return {
        ...video,
        streamingUrl: this.uploadService.getStreamingUrl(video.cloudinaryPublicId),
      };
    } catch {
      return video;
    }
  }

  async create(userId: string, dto: CreateVideoDto) {
    try {
      const { tags: explicitTags, ...videoData } = dto;

      const video = await this.prisma.video.create({
        data: {
          ...videoData,
          status: "APPROVED",
          userId,
        },
      });

      const tagNames = mergeTagCandidates(videoData.description, explicitTags);
      await this.syncVideoTags(video.id, tagNames);

      void this.analyticsService.track({
        event: "video_upload",
        user_id: userId,
        video_id: video.id,
        genre: video.genre ?? null,
        properties: {
          duration: video.duration,
        },
      });

      return this.withStreamingUrl(video);
    } catch (error) {
      handleDatabaseError(error, "VideosService.create");
    }
  }

  /**
   * Upserts each tag by normalized name, then diffs the video's current
   * VideoTag rows against the desired set -- adding new ones, removing ones
   * no longer present, rather than just appending.
   */
  private async syncVideoTags(videoId: string, tagNames: string[]) {
    if (tagNames.length === 0) {
      await this.prisma.videoTag.deleteMany({ where: { videoId } });
      return;
    }

    const tags = await Promise.all(
      tagNames.map((name) =>
        this.prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        })
      )
    );

    const currentLinks = await this.prisma.videoTag.findMany({
      where: { videoId },
      select: { tagId: true },
    });
    const currentTagIds = new Set(currentLinks.map((l) => l.tagId));
    const desiredTagIds = new Set(tags.map((t) => t.id));

    const toAdd = tags.filter((t) => !currentTagIds.has(t.id));
    const toRemoveIds = [...currentTagIds].filter((id) => !desiredTagIds.has(id));

    await Promise.all([
      toAdd.length > 0
        ? this.prisma.videoTag.createMany({
            data: toAdd.map((t) => ({ videoId, tagId: t.id })),
            skipDuplicates: true,
          })
        : Promise.resolve(),
      toRemoveIds.length > 0
        ? this.prisma.videoTag.deleteMany({
            where: { videoId, tagId: { in: toRemoveIds } },
          })
        : Promise.resolve(),
    ]);
  }

  async findAll(
    page = 1,
    limit = 20,
    sortBy = "votes",
    genre?: VideoGenre,
    userId?: string
  ) {
    try {
      const skip = (page - 1) * limit;
      const where = {
        status: "APPROVED" as const,
        ...(genre ? { genre } : {}),
        ...(userId ? { userId } : {}),
      };

      const [videos, total] = await Promise.all([
        this.prisma.video.findMany({
          where,
          skip,
          take: limit,
          orderBy:
            sortBy === "votes"
              ? { votes: { _count: "desc" } }
              : { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
            _count: { select: { votes: true } },
          },
        }),
        this.prisma.video.count({ where }),
      ]);

      return {
        data: videos.map((video) => this.withStreamingUrl(video)),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      handleDatabaseError(error, "VideosService.findAll");
    }
  }

  async findById(id: string) {
    try {
      const video = await this.prisma.video.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: { select: { votes: true } },
          campaign: true,
          tags: { select: { tag: { select: { name: true } } } },
        },
      });

      if (!video) {
        throw new NotFoundException("Video not found");
      }

      return this.withStreamingUrl(video);
    } catch (error) {
      handleDatabaseError(error, "VideosService.findById");
    }
  }

  async findByUser(userId: string) {
    try {
      const videos = await this.prisma.video.findMany({
        where: { userId },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return videos.map((video) => this.withStreamingUrl(video));
    } catch (error) {
      handleDatabaseError(error, "VideosService.findByUser");
    }
  }

  async update(id: string, userId: string, dto: UpdateVideoDto) {
    try {
      const video = await this.prisma.video.findFirst({
        where: { id, userId },
      });

      if (!video) {
        throw new NotFoundException("Video not found");
      }

      const { tags: explicitTags, ...updateData } = dto;

      const updated = await this.prisma.video.update({
        where: { id },
        data: updateData,
      });

      if (dto.description !== undefined || explicitTags !== undefined) {
        const tagNames = mergeTagCandidates(
          dto.description !== undefined ? dto.description : video.description,
          explicitTags
        );
        await this.syncVideoTags(id, tagNames);
      }

      return updated;
    } catch (error) {
      handleDatabaseError(error, "VideosService.update");
    }
  }

  async getTopVideos(limit = 10) {
    try {
      const videos = await this.prisma.video.findMany({
        where: { status: "APPROVED" },
        take: limit,
        orderBy: { votes: { _count: "desc" } },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: { select: { votes: true } },
        },
      });
      return videos.map((video) => this.withStreamingUrl(video));
    } catch (error) {
      handleDatabaseError(error, "VideosService.getTopVideos");
    }
  }

  async regenerateThumbnails(force = false) {
    try {
      const where = force
        ? { cloudinaryPublicId: { not: null } }
        : {
            cloudinaryPublicId: { not: null },
            OR: [{ thumbnailUrl: null }, { thumbnailUrl: "" }],
          };

      const videos = await this.prisma.video.findMany({
        where,
        select: { id: true, cloudinaryPublicId: true },
      });

      let updated = 0;
      let failed = 0;

      for (const video of videos) {
        if (!video.cloudinaryPublicId) continue;
        try {
          const thumbnailUrl = this.uploadService.getThumbnailUrl(
            video.cloudinaryPublicId,
            { width: 1280, height: 720 }
          );
          await this.prisma.video.update({
            where: { id: video.id },
            data: { thumbnailUrl },
          });
          updated += 1;
        } catch {
          failed += 1;
        }
      }

      return {
        total: videos.length,
        updated,
        failed,
        force,
      };
    } catch (error) {
      handleDatabaseError(error, "VideosService.regenerateThumbnails");
    }
  }
}
