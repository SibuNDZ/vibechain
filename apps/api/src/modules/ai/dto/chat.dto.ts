import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class SendMessageDto {
  @ApiProperty({
    description: "Message content to send to the AI assistant",
    example: "Show me some relaxing music videos",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({
    description: "Conversation ID for continuing an existing conversation",
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
