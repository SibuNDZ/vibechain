import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VideosService } from './videos.service';
import { PrismaService } from '../../database/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../../common/analytics/analytics.service';

describe('VideosService', () => {
  let service: VideosService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    avatarUrl: 'https://example.com/avatar.png',
  };

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
    user: mockUser,
    _count: { votes: 10 },
    campaign: null,
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AnalyticsService,
          useValue: {
            track: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  describe('create', () => {
    it('should create a video', async () => {
      prisma.video.create.mockResolvedValue(mockVideo as any);

      const result = await service.create('user-123', {
        title: 'Test Video',
        description: 'Test description',
        videoUrl: 'https://example.com/video.mp4',
        duration: 120,
      });

      expect(result).toEqual(mockVideo);
      expect(prisma.video.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Video',
          description: 'Test description',
          videoUrl: 'https://example.com/video.mp4',
          userId: 'user-123',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated videos sorted by votes', async () => {
      const mockVideos = [mockVideo];
      prisma.video.findMany.mockResolvedValue(mockVideos as any);
      prisma.video.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20, 'votes');

      expect(result.data).toEqual(mockVideos);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'APPROVED' },
          orderBy: { votes: { _count: 'desc' } },
        })
      );
    });

    it('should return videos sorted by createdAt when sortBy is not votes', async () => {
      prisma.video.findMany.mockResolvedValue([]);
      prisma.video.count.mockResolvedValue(0);

      await service.findAll(1, 20, 'createdAt');

      expect(prisma.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      prisma.video.findMany.mockResolvedValue([]);
      prisma.video.count.mockResolvedValue(45);

      const result = await service.findAll(2, 20);

      expect(result.meta.totalPages).toBe(3);
      expect(prisma.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });
  });

  describe('findById', () => {
    it('should return a video by id', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo as any);

      const result = await service.findById('video-123');

      expect(result).toEqual(mockVideo);
      expect(prisma.video.findUnique).toHaveBeenCalledWith({
        where: { id: 'video-123' },
        include: expect.objectContaining({
          user: expect.any(Object),
          _count: expect.any(Object),
          campaign: true,
        }),
      });
    });

    it('should throw NotFoundException if video not found', async () => {
      prisma.video.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findByUser', () => {
    it('should return videos by user', async () => {
      const userVideos = [mockVideo];
      prisma.video.findMany.mockResolvedValue(userVideos as any);

      const result = await service.findByUser('user-123');

      expect(result).toEqual(userVideos);
      expect(prisma.video.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: { _count: { select: { votes: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update a video', async () => {
      prisma.video.findFirst.mockResolvedValue(mockVideo as any);
      const updatedVideo = { ...mockVideo, title: 'Updated Title' };
      prisma.video.update.mockResolvedValue(updatedVideo as any);

      const result = await service.update('video-123', 'user-123', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(prisma.video.update).toHaveBeenCalledWith({
        where: { id: 'video-123' },
        data: { title: 'Updated Title' },
      });
    });

    it('should throw NotFoundException if video not found or not owned', async () => {
      prisma.video.findFirst.mockResolvedValue(null);

      await expect(
        service.update('video-123', 'wrong-user', { title: 'Updated' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTopVideos', () => {
    it('should return top videos', async () => {
      const topVideos = [mockVideo];
      prisma.video.findMany.mockResolvedValue(topVideos as any);

      const result = await service.getTopVideos(10);

      expect(result).toEqual(topVideos);
      expect(prisma.video.findMany).toHaveBeenCalledWith({
        where: { status: 'APPROVED' },
        take: 10,
        orderBy: { votes: { _count: 'desc' } },
        include: expect.any(Object),
      });
    });

    it('should use default limit of 10', async () => {
      prisma.video.findMany.mockResolvedValue([]);

      await service.getTopVideos();

      expect(prisma.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });
});
