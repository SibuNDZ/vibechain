import { useState, useCallback } from "react";
import { api, AIChatMessage, ChatConversation, StreamChunk, SearchResult } from "@/lib/api";

export function useAIChat() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string): Promise<AIChatMessage | null> => {
      if (!content.trim() || isLoading) return null;

      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage: AIChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await api.post<AIChatMessage>("/ai/chat", {
          message: content.trim(),
          conversationId,
        });

        setMessages((prev) => [...prev, response]);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);

        // Add error message
        const errorMsg: AIChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading]
  );

  const sendMessageWithStream = useCallback(
    async (
      content: string,
      onChunk?: (chunk: StreamChunk) => void
    ): Promise<AIChatMessage | null> => {
      if (!content.trim() || isLoading) return null;

      setIsLoading(true);
      setIsStreaming(true);
      setError(null);

      // Add user message immediately
      const userMessage: AIChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      let fullContent = "";
      let videos: SearchResult[] = [];
      let messageId = "";

      try {
        for await (const chunk of api.stream("/ai/chat/stream", {
          message: content.trim(),
          conversationId,
        })) {
          // Parse SSE data
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data: StreamChunk = JSON.parse(line.slice(6));
                onChunk?.(data);

                if (data.type === "content" && data.content) {
                  fullContent += data.content;
                } else if (data.type === "videos" && data.videos) {
                  videos = data.videos;
                } else if (data.type === "done" && data.messageId) {
                  messageId = data.messageId;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        const assistantMessage: AIChatMessage = {
          id: messageId || `msg-${Date.now()}`,
          role: "assistant",
          content: fullContent,
          videos,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        return assistantMessage;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [conversationId, isLoading]
  );

  const loadConversations = useCallback(async (): Promise<ChatConversation[]> => {
    try {
      const response = await api.get<{ data: ChatConversation[] }>("/ai/conversations");
      return response.data;
    } catch {
      return [];
    }
  }, []);

  const loadConversation = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await api.get<ChatConversation>(`/ai/conversations/${id}`);
      setMessages(response.messages);
      setConversationId(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load conversation";
      setError(errorMessage);
    }
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const deleteConversation = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await api.delete(`/ai/conversations/${id}`);
        if (conversationId === id) {
          clearConversation();
        }
        return true;
      } catch {
        return false;
      }
    },
    [conversationId, clearConversation]
  );

  return {
    messages,
    conversationId,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    sendMessageWithStream,
    loadConversations,
    loadConversation,
    clearConversation,
    deleteConversation,
  };
}
