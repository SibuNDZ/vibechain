import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCampaignDto, RecordContributionDto } from "./dto/crowdfunding.dto";
import { Decimal } from "@prisma/client/runtime/library";
import { handleDatabaseError } from "../../common/exceptions/database.exceptions";
import { AnalyticsService } from "../../common/analytics/analytics.service";

@Injectable()
export class CrowdfundingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async createCampaign(videoId: string, dto: CreateCampaignDto) {
    try {
      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
        include: { campaign: true },
      });

      if (!video) {
        throw new NotFoundException("Video not found");
      }

      if (video.campaign) {
        throw new BadRequestException("Campaign already exists for this video");
      }

      const campaign = await this.prisma.campaign.create({
        data: {
          videoId,
          goalAmount: dto.goalAmount,
          endDate: new Date(dto.endDate),
          contractAddress: dto.contractAddress,
        },
      });

      void this.analyticsService.track({
        event: "campaign_created",
        video_id: videoId,
        campaign_id: campaign.id,
        properties: {
          goalAmount: campaign.goalAmount?.toString?.() ?? campaign.goalAmount,
        },
      });

      return campaign;
    } catch (error) {
      handleDatabaseError(error, "CrowdfundingService.createCampaign");
    }
  }

  async findAll(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [campaigns, total] = await Promise.all([
        this.prisma.campaign.findMany({
          where: { status: "ACTIVE" },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            video: {
              include: {
                user: {
                  select: { id: true, username: true, avatarUrl: true },
                },
              },
            },
            _count: { select: { contributions: true } },
          },
        }),
        this.prisma.campaign.count({ where: { status: "ACTIVE" } }),
      ]);

      return {
        data: campaigns,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      handleDatabaseError(error, "CrowdfundingService.findAll");
    }
  }

  async findById(id: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id },
        include: {
          video: {
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
          },
          contributions: {
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: { select: { contributions: true } },
        },
      });

      if (!campaign) {
        throw new NotFoundException("Campaign not found");
      }

      return campaign;
    } catch (error) {
      handleDatabaseError(error, "CrowdfundingService.findById");
    }
  }

  async recordContribution(
    campaignId: string,
    userId: string,
    dto: RecordContributionDto
  ) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new NotFoundException("Campaign not found");
      }

      if (campaign.status !== "ACTIVE") {
        throw new BadRequestException("Campaign is not active");
      }

      // Use transaction to ensure atomicity
      const [contribution] = await this.prisma.$transaction([
        this.prisma.contribution.create({
          data: {
            campaignId,
            userId,
            amount: dto.amount,
            txHash: dto.txHash,
          },
        }),
        this.prisma.campaign.update({
          where: { id: campaignId },
          data: {
            raisedAmount: {
              increment: dto.amount,
            },
          },
        }),
      ]);

      void this.analyticsService.track({
        event: "campaign_contribution",
        user_id: userId,
        campaign_id: campaignId,
        amount: typeof dto.amount === "string" ? parseFloat(dto.amount) : dto.amount,
      });

      return contribution;
    } catch (error) {
      handleDatabaseError(error, "CrowdfundingService.recordContribution");
    }
  }

  async getContributions(campaignId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [contributions, total] = await Promise.all([
        this.prisma.contribution.findMany({
          where: { campaignId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        }),
        this.prisma.contribution.count({ where: { campaignId } }),
      ]);

      return {
        data: contributions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      handleDatabaseError(error, "CrowdfundingService.getContributions");
    }
  }
}
