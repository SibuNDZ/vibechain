import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("search")
  @ApiOperation({ summary: "Search users by username" })
  @ApiQuery({ name: "q", required: true, description: "Search query" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async searchUsers(
    @Query("q") query: string,
    @Query("limit") limit?: string
  ) {
    return this.usersService.searchByUsername(query, parseInt(limit || "10", 10));
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  async getMe(@Request() req: { user: { userId: string } }) {
    return this.usersService.findById(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  async getUser(@Param("id") id: string) {
    return this.usersService.getProfile(id);
  }

  @Patch("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  async updateMe(
    @Request() req: { user: { userId: string } },
    @Body() body: UpdateProfileDto
  ) {
    return this.usersService.update(req.user.userId, body);
  }
}
