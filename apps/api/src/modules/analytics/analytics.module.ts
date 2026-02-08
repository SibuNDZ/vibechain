import { Module } from "@nestjs/common";
import { AdminAnalyticsController } from "./admin-analytics.controller";

@Module({
  controllers: [AdminAnalyticsController],
})
export class AnalyticsAdminModule {}
