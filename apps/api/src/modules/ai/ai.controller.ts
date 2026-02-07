import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { SemanticSearchService } from "./services/semantic-search.service";
import { ChatService } from "./services/chat.service";
import { RecommendationService } from "./services/recommendation.service";
import { EmbeddingService } from "./services/embedding.service";
import { SemanticSearchDto } from "./dto/search.dto";
import { SendMessageDto } from "./dto/chat.dto";
import { RecommendationQueryDto } from "./dto/recommendation.dto";
import { AdminGuard } from "../../common/guards/admin.guard";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  constructor(
    private readonly semanticSearchService: SemanticSearchService,
    private readonly chatService: ChatService,
    private readonly recommendationService: RecommendationService,
    private readonly embeddingService: EmbeddingService
  ) {}

  // ============ Search Endpoints ============

  @Post("search")
  @Throttle({ ai: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Semantic video search" })
  @ApiResponse({ status: 200, description: "Search results returned successfully" })
  async search(@Body() dto: SemanticSearchDto) {
    const results = await this.semanticSearchService.search(
      dto.query,
      dto.limit,
      dto.threshold
    );
    return { data: results };
  }

  // ============ Chat Endpoints ============

  @Post("chat")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @Throttle({ ai: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Send a message to the AI assistant" })
  @ApiResponse({ status: 200, description: "AI response returned" })
  async chat(
    @Body() dto: SendMessageDto,
    @Request() req: { user: { userId: string } }
  ) {
    const response = await this.chatService.sendMessage(
      req.user.userId,
      dto.message,
      dto.conversationId
    );
    return response;
  }

  @Post("chat/stream")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @Throttle({ ai: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Send a message with streaming response" })
  @ApiResponse({ status: 200, description: "Streaming AI response" })
  async chatStream(
    @Body() dto: SendMessageDto,
    @Request() req: { user: { userId: string } },
    @Res() res: Response
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      for await (const chunk of this.chatService.streamMessage(
        req.user.userId,
        dto.message,
        dto.conversationId
      )) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: "error", error: String(error) })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Get("conversations")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's chat conversations" })
  @ApiResponse({ status: 200, description: "Conversations list returned" })
  async getConversations(@Request() req: { user: { userId: string } }) {
    const conversations = await this.chatService.getConversations(req.user.userId);
    return { data: conversations };
  }

  @Get("conversations/:id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a specific conversation" })
  @ApiResponse({ status: 200, description: "Conversation returned" })
  @ApiResponse({ status: 404, description: "Conversation not found" })
  async getConversation(
    @Param("id") id: string,
    @Request() req: { user: { userId: string } }
  ) {
    return this.chatService.getConversation(id, req.user.userId);
  }

  @Delete("conversations/:id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a conversation" })
  @ApiResponse({ status: 200, description: "Conversation deleted" })
  @ApiResponse({ status: 404, description: "Conversation not found" })
  async deleteConversation(
    @Param("id") id: string,
    @Request() req: { user: { userId: string } }
  ) {
    await this.chatService.deleteConversation(id, req.user.userId);
    return { message: "Conversation deleted" };
  }

  // ============ Recommendation Endpoints ============

  @Get("recommendations")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @Throttle({ ai: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Get personalized video recommendations" })
  @ApiResponse({ status: 200, description: "Recommendations returned" })
  async getRecommendations(
    @Query() dto: RecommendationQueryDto,
    @Request() req: { user: { userId: string } }
  ) {
    const recommendations = await this.recommendationService.getRecommendations(
      req.user.userId,
      dto.limit
    );
    return { data: recommendations };
  }

  @Get("recommendations/anonymous")
  @Throttle({ ai: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Get recommendations for non-authenticated users" })
  @ApiResponse({ status: 200, description: "Recommendations returned" })
  async getAnonymousRecommendations(@Query() dto: RecommendationQueryDto) {
    const recommendations = await this.recommendationService.getAnonymousRecommendations(
      dto.limit
    );
    return { data: recommendations };
  }

  @Get("recommendations/similar/:videoId")
  @Throttle({ ai: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Get videos similar to a given video" })
  @ApiResponse({ status: 200, description: "Similar videos returned" })
  async getSimilarVideos(
    @Param("videoId") videoId: string,
    @Query() dto: RecommendationQueryDto
  ) {
    const similar = await this.recommendationService.getSimilarVideos(
      videoId,
      dto.limit
    );
    return { data: similar };
  }

  // ============ Admin Endpoints ============

  @Post("admin/migrate-embeddings")
  @UseGuards(AuthGuard("jwt"), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Migrate existing videos to have embeddings (admin only)" })
  @ApiResponse({ status: 200, description: "Migration completed" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async migrateEmbeddings() {
    const result = await this.embeddingService.migrateExistingVideos();
    return result;
  }
}
