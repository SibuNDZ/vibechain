import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.directConversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, username: true, avatarUrl: true },
        },
        user2: {
          select: { id: true, username: true, avatarUrl: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform to show the "other" user
    return conversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0] || null;
      const unreadCount = conv.messages.filter(
        (m) => !m.read && m.senderId !== userId,
      ).length;

      return {
        id: conv.id,
        otherUser,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isOwn: lastMessage.senderId === userId,
            }
          : null,
        unreadCount,
        updatedAt: conv.updatedAt,
      };
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.directConversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, username: true, avatarUrl: true },
        },
        user2: {
          select: { id: true, username: true, avatarUrl: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Mark messages as read
    await this.prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });

    const otherUser =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    return {
      id: conversation.id,
      otherUser,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        sender: m.sender,
        isOwn: m.senderId === userId,
      })),
    };
  }

  async getOrCreateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot message yourself');
    }

    // Check if other user exists
    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, username: true, avatarUrl: true },
    });

    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    // Ensure consistent ordering of user IDs
    const [user1Id, user2Id] =
      userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

    // Find existing or create new conversation
    let conversation = await this.prisma.directConversation.findUnique({
      where: {
        user1Id_user2Id: { user1Id, user2Id },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.directConversation.create({
        data: { user1Id, user2Id },
      });
    }

    return {
      id: conversation.id,
      otherUser,
    };
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    // Verify user is part of conversation
    const conversation = await this.prisma.directConversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: senderId }, { user2Id: senderId }],
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Create message and update conversation
    const [message] = await this.prisma.$transaction([
      this.prisma.directMessage.create({
        data: {
          content,
          senderId,
          conversationId,
        },
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.directConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: message.sender,
      isOwn: true,
    };
  }

  async startConversation(
    userId: string,
    otherUserId: string,
    initialMessage: string,
  ) {
    const { id: conversationId, otherUser } = await this.getOrCreateConversation(
      userId,
      otherUserId,
    );

    const message = await this.sendMessage(conversationId, userId, initialMessage);

    return {
      conversationId,
      otherUser,
      message,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.directMessage.count({
      where: {
        conversation: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        senderId: { not: userId },
        read: false,
      },
    });

    return { unreadCount: count };
  }
}
