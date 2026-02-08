import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { handleDatabaseError } from "../../common/exceptions/database.exceptions";
import { AnalyticsService } from "../../common/analytics/analytics.service";

@Injectable()
export class VotingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async vote(userId: string, videoId: string) {
    try {
      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video) {
        throw new NotFoundException("Video not found");
      }

      const existingVote = await this.prisma.vote.findUnique({
        where: {
          userId_videoId: { userId, videoId },
        },
      });

      if (existingVote) {
        throw new ConflictException("Already voted for this video");
      }

      const vote = await this.prisma.vote.create({
        data: { userId, videoId },
      });

      void this.analyticsService.track({
        event: "video_vote",
        user_id: userId,
        video_id: videoId,
      });

      return vote;
    } catch (error) {
      handleDatabaseError(error, "VotingService.vote");
    }
  }

  async removeVote(userId: string, videoId: string) {
    try {
      const vote = await this.prisma.vote.findUnique({
        where: {
          userId_videoId: { userId, videoId },
        },
      });

      if (!vote) {
        throw new NotFoundException("Vote not found");
      }

      return await this.prisma.vote.delete({
        where: { id: vote.id },
      });
    } catch (error) {
      handleDatabaseError(error, "VotingService.removeVote");
    }
  }

  async getVoteCount(videoId: string) {
    try {
      return await this.prisma.vote.count({
        where: { videoId },
      });
    } catch (error) {
      handleDatabaseError(error, "VotingService.getVoteCount");
    }
  }

  async hasVoted(userId: string, videoId: string) {
    try {
      const vote = await this.prisma.vote.findUnique({
        where: {
          userId_videoId: { userId, videoId },
        },
      });
      return !!vote;
    } catch (error) {
      handleDatabaseError(error, "VotingService.hasVoted");
    }
  }

  async getLeaderboard(limit = 10) {
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

      return videos.map((video: typeof videos[number], index: number) => ({
        rank: index + 1,
        ...video,
        voteCount: video._count.votes,
      }));
    } catch (error) {
      handleDatabaseError(error, "VotingService.getLeaderboard");
    }
  }
}
