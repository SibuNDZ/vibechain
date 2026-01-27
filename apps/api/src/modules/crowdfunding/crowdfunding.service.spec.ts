import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CrowdfundingService } from './crowdfunding.service';
import { PrismaService } from '../../database/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('CrowdfundingService', () => {
  let service: CrowdfundingService;
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
    status: 'APPROVED',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    campaign: null,
    user: mockUser,
  };

  const mockCampaign = {
    id: 'campaign-123',
    videoId: 'video-123',
    goalAmount: 10000,
    raisedAmount: 5000,
    status: 'ACTIVE' as const,
    endDate: new Date('2025-12-31'),
    contractAddress: '0x1234567890abcdef',
    createdAt: new Date(),
    updatedAt: new Date(),
    video: mockVideo,
    _count: { contributions: 10 },
  };

  const mockContribution = {
    id: 'contribution-123',
    campaignId: 'campaign-123',
    userId: 'user-123',
    amount: 100,
    txHash: '0xabcdef123456',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrowdfundingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CrowdfundingService>(CrowdfundingService);
  });

  describe('createCampaign', () => {
    it('should create a campaign for a video', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo as any);
      prisma.campaign.create.mockResolvedValue(mockCampaign as any);

      const result = await service.createCampaign('video-123', {
        goalAmount: 10000,
        endDate: '2025-12-31',
        contractAddress: '0x1234567890abcdef',
      });

      expect(result).toEqual(mockCampaign);
      expect(prisma.campaign.create).toHaveBeenCalledWith({
        data: {
          videoId: 'video-123',
          goalAmount: 10000,
          endDate: new Date('2025-12-31'),
          contractAddress: '0x1234567890abcdef',
        },
      });
    });

    it('should throw NotFoundException if video not found', async () => {
      prisma.video.findUnique.mockResolvedValue(null);

      await expect(
        service.createCampaign('nonexistent', {
          goalAmount: 10000,
          endDate: '2025-12-31',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if campaign already exists', async () => {
      prisma.video.findUnique.mockResolvedValue({
        ...mockVideo,
        campaign: mockCampaign,
      } as any);

      await expect(
        service.createCampaign('video-123', {
          goalAmount: 10000,
          endDate: '2025-12-31',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated active campaigns', async () => {
      const campaigns = [mockCampaign];
      prisma.campaign.findMany.mockResolvedValue(campaigns as any);
      prisma.campaign.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);

      expect(result.data).toEqual(campaigns);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
    });
  });

  describe('findById', () => {
    it('should return a campaign by id', async () => {
      prisma.campaign.findUnique.mockResolvedValue({
        ...mockCampaign,
        contributions: [],
      } as any);

      const result = await service.findById('campaign-123');

      expect(result.id).toBe('campaign-123');
    });

    it('should throw NotFoundException if campaign not found', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('recordContribution', () => {
    it('should record a contribution and update raised amount', async () => {
      prisma.campaign.findUnique.mockResolvedValue(mockCampaign as any);
      prisma.contribution.create.mockResolvedValue(mockContribution as any);
      prisma.campaign.update.mockResolvedValue({
        ...mockCampaign,
        raisedAmount: 5100,
      } as any);

      const result = await service.recordContribution(
        'campaign-123',
        'user-123',
        {
          amount: 100,
          txHash: '0xabcdef123456',
        }
      );

      expect(result).toEqual(mockContribution);
      expect(prisma.contribution.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'campaign-123',
          userId: 'user-123',
          amount: 100,
          txHash: '0xabcdef123456',
        },
      });
      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-123' },
        data: {
          raisedAmount: { increment: 100 },
        },
      });
    });

    it('should throw NotFoundException if campaign not found', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        service.recordContribution('nonexistent', 'user-123', {
          amount: 100,
          txHash: '0xabcdef',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if campaign not active', async () => {
      prisma.campaign.findUnique.mockResolvedValue({
        ...mockCampaign,
        status: 'COMPLETED',
      } as any);

      await expect(
        service.recordContribution('campaign-123', 'user-123', {
          amount: 100,
          txHash: '0xabcdef',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getContributions', () => {
    it('should return paginated contributions', async () => {
      const contributions = [{ ...mockContribution, user: mockUser }];
      prisma.contribution.findMany.mockResolvedValue(contributions as any);
      prisma.contribution.count.mockResolvedValue(1);

      const result = await service.getContributions('campaign-123', 1, 20);

      expect(result.data).toEqual(contributions);
      expect(result.meta.total).toBe(1);
    });
  });
});
