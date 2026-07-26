import { ArrayNotEmpty, IsArray, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class MarkNotificationsReadDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
