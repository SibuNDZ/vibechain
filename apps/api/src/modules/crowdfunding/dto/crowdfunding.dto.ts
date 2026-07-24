import { IsString, IsNumber, IsDateString, IsOptional, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCampaignDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  goalAmount: number;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  programAddress?: string;
}

export class RecordContributionDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: "Solana transaction signature (base58)" })
  @IsString()
  txSignature: string;
}
