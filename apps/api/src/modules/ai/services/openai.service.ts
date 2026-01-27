import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client: OpenAI;
  private readonly embeddingModel: string;
  private readonly chatModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");

    if (!apiKey) {
      this.logger.warn("OPENAI_API_KEY not configured - AI features will be disabled");
    }

    this.client = new OpenAI({
      apiKey: apiKey || "dummy-key",
    });

    this.embeddingModel = this.configService.get<string>(
      "OPENAI_EMBEDDING_MODEL",
      "text-embedding-3-small"
    );
    this.chatModel = this.configService.get<string>("OPENAI_MODEL", "gpt-4");
  }

  isConfigured(): boolean {
    return !!this.configService.get<string>("OPENAI_API_KEY");
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text.slice(0, 8000), // Limit input to avoid token limits
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error}`);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: texts.map((t) => t.slice(0, 8000)),
      });

      return response.data.map((d) => d.embedding);
    } catch (error) {
      this.logger.error(`Failed to generate embeddings: ${error}`);
      throw error;
    }
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.chatModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      this.logger.error(`Failed to generate chat completion: ${error}`);
      throw error;
    }
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: this.chatModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to stream chat completion: ${error}`);
      throw error;
    }
  }
}
