import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateVideoDto, UpdateVideoDto } from "./dto/video.dto";
import { VideoGenre } from "@prisma/client";
import { handleDatabaseError } from "../../common/exceptions/database.exceptions";
import { AnalyticsService } from "../../common/analytics/analytics.service";
import { UploadService } from "../upload/upload.service";

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
      const video = await this.prisma.video.create({
        data: {
          ...dto,
          status: "APPROVED",
          userId,
        },
      });

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

  async findAll(
    page = 1,
    limit = 20,
    sortBy = "votes",
    genre?: VideoGenre
  ) {
    try {
      const skip = (page - 1) * limit;
      const where = {
        status: "APPROVED" as const,
        ...(genre ? { genre } : {}),
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

      return await this.prisma.video.update({
        where: { id },
        data: dto,
      });
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
}
