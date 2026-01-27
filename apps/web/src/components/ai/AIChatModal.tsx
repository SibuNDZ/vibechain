"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { X, Send, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { api, AIChatMessage, SearchResult, StreamChunk } from "@/lib/api";
import { ChatMessage } from "./ChatMessage";

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "Show me trending videos",
  "Find relaxing music",
  "Recommend upbeat dance videos",
  "What's popular this week?",
];

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingVideos, setStreamingVideos] = useState<SearchResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setStreamingContent("");
    setStreamingVideos([]);

    // Add user message immediately
    const newUserMessage: AIChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Use streaming endpoint
      let fullContent = "";
      let videos: SearchResult[] = [];

      for await (const chunk of api.stream("/ai/chat/stream", {
        message: userMessage,
        conversationId,
      })) {
        // Parse SSE data
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: StreamChunk = JSON.parse(line.slice(6));

              if (data.type === "content" && data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              } else if (data.type === "videos" && data.videos) {
                videos = data.videos;
                setStreamingVideos(videos);
              } else if (data.type === "done") {
                // Add completed message
                const assistantMessage: AIChatMessage = {
                  id: data.messageId || `msg-${Date.now()}`,
                  role: "assistant",
                  content: fullContent,
                  videos,
                  createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");
                setStreamingVideos([]);

                // Extract conversation ID from first response
                if (!conversationId && data.messageId) {
                  // The conversationId should be returned, but for now we'll use a workaround
                }
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat failed:", error);
      // Fallback to non-streaming
      try {
        const response = await api.post<AIChatMessage>("/ai/chat", {
          message: userMessage,
          conversationId,
        });
        setMessages((prev) => [...prev, response]);
      } catch (fallbackError) {
        console.error("Fallback chat also failed:", fallbackError);
        const errorMessage: AIChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 w-full sm:w-[480px] h-[600px] sm:h-[700px] sm:max-h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">VibeChain AI</h2>
              <p className="text-xs text-gray-400">Your music video assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                How can I help you today?
              </h3>
              <p className="text-gray-400 text-sm mb-6 max-w-[280px]">
                Ask me about music videos, get recommendations, or discover new artists.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <ChatMessage
                  message={{
                    id: "streaming",
                    role: "assistant",
                    content: streamingContent,
                    videos: streamingVideos,
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming
                />
              )}

              {/* Loading indicator */}
              {isLoading && !streamingContent && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-gray-800 bg-gray-900"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about music videos..."
              disabled={isLoading}
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
