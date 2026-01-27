import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { CrowdfundingService } from "./crowdfunding.service";
import { CreateCampaignDto, RecordContributionDto } from "./dto/crowdfunding.dto";

@ApiTags("crowdfunding")
@Controller("crowdfunding")
export class CrowdfundingController {
  constructor(private readonly crowdfundingService: CrowdfundingService) {}

  @Post("campaigns/:videoId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a crowdfunding campaign for a video" })
  async createCampaign(
    @Param("videoId") videoId: string,
    @Body() dto: CreateCampaignDto
  ) {
    return this.crowdfundingService.createCampaign(videoId, dto);
  }

  @Get("campaigns")
  @ApiOperation({ summary: "Get all active campaigns" })
  async findAll(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.crowdfundingService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Get("campaigns/:id")
  @ApiOperation({ summary: "Get campaign by ID" })
  async findOne(@Param("id") id: string) {
    return this.crowdfundingService.findById(id);
  }

  @Post("campaigns/:id/contribute")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Record a contribution to a campaign" })
  async contribute(
    @Param("id") id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: RecordContributionDto
  ) {
    return this.crowdfundingService.recordContribution(
      id,
      req.user.userId,
      dto
    );
  }

  @Get("campaigns/:id/contributions")
  @ApiOperation({ summary: "Get contributions for a campaign" })
  async getContributions(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.crowdfundingService.getContributions(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }
}
