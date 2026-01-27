import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { SemanticSearchService, SearchResult } from "./semantic-search.service";

export interface RecommendedVideo extends SearchResult {
  reason: string;
  score: number;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly semanticSearchService: SemanticSearchService
  ) {}

  async getRecommendations(userId: string, limit = 20): Promise<RecommendedVideo[]> {
    const recommendations: Map<string, RecommendedVideo> = new Map();

    // 1. Get videos from followed artists (30% weight)
    const followedArtistVideos = await this.getFollowedArtistVideos(userId, Math.ceil(limit * 0.3));
    for (const video of followedArtistVideos) {
      if (!recommendations.has(video.id)) {
        recommendations.set(video.id, {
          ...video,
          reason: `From ${video.user.username}, who you follow`,
          score: 0.3,
        });
      }
    }

    // 2. Get semantically similar videos to user's voted content (40% weight)
    const similarVideos = await this.getSimilarToVotedVideos(userId, Math.ceil(limit * 0.4));
    for (const video of similarVideos) {
      if (!recommendations.has(video.id)) {
        recommendations.set(video.id, {
          ...video,
          reason: "Based on videos you've liked",
          score: 0.4 * video.similarity,
        });
      }
    }

    // 3. Get trending videos (20% weight)
    const trendingVideos = await this.getTrendingVideos(userId, Math.ceil(limit * 0.2));
    for (const video of trendingVideos) {
      if (!recommendations.has(video.id)) {
        recommendations.set(video.id, {
          ...video,
          reason: "Trending on VibeChain",
          score: 0.2,
        });
      }
    }

    // 4. Add some random discovery (10% weight)
    const discoveryVideos = await this.getDiscoveryVideos(userId, Math.ceil(limit * 0.1));
    for (const video of discoveryVideos) {
      if (!recommendations.has(video.id)) {
        recommendations.set(video.id, {
          ...video,
          reason: "Discover something new",
          score: 0.1,
        });
      }
    }

    // Sort by score and return top results
    const sorted = Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return sorted;
  }

  async getSimilarVideos(videoId: string, limit = 10): Promise<RecommendedVideo[]> {
    const similar = await this.semanticSearchService.findSimilarVideos(videoId, limit);
    return similar.map((v) => ({
      ...v,
      reason: "Similar to this video",
      score: v.similarity,
    }));
  }

  private async getFollowedArtistVideos(
    userId: string,
    limit: number
  ): Promise<SearchResult[]> {
    // Get IDs of users that this user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    if (following.length === 0) {
      return [];
    }

    const followingIds = following.map((f) => f.followingId);

    // Get recent videos from followed users
    const videos = await this.prisma.video.findMany({
      where: {
        userId: { in: followingIds },
        status: "APPROVED",
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return videos.map((v) => ({
      ...v,
      similarity: 1,
    }));
  }

  private async getSimilarToVotedVideos(
    userId: string,
    limit: number
  ): Promise<SearchResult[]> {
    // Get user's voted videos
    const votes = await this.prisma.vote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { videoId: true },
    });

    if (votes.length === 0) {
      return [];
    }

    // Find videos similar to the most recently voted ones
    const allSimilar: SearchResult[] = [];
    for (const vote of votes.slice(0, 3)) {
      const similar = await this.semanticSearchService.findSimilarVideos(
        vote.videoId,
        Math.ceil(limit / 3)
      );
      allSimilar.push(...similar);
    }

    // Filter out videos the user has already voted for
    const votedIds = new Set(votes.map((v) => v.videoId));
    return allSimilar.filter((v) => !votedIds.has(v.id)).slice(0, limit);
  }

  private async getTrendingVideos(userId: string, limit: number): Promise<SearchResult[]> {
    // Get user's voted videos to exclude
    const votes = await this.prisma.vote.findMany({
      where: { userId },
      select: { videoId: true },
    });
    const votedIds = votes.map((v) => v.videoId);

    // Get videos with most votes in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await this.prisma.video.findMany({
      where: {
        status: "APPROVED",
        id: { notIn: votedIds.length > 0 ? votedIds : undefined },
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: {
        votes: { _count: "desc" },
      },
      take: limit,
    });

    return trending.map((v) => ({
      ...v,
      similarity: 1,
    }));
  }

  private async getDiscoveryVideos(userId: string, limit: number): Promise<SearchResult[]> {
    // Get user's voted videos to exclude
    const votes = await this.prisma.vote.findMany({
      where: { userId },
      select: { videoId: true },
    });
    const votedIds = votes.map((v) => v.videoId);

    // Get random approved videos
    const totalCount = await this.prisma.video.count({
      where: {
        status: "APPROVED",
        id: { notIn: votedIds.length > 0 ? votedIds : undefined },
      },
    });

    const skip = Math.max(0, Math.floor(Math.random() * (totalCount - limit)));

    const random = await this.prisma.video.findMany({
      where: {
        status: "APPROVED",
        id: { notIn: votedIds.length > 0 ? votedIds : undefined },
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      skip,
      take: limit,
    });

    return random.map((v) => ({
      ...v,
      similarity: 1,
    }));
  }

  async getAnonymousRecommendations(limit = 20): Promise<RecommendedVideo[]> {
    // For non-authenticated users, show trending and popular videos
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const videos = await this.prisma.video.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: [
        { votes: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    return videos.map((v) => ({
      ...v,
      similarity: 1,
      reason: "Popular on VibeChain",
      score: 1,
    }));
  }
}
