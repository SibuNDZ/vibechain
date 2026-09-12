import { Module } from "@nestjs/common";
import { VideosController } from "./videos.controller";
import { VideosService } from "./videos.service";
import { UploadModule } from "../upload/upload.module";
import { AdminGuard } from "../../common/guards/admin.guard";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";

@Module({
  imports: [UploadModule],
  controllers: [VideosController],
  providers: [VideosService, AdminGuard, OptionalJwtAuthGuard],
  exports: [VideosService],
})
export class VideosModule {}
