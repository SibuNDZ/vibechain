import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCampaignDto, RecordContributionDto } from "./dto/crowdfunding.dto";
import { Decimal } from "@prisma/client/runtime/library";

@Injectable()
export class CrowdfundingService {
  constructor(private readonly prisma: PrismaService) {}

  async createCampaign(videoId: string, dto: CreateCampaignDto) {
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

    return this.prisma.campaign.create({
      data: {
        videoId,
        goalAmount: dto.goalAmount,
        endDate: new Date(dto.endDate),
        contractAddress: dto.contractAddress,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
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
  }

  async findById(id: string) {
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
  }

  async recordContribution(
    campaignId: string,
    userId: string,
    dto: RecordContributionDto
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (campaign.status !== "ACTIVE") {
      throw new BadRequestException("Campaign is not active");
    }

    const contribution = await this.prisma.contribution.create({
      data: {
        campaignId,
        userId,
        amount: dto.amount,
        txHash: dto.txHash,
      },
    });

    // Update raised amount
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        raisedAmount: {
          increment: dto.amount,
        },
      },
    });

    return contribution;
  }

  async getContributions(campaignId: string, page = 1, limit = 20) {
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
  }
}
