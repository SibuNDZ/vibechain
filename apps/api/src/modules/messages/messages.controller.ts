import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto, StartConversationDto } from './dto/create-message.dto';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiResponse({ status: 200, description: 'Conversations list returned' })
  async getConversations(@Request() req: { user: { userId: string } }) {
    const conversations = await this.messagesService.getConversations(
      req.user.userId,
    );
    return { data: conversations };
  }

  @Get('conversations/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific conversation with messages' })
  @ApiResponse({ status: 200, description: 'Conversation returned' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.messagesService.getConversation(id, req.user.userId);
  }

  @Post('conversations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new conversation or get existing one' })
  @ApiResponse({ status: 201, description: 'Conversation started' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async startConversation(
    @Body() dto: StartConversationDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.messagesService.startConversation(
      req.user.userId,
      dto.userId,
      dto.message,
    );
  }

  @Post('conversations/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: CreateMessageDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.messagesService.sendMessage(
      conversationId,
      req.user.userId,
      dto.content,
    );
  }

  @Get('unread')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count returned' })
  async getUnreadCount(@Request() req: { user: { userId: string } }) {
    return this.messagesService.getUnreadCount(req.user.userId);
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get or create conversation with a user' })
  @ApiResponse({ status: 200, description: 'Conversation ID returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getOrCreateConversation(
    @Param('userId') otherUserId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.messagesService.getOrCreateConversation(
      req.user.userId,
      otherUserId,
    );
  }
}
