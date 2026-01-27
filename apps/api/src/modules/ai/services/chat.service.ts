import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { OpenAiService, ChatMessage as OpenAiMessage } from "./openai.service";
import { SemanticSearchService, SearchResult } from "./semantic-search.service";

export interface ChatMessageResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  videos: SearchResult[];
  createdAt: Date;
}

export interface ConversationResponse {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessageResponse[];
}

export interface StreamChunk {
  type: "content" | "videos" | "done";
  content?: string;
  videos?: SearchResult[];
  messageId?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  private readonly systemPrompt = `You are VibeChain's AI assistant, helping users discover music videos on the platform.

Your role:
- Help users find music videos based on their mood, preferences, or specific requests
- Recommend trending or popular videos
- Answer questions about artists and their content on the platform
- Be enthusiastic about music while remaining helpful and concise

Guidelines:
- When recommending videos, describe them briefly but engagingly
- If users ask about something unrelated to music or the platform, politely redirect them
- Keep responses concise but informative
- Be friendly and conversational

Available context about videos will be provided in the conversation. Use this to make relevant recommendations.`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAiService: OpenAiService,
    private readonly semanticSearchService: SemanticSearchService
  ) {}

  async createConversation(userId: string): Promise<ConversationResponse> {
    const conversation = await this.prisma.chatConversation.create({
      data: {
        userId,
      },
      include: {
        messages: true,
      },
    });

    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: [],
    };
  }

  async getConversations(userId: string): Promise<ConversationResponse[]> {
    const conversations = await this.prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1, // Just get first message for preview
        },
      },
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        videos: [],
        createdAt: m.createdAt,
      })),
    }));
  }

  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<ConversationResponse> {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    // Fetch videos referenced in messages
    const allVideoIds = conversation.messages.flatMap((m) => m.videoIds);
    const videos =
      allVideoIds.length > 0
        ? await this.prisma.video.findMany({
            where: { id: { in: allVideoIds } },
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true },
              },
              _count: {
                select: { votes: true },
              },
            },
          })
        : [];

    const videoMap = new Map(videos.map((v) => [v.id, v]));

    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        videos: m.videoIds
          .map((id) => videoMap.get(id))
          .filter(Boolean)
          .map((v) => ({ ...v!, similarity: 1 })) as SearchResult[],
        createdAt: m.createdAt,
      })),
    };
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    await this.prisma.chatConversation.delete({
      where: { id: conversationId },
    });
  }

  async sendMessage(
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<ChatMessageResponse> {
    // Create or get conversation
    let conversation;
    if (conversationId) {
      conversation = await this.prisma.chatConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!conversation) {
        throw new NotFoundException("Conversation not found");
      }
    } else {
      conversation = await this.prisma.chatConversation.create({
        data: {
          userId,
          title: message.slice(0, 50),
        },
        include: { messages: true },
      });
    }

    // Save user message
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
        videoIds: [],
      },
    });

    // Find relevant videos using semantic search
    const relevantVideos = await this.semanticSearchService.search(message, 5, 0.3);

    // Build conversation history for context
    const history: OpenAiMessage[] = [
      { role: "system", content: this.systemPrompt },
    ];

    // Add previous messages (last 10 for context)
    const recentMessages = conversation.messages.slice(-10);
    for (const msg of recentMessages) {
      history.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // Add video context if found
    if (relevantVideos.length > 0) {
      const videoContext = relevantVideos
        .map(
          (v) =>
            `- "${v.title}" by ${v.user.username} (${v._count.votes} votes)`
        )
        .join("\n");

      history.push({
        role: "system",
        content: `Here are some relevant videos from our platform that might help answer the user's question:\n${videoContext}`,
      });
    }

    // Add current user message
    history.push({ role: "user", content: message });

    // Generate AI response
    const aiResponse = await this.openAiService.chatCompletion(history);

    // Save assistant message with video references
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse,
        videoIds: relevantVideos.map((v) => v.id),
      },
    });

    // Update conversation timestamp
    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      id: assistantMessage.id,
      role: "assistant",
      content: aiResponse,
      videos: relevantVideos,
      createdAt: assistantMessage.createdAt,
    };
  }

  async *streamMessage(
    userId: string,
    message: string,
    conversationId?: string
  ): AsyncGenerator<StreamChunk> {
    // Create or get conversation
    let conversation;
    if (conversationId) {
      conversation = await this.prisma.chatConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!conversation) {
        throw new NotFoundException("Conversation not found");
      }
    } else {
      conversation = await this.prisma.chatConversation.create({
        data: {
          userId,
          title: message.slice(0, 50),
        },
        include: { messages: true },
      });
    }

    // Save user message
    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
        videoIds: [],
      },
    });

    // Find relevant videos
    const relevantVideos = await this.semanticSearchService.search(message, 5, 0.3);

    // Yield videos first so UI can display them
    if (relevantVideos.length > 0) {
      yield { type: "videos", videos: relevantVideos };
    }

    // Build conversation history
    const history: OpenAiMessage[] = [
      { role: "system", content: this.systemPrompt },
    ];

    const recentMessages = conversation.messages.slice(-10);
    for (const msg of recentMessages) {
      history.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    if (relevantVideos.length > 0) {
      const videoContext = relevantVideos
        .map(
          (v) =>
            `- "${v.title}" by ${v.user.username} (${v._count.votes} votes)`
        )
        .join("\n");

      history.push({
        role: "system",
        content: `Here are some relevant videos from our platform:\n${videoContext}`,
      });
    }

    history.push({ role: "user", content: message });

    // Stream AI response
    let fullContent = "";
    for await (const chunk of this.openAiService.streamChatCompletion(history)) {
      fullContent += chunk;
      yield { type: "content", content: chunk };
    }

    // Save assistant message
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: fullContent,
        videoIds: relevantVideos.map((v) => v.id),
      },
    });

    // Update conversation
    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    yield { type: "done", messageId: assistantMessage.id };
  }
}
