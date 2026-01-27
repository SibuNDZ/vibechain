import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { VideosService } from "./videos.service";
import { CreateVideoDto, UpdateVideoDto } from "./dto/video.dto";

@ApiTags("videos")
@Controller("videos")
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upload a new video" })
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateVideoDto
  ) {
    return this.videosService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all videos with pagination" })
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sortBy") sortBy?: string
  ) {
    return this.videosService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      sortBy
    );
  }

  @Get("top")
  @ApiOperation({ summary: "Get top voted videos" })
  async getTop(@Query("limit") limit?: string) {
    return this.videosService.getTopVideos(limit ? parseInt(limit) : 10);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get video by ID" })
  async findOne(@Param("id") id: string) {
    return this.videosService.findById(id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update video" })
  async update(
    @Param("id") id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateVideoDto
  ) {
    return this.videosService.update(id, req.user.userId, dto);
  }
}
