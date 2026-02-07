import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateVideoDto, UpdateVideoDto } from "./dto/video.dto";
import { handleDatabaseError } from "../../common/exceptions/database.exceptions";

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateVideoDto) {
    try {
      return await this.prisma.video.create({
        data: {
          ...dto,
          userId,
        },
      });
    } catch (error) {
      handleDatabaseError(error, "VideosService.create");
    }
  }

  async findAll(page = 1, limit = 20, sortBy = "votes") {
    try {
      const skip = (page - 1) * limit;

      const [videos, total] = await Promise.all([
        this.prisma.video.findMany({
          where: { status: "APPROVED" },
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
        this.prisma.video.count({ where: { status: "APPROVED" } }),
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

      return video;
    } catch (error) {
      handleDatabaseError(error, "VideosService.findById");
    }
  }

  async findByUser(userId: string) {
    try {
      return await this.prisma.video.findMany({
        where: { userId },
        include: {
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: "desc" },
      });
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
      return await this.prisma.video.findMany({
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
    } catch (error) {
      handleDatabaseError(error, "VideosService.getTopVideos");
    }
  }
}
