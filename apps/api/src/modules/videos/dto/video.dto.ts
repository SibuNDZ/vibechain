import { IsString, IsOptional, IsInt, Min, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { VideoGenre } from "@prisma/client";

export class CreateVideoDto {
  @ApiProperty({ description: "Video title" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: "Video description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Video URL (Cloudinary secure_url or external URL)" })
  @IsString()
  videoUrl: string;

  @ApiPropertyOptional({ description: "Thumbnail URL" })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ description: "Video duration in seconds" })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ description: "Cloudinary public_id for the video" })
  @IsString()
  @IsOptional()
  cloudinaryPublicId?: string;

  @ApiPropertyOptional({ description: "Video genre", enum: VideoGenre })
  @IsEnum(VideoGenre)
  @IsOptional()
  genre?: VideoGenre;
}

export class UpdateVideoDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: VideoGenre })
  @IsEnum(VideoGenre)
  @IsOptional()
  genre?: VideoGenre;
}
