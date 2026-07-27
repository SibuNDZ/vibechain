import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { TagsService } from "./tags.service";

@ApiTags("tags")
@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get("trending")
  @ApiOperation({ summary: "Get trending tags from the last 7 days" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getTrending(@Query("limit") limit?: string) {
    return this.tagsService.getTrending(limit ? parseInt(limit, 10) : 10);
  }

  @Get(":name/videos")
  @ApiOperation({ summary: "Get videos for a tag" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getVideosByTag(
    @Param("name") name: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.tagsService.getVideosByTag(
      name,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }
}
