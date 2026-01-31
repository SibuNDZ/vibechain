import {
  Controller,
  Get,
  Post,
  Delete,
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
import { FollowsService } from "./follows.service";

@ApiTags("follows")
@Controller()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post("users/:userId/follow")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Follow a user" })
  @ApiResponse({ status: 201, description: "Successfully followed user" })
  @ApiResponse({ status: 400, description: "Cannot follow yourself" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 409, description: "Already following" })
  follow(
    @Param("userId") userId: string,
    @Request() req: { user: { userId: string } }
  ) {
    return this.followsService.follow(req.user.userId, userId);
  }

  @Delete("users/:userId/follow")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unfollow a user" })
  @ApiResponse({ status: 200, description: "Successfully unfollowed user" })
  @ApiResponse({ status: 404, description: "Not following this user" })
  unfollow(
    @Param("userId") userId: string,
    @Request() req: { user: { userId: string } }
  ) {
    return this.followsService.unfollow(req.user.userId, userId);
  }

  @Get("users/:userId/followers")
  @ApiOperation({ summary: "Get user followers" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Followers retrieved successfully" })
  getFollowers(
    @Param("userId") userId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.followsService.getFollowers(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Get("users/:userId/following")
  @ApiOperation({ summary: "Get users that this user follows" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Following list retrieved successfully" })
  getFollowing(
    @Param("userId") userId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.followsService.getFollowing(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Get("users/:userId/follow-status")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Check if current user follows another user" })
  @ApiResponse({ status: 200, description: "Follow status retrieved" })
  checkFollowStatus(
    @Param("userId") userId: string,
    @Request() req: { user: { userId: string } }
  ) {
    return this.followsService.isFollowing(req.user.userId, userId);
  }

  @Get("users/:userId/follow-counts")
  @ApiOperation({ summary: "Get follower and following counts" })
  @ApiResponse({ status: 200, description: "Counts retrieved successfully" })
  getFollowCounts(@Param("userId") userId: string) {
    return this.followsService.getFollowCounts(userId);
  }
}
