"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

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
      {
        role: "user",
        content: "Thank you Danilo, looking forward to the loom wall tapestry.",
      },
      {
        role: "assistant",
        content: "We will ship the batch once the municipal handover QR is confirmed.",
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
          "Recovered split bamboo frames from Chiang Mai lantern celebrations are now stored in Depot 02.",
      },
    ],
  },
  {
    id: "thread_aarav",
    name: "Aarav Sharma",
    subtitle: "Nirmalaya Bio-Craft Collective",
    avatarText: "AS",
    time: "2d ago",
    unread: false,
    messages: [
      {
        role: "assistant",
        content:
          "Temple Nirmalaya marigold pigment pans have been milled to 200 mesh archival grade.",
      },
    ],
  },
];

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesPanel({ isOpen, onClose }: MessagesPanelProps) {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isLoadingBot, setIsLoadingBot] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages, isLoadingBot]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeThreadId) return;

    const text = inputText.trim();
    setInputText("");
    setBotError(null);

    const updatedUserMessages: Message[] = [
      ...(activeThread?.messages || []),
      { role: "user", content: text },
    ];

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId ? { ...t, messages: updatedUserMessages } : t
      )
    );

    if (activeThread?.isBot) {
      setIsLoadingBot(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedUserMessages }),
        });

        if (!res.ok) throw new Error("Server error");
        const data = await res.json();

        if (data.reply) {
          setThreads((prev) =>
            prev.map((t) =>
              t.id === activeThreadId
                ? {
                    ...t,
                    messages: [
                      ...updatedUserMessages,
                      { role: "assistant", content: data.reply },
                    ],
                  }
                : t
            )
          );
        } else {
          setBotError("Could not reach HeriTech Assistant. Try again.");
        }
      } catch (err) {
        console.warn("Chatbot request failed:", err);
        setBotError("Could not reach HeriTech Assistant. Try again.");
      } finally {
        setIsLoadingBot(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
            {activeThread ? activeThread.name : "Messages"}
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
                    alt="HeriTech Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#7D5A3C] text-[#EDE0C4] flex items-center justify-center font-bold text-xs shrink-0">
                  {t.avatarText || t.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#2E1E12] truncate">
                    {t.name}
                  </span>
                  {t.time && (
                    <span className="text-[11px] text-[rgba(92,74,56,0.6)] shrink-0 ml-2">
                      {t.time}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5C4A38] truncate mt-0.5">
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

            {isLoadingBot && (
              <div className="text-xs text-[rgba(92,74,56,0.7)] italic py-1">
                HeriTech is thinking
              </div>
            )}

            {botError && (
              <div className="text-xs text-red-700 py-1">{botError}</div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Row */}
          <div className="p-3 border-t border-[rgba(125,90,60,0.12)] bg-[#FAF7F2] flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2.5 bg-white border border-[rgba(125,90,60,0.2)] rounded-[2px] text-sm text-[#2E1E12] placeholder-[rgba(92,74,56,0.5)] focus:outline-none focus:border-[#7D5A3C] min-h-[44px]"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoadingBot}
              className="px-4 py-2.5 bg-[#3D2B1F] text-[#EDE0C4] text-xs uppercase tracking-wider font-bold rounded-[2px] hover:bg-[#5A3F2A] disabled:opacity-50 transition-colors cursor-pointer min-h-[44px]"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPanel;
