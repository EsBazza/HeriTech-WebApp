"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "@/contexts/TranslationContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Thread {
  id: string;
  name: string;
  subtitle: string;
  avatarText?: string;
  isBot?: boolean;
  messages: Message[];
  unread?: boolean;
  time?: string;
}

const INITIAL_THREADS: Thread[] = [
  {
    id: "bot_assistant",
    name: "HeriTech Assistant",
    subtitle: "Ask anything about materials, maps, or payouts",
    isBot: true,
    time: "Now",
    unread: false,
    messages: [
      {
        role: "assistant",
        content:
          "Welcome to HeriTech. I can answer questions about how material salvage works, our harvest map, escrow payouts, and artisan cooperative onboarding.",
      },
    ],
  },
  {
    id: "thread_danilo",
    name: "Danilo Cruz",
    subtitle: "Cordillera Botanical Cooperative",
    avatarText: "DC",
    time: "2h ago",
    unread: false,
    messages: [
      {
        role: "assistant",
        content:
          "The highland strawflower and bamboo batch from Baguio has been dried and categorized.",
      },
    ],
  },
  {
    id: "thread_somchai",
    name: "Somchai Prasert",
    subtitle: "Lanna Heritage Joinery",
    avatarText: "SP",
    time: "Yesterday",
    unread: false,
    messages: [
      {
        role: "assistant",
        content:
          "We received the mulberry paper lantern batch and are preparing the split bamboo frames.",
      },
    ],
  },
];

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesPanel({ isOpen, onClose }: MessagesPanelProps) {
  const { translateSync } = useTranslation();
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages, isBotThinking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeThreadId) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    setBotError(null);

    // Append user message
    const updatedThreads = threads.map((t) => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: [...t.messages, { role: "user" as const, content: userText }],
        };
      }
      return t;
    });
    setThreads(updatedThreads);

    if (activeThreadId === "bot_assistant") {
      setIsBotThinking(true);
      try {
        const history =
          activeThread?.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })) || [];

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history,
          }),
        });

        const data = await res.json();
        if (data.success && data.reply) {
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id === "bot_assistant") {
                return {
                  ...t,
                  messages: [
                    ...t.messages,
                    { role: "assistant" as const, content: data.reply },
                  ],
                };
              }
              return t;
            })
          );
        } else {
          setBotError(
            data.error || "Could not reach HeriTech Assistant. Try again."
          );
        }
      } catch (err) {
        console.error("Assistant chat error:", err);
        setBotError("Could not reach HeriTech Assistant. Try again.");
      } finally {
        setIsBotThinking(false);
      }
    } else {
      // Mock peer artisan response
      setTimeout(() => {
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === activeThreadId) {
              return {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    role: "assistant" as const,
                    content:
                      "Thank you for your message. Our cooperative workshop will review and coordinate the craft handover.",
                  },
                ],
              };
            }
            return t;
          })
        );
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-y-0 right-0 w-full sm:w-[360px] bg-[#FAF7F2] border-l border-[rgba(125,90,60,0.15)] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
    >
      {/* Top Header Bar */}
      <div className="h-16 px-4 border-b border-[rgba(125,90,60,0.12)] flex items-center justify-between bg-[#FAF7F2] shrink-0">
        <div className="flex items-center space-x-2.5">
          {activeThreadId && (
            <button
              onClick={() => setActiveThreadId(null)}
              className="p-1 -ml-1 text-[#3D2B1F] hover:text-[#7D5A3C] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Back to conversations"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <h2 className="font-display text-xl font-semibold text-[#2E1E12]">
            {activeThread ? activeThread.name : translateSync("Messages")}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-[#3D2B1F] hover:text-[#7D5A3C] transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close messages panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      {!activeThreadId ? (
        /* Conversation List View */
        <div className="flex-1 overflow-y-auto divide-y divide-[rgba(125,90,60,0.08)]">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveThreadId(t.id)}
              className={`w-full p-4 flex items-start space-x-3 text-left transition-colors cursor-pointer hover:bg-[rgba(125,90,60,0.04)] ${
                t.unread ? "bg-[rgba(125,90,60,0.06)] font-semibold" : ""
              } ${t.isBot ? "bg-[rgba(200,169,106,0.06)]" : ""}`}
            >
              {t.isBot ? (
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[rgba(125,90,60,0.2)] bg-[#3D2B1F] flex items-center justify-center">
                  <Image
                    src="/logo heritech.png"
                    alt="Bot"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-[rgba(125,90,60,0.12)] text-[#7D5A3C] font-bold text-xs flex items-center justify-center shrink-0">
                  {t.avatarText || t.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="font-semibold text-sm text-[#2E1E12] truncate">
                      {t.name}
                    </span>
                    {t.isBot && (
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-[#3D2B1F] text-[#EDE0C4] px-1.5 py-0.5 rounded-[1px]">
                        AI
                      </span>
                    )}
                  </div>
                  {t.time && (
                    <span className="text-[10px] text-[rgba(92,74,56,0.6)] shrink-0 ml-2">
                      {t.time}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[rgba(92,74,56,0.8)] truncate mt-0.5">
                  {t.subtitle}
                </p>

                {t.messages.length > 0 && (
                  <p className="text-xs text-[rgba(92,74,56,0.7)] truncate mt-1">
                    {t.messages[t.messages.length - 1].content}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Conversation Thread View */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeThread?.messages?.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-[4px] text-[13px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-[rgba(200,169,106,0.2)] border border-[rgba(200,169,106,0.3)] text-[#2E1E12]"
                      : "bg-[rgba(125,90,60,0.06)] border border-[rgba(125,90,60,0.1)] text-[#3D2B1F]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Chatbot Thinking State */}
            {isBotThinking && (
              <div className="text-xs italic text-[rgba(92,74,56,0.65)] pl-1 py-1">
                {translateSync("HeriTech is thinking")}
              </div>
            )}

            {/* Chatbot Error State */}
            {botError && (
              <div className="text-xs text-red-600 pl-1 py-1">
                {translateSync(botError)}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Message Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-[rgba(125,90,60,0.12)] flex items-center space-x-2 bg-[#FAF7F2] shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={translateSync("Type a message...")}
              className="flex-1 px-3 py-2 text-xs bg-white border border-[rgba(125,90,60,0.2)] rounded-[2px] text-[#2E1E12] placeholder-[rgba(92,74,56,0.5)] focus:outline-none focus:border-[#7D5A3C] min-h-[40px]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-3.5 py-2 bg-[#3D2B1F] hover:bg-[#5A3F2A] disabled:opacity-50 text-[#EDE0C4] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer min-h-[40px]"
            >
              {translateSync("Send")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default MessagesPanel;
