import { Module } from "@nestjs/common";
import { VideosController } from "./videos.controller";
import { VideosService } from "./videos.service";
import { UploadModule } from "../upload/upload.module";
import { AdminGuard } from "../../common/guards/admin.guard";

@Module({
  imports: [UploadModule],
  controllers: [VideosController],
  providers: [VideosService, AdminGuard],
  exports: [VideosService],
})
export class VideosModule {}
