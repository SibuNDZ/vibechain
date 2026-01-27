import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCommentDto, UpdateCommentDto } from "./dto/comment.dto";

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, videoId: string, dto: CreateCommentDto) {
    // Verify video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException("Video not found");
    }

    // If parentId provided, verify parent comment exists and belongs to same video
    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException("Parent comment not found");
      }

      if (parentComment.videoId !== videoId) {
        throw new ForbiddenException(
          "Parent comment does not belong to this video"
        );
      }
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        userId,
        videoId,
        parentId: dto.parentId,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  async findByVideo(videoId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          videoId,
          parentId: null, // Only top-level comments
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 3, // Show first 3 replies
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: { videoId, parentId: null },
      }),
    ]);

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findReplies(commentId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: { parentId: commentId },
      }),
    ]);

    return {
      data: replies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException("You can only edit your own comments");
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { video: { select: { userId: true } } },
    });

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    // Allow deletion by comment owner or video owner
    if (comment.userId !== userId && comment.video.userId !== userId) {
      throw new ForbiddenException(
        "You can only delete your own comments or comments on your videos"
      );
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: "Comment deleted successfully" };
  }

  async getCommentCount(videoId: string) {
    return this.prisma.comment.count({
      where: { videoId },
    });
  }
}
