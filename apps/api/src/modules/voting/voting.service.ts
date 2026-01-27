import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class VotingService {
  constructor(private readonly prisma: PrismaService) {}

  async vote(userId: string, videoId: string) {
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

    return this.prisma.vote.create({
      data: { userId, videoId },
    });
  }

  async removeVote(userId: string, videoId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: {
        userId_videoId: { userId, videoId },
      },
    });

    if (!vote) {
      throw new NotFoundException("Vote not found");
    }

    return this.prisma.vote.delete({
      where: { id: vote.id },
    });
  }

  async getVoteCount(videoId: string) {
    return this.prisma.vote.count({
      where: { videoId },
    });
  }

  async hasVoted(userId: string, videoId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: {
        userId_videoId: { userId, videoId },
      },
    });
    return !!vote;
  }

  async getLeaderboard(limit = 10) {
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
  }
}
