import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { UploadService } from "./upload.service";

@ApiTags("upload")
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get("signature")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get Cloudinary upload signature",
    description: "Generate a signed upload signature for direct browser uploads to Cloudinary",
  })
  getSignature(@Query("folder") folder?: string) {
    return this.uploadService.generateUploadSignature(folder || "videos");
  }

  @Get("thumbnail-url")
  @ApiOperation({
    summary: "Generate thumbnail URL for a video",
    description: "Get a thumbnail URL for a Cloudinary video public_id",
  })
  getThumbnailUrl(
    @Query("publicId") publicId: string,
    @Query("width") width?: string,
    @Query("height") height?: string,
    @Query("timestamp") timestamp?: string
  ) {
    return {
      url: this.uploadService.getThumbnailUrl(publicId, {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        timestamp: timestamp ? parseFloat(timestamp) : undefined,
      }),
    };
  }
}
