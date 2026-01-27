import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { VotingService } from "./voting.service";

@ApiTags("voting")
@Controller("voting")
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Post(":videoId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Vote for a video" })
  async vote(
    @Request() req: { user: { userId: string } },
    @Param("videoId") videoId: string
  ) {
    return this.votingService.vote(req.user.userId, videoId);
  }

  @Delete(":videoId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove vote from a video" })
  async removeVote(
    @Request() req: { user: { userId: string } },
    @Param("videoId") videoId: string
  ) {
    return this.votingService.removeVote(req.user.userId, videoId);
  }

  @Get("leaderboard")
  @ApiOperation({ summary: "Get voting leaderboard" })
  async getLeaderboard(@Query("limit") limit?: string) {
    return this.votingService.getLeaderboard(limit ? parseInt(limit) : 10);
  }

  @Get(":videoId/count")
  @ApiOperation({ summary: "Get vote count for a video" })
  async getVoteCount(@Param("videoId") videoId: string) {
    const count = await this.votingService.getVoteCount(videoId);
    return { videoId, count };
  }

  @Get(":videoId/status")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Check if user has voted for a video" })
  async checkVoteStatus(
    @Request() req: { user: { userId: string } },
    @Param("videoId") videoId: string
  ) {
    const hasVoted = await this.votingService.hasVoted(
      req.user.userId,
      videoId
    );
    return { videoId, hasVoted };
  }
}
