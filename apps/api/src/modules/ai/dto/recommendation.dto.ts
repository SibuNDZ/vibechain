import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class RecommendationQueryDto {
  @ApiPropertyOptional({
    description: "Maximum number of recommendations to return",
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
