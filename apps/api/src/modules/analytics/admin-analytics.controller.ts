import {
  BadGatewayException,
  Controller,
  Get,
  Param,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AdminGuard } from "../../common/guards/admin.guard";
import { AnalyticsService } from "../../common/analytics/analytics.service";

@ApiTags("admin-analytics")
@ApiBearerAuth()
@Controller("admin/analytics")
@UseGuards(AuthGuard("jwt"), AdminGuard)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboards")
  @ApiOperation({ summary: "List analytics dashboards (admin only)" })
  async listDashboards() {
    if (!this.analyticsService.isConfigured()) {
      throw new ServiceUnavailableException("Analytics API not configured");
    }

    try {
      return await this.analyticsService.listDashboards();
    } catch (error: any) {
      throw new BadGatewayException(error?.message || "Analytics API error");
    }
  }

  @Get("dashboards/:id")
  @ApiOperation({ summary: "Get analytics dashboard (admin only)" })
  async getDashboard(@Param("id") id: string) {
    if (!this.analyticsService.isConfigured()) {
      throw new ServiceUnavailableException("Analytics API not configured");
    }

    try {
      return await this.analyticsService.getDashboard(id);
    } catch (error: any) {
      throw new BadGatewayException(error?.message || "Analytics API error");
    }
  }
}
