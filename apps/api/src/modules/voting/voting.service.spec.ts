import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VotingService } from './voting.service';
import { PrismaService } from '../../database/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('VotingService', () => {
  let service: VotingService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockVideo = {
    id: 'video-123',
    title: 'Test Video',
    description: 'Test description',
    videoUrl: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    status: 'APPROVED' as const,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    duration: 120,
    embeddingUpdatedAt: null,
  };

  const mockVote = {
    id: 'vote-123',
    userId: 'user-123',
    videoId: 'video-123',
    createdAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    avatarUrl: 'https://example.com/avatar.png',
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<VotingService>(VotingService);
  });

  describe('vote', () => {
    it('should create a vote for a video', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo);
      prisma.vote.findUnique.mockResolvedValue(null);
      prisma.vote.create.mockResolvedValue(mockVote);

      const result = await service.vote('user-123', 'video-123');

      expect(result).toEqual(mockVote);
      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: { userId: 'user-123', videoId: 'video-123' },
      });
    });

    it('should throw NotFoundException if video does not exist', async () => {
      prisma.video.findUnique.mockResolvedValue(null);

      await expect(service.vote('user-123', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException if already voted', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo);
      prisma.vote.findUnique.mockResolvedValue(mockVote);

      await expect(service.vote('user-123', 'video-123')).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('removeVote', () => {
    it('should remove an existing vote', async () => {
      prisma.vote.findUnique.mockResolvedValue(mockVote);
      prisma.vote.delete.mockResolvedValue(mockVote);

      const result = await service.removeVote('user-123', 'video-123');

      expect(result).toEqual(mockVote);
      expect(prisma.vote.delete).toHaveBeenCalledWith({
        where: { id: 'vote-123' },
      });
    });

    it('should throw NotFoundException if vote does not exist', async () => {
      prisma.vote.findUnique.mockResolvedValue(null);

      await expect(service.removeVote('user-123', 'video-123')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getVoteCount', () => {
    it('should return the vote count for a video', async () => {
      prisma.vote.count.mockResolvedValue(42);

      const result = await service.getVoteCount('video-123');

      expect(result).toBe(42);
      expect(prisma.vote.count).toHaveBeenCalledWith({
        where: { videoId: 'video-123' },
      });
    });
  });

  describe('hasVoted', () => {
    it('should return true if user has voted', async () => {
      prisma.vote.findUnique.mockResolvedValue(mockVote);

      const result = await service.hasVoted('user-123', 'video-123');

      expect(result).toBe(true);
    });

    it('should return false if user has not voted', async () => {
      prisma.vote.findUnique.mockResolvedValue(null);

      const result = await service.hasVoted('user-123', 'video-123');

      expect(result).toBe(false);
    });
  });

  describe('getLeaderboard', () => {
    it('should return top videos with vote counts', async () => {
      const mockVideos = [
        {
          ...mockVideo,
          id: 'video-1',
          user: mockUser,
          _count: { votes: 100 },
        },
        {
          ...mockVideo,
          id: 'video-2',
          user: mockUser,
          _count: { votes: 50 },
        },
      ];
      prisma.video.findMany.mockResolvedValue(mockVideos as any);

      const result = await service.getLeaderboard(10);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].voteCount).toBe(100);
      expect(result[1].rank).toBe(2);
      expect(result[1].voteCount).toBe(50);
    });

    it('should use default limit of 10', async () => {
      prisma.video.findMany.mockResolvedValue([]);

      await service.getLeaderboard();

      expect(prisma.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should only include approved videos', async () => {
      prisma.video.findMany.mockResolvedValue([]);

      await service.getLeaderboard();

      expect(prisma.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'APPROVED' },
        })
      );
    });
  });
});
