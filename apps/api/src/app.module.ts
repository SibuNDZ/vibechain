import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { VideosModule } from "./modules/videos/videos.module";
import { VotingModule } from "./modules/voting/voting.module";
import { CrowdfundingModule } from "./modules/crowdfunding/crowdfunding.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { FollowsModule } from "./modules/follows/follows.module";
import { AiModule } from "./modules/ai/ai.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { UploadModule } from "./modules/upload/upload.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { LoggingMiddleware } from "./common/middleware/logging.middleware";
import { AnalyticsModule } from "./common/analytics/analytics.module";
import { AnalyticsAdminModule } from "./modules/analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: "auth",
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
      {
        name: "ai",
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests per minute
      },
    ]),
    DatabaseModule,
    HealthModule,
    AnalyticsModule,
    AuthModule,
    UsersModule,
    VideosModule,
    VotingModule,
    CrowdfundingModule,
    CommentsModule,
    FollowsModule,
    AiModule,
    MessagesModule,
    UploadModule,
    AnalyticsAdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes("*");
  }
}
