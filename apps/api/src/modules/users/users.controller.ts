import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    @Body() body: { username?: string; bio?: string; avatarUrl?: string }
  ) {
    return this.usersService.update(req.user.userId, body);
  }
}
