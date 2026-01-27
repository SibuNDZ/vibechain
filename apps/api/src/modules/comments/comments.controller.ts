import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { CommentsService } from "./comments.service";
import { CreateCommentDto, UpdateCommentDto } from "./dto/comment.dto";

@ApiTags("comments")
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post("videos/:videoId/comments")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a comment on a video" })
  @ApiResponse({ status: 201, description: "Comment created successfully" })
  @ApiResponse({ status: 404, description: "Video not found" })
  create(
    @Param("videoId") videoId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: { sub: string } }
  ) {
    return this.commentsService.create(req.user.sub, videoId, dto);
  }

  @Get("videos/:videoId/comments")
  @ApiOperation({ summary: "Get comments for a video" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Comments retrieved successfully" })
  findByVideo(
    @Param("videoId") videoId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.commentsService.findByVideo(
      videoId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Get("comments/:commentId/replies")
  @ApiOperation({ summary: "Get replies for a comment" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Replies retrieved successfully" })
  findReplies(
    @Param("commentId") commentId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.commentsService.findReplies(
      commentId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Patch("comments/:commentId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a comment" })
  @ApiResponse({ status: 200, description: "Comment updated successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Comment not found" })
  update(
    @Param("commentId") commentId: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: { user: { sub: string } }
  ) {
    return this.commentsService.update(commentId, req.user.sub, dto);
  }

  @Delete("comments/:commentId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a comment" })
  @ApiResponse({ status: 200, description: "Comment deleted successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Comment not found" })
  delete(
    @Param("commentId") commentId: string,
    @Request() req: { user: { sub: string } }
  ) {
    return this.commentsService.delete(commentId, req.user.sub);
  }
}
