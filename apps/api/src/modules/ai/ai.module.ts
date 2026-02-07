import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../../database/database.module";
import { AiController } from "./ai.controller";
import { OpenAiService } from "./services/openai.service";
import { EmbeddingService } from "./services/embedding.service";
import { SemanticSearchService } from "./services/semantic-search.service";
import { ChatService } from "./services/chat.service";
import { RecommendationService } from "./services/recommendation.service";
import { AdminGuard } from "../../common/guards/admin.guard";

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [AiController],
  providers: [
    OpenAiService,
    EmbeddingService,
    SemanticSearchService,
    ChatService,
    RecommendationService,
    AdminGuard,
  ],
  exports: [EmbeddingService, SemanticSearchService, RecommendationService],
})
export class AiModule {}
