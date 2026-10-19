"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, Send, X } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge, controlClass } from "@/components/ui";
import { apiJson } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ServerMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: { id: string; fullName: string; workshopName: string | null; stationName: string | null } | null;
  receiver: { id: string; fullName: string; workshopName: string | null; stationName: string | null } | null;
}

/** Groups the signed-in user's messages into one thread per other person. */
function threadsFromServer(messages: ServerMessage[], myId: string): Thread[] {
  const byPerson = new Map<string, Thread>();
  for (const m of messages) {
    const mine = m.senderId === myId;
    const other = mine ? m.receiver : m.sender;
    const otherId = mine ? m.receiverId : m.senderId;
    const thread = byPerson.get(otherId) ?? {
      id: otherId,
      name: other?.fullName ?? "HeriTech member",
      subtitle: other?.workshopName || other?.stationName || "",
      avatarText: (other?.fullName ?? "?").slice(0, 2).toUpperCase(),
      messages: [],
    };
    thread.messages.push({ role: mine ? "user" : "assistant", content: m.content });
    thread.time = new Date(m.createdAt).toLocaleDateString();
    byPerson.set(otherId, thread);
  }
  return [...byPerson.values()];
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

// Only the assistant conversation is kept in the browser; conversations with
// people live in Firestore and are loaded from /api/messages.
const THREADS_STORAGE_KEY = "heritech_assistant_thread_v5";
const DRAFTS_STORAGE_KEY = "heritech_chat_drafts_v4";

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
          "Hi, I'm the HeriTech assistant. Ask me about materials, the map or where your money goes.",
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
  const { user } = useAuth();

  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load the assistant thread and drafts from localStorage on mount
  useEffect(() => {
    try {
      const savedAssistant = localStorage.getItem(THREADS_STORAGE_KEY);
      if (savedAssistant) {
        const parsed = JSON.parse(savedAssistant);
        if (parsed?.id === "bot_assistant" && Array.isArray(parsed.messages)) {
          setThreads((prev) => prev.map((t) => (t.id === "bot_assistant" ? parsed : t)));
        }
      }

      const savedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts);
        if (parsedDrafts && typeof parsedDrafts === "object") {
          setDrafts(parsedDrafts);
        }
      }
    } catch (err) {
      console.warn("Could not load stored messages:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist the assistant thread whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const assistant = threads.find((t) => t.id === "bot_assistant");
      if (assistant) localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(assistant));
    } catch (err) {
      console.warn("Could not save messages to storage:", err);
    }
  }, [threads, isLoaded]);

  // Refresh conversations with people each time the panel opens
  useEffect(() => {
    if (!isOpen || !user) return;
    apiJson<ServerMessage[]>("/api/messages").then((result) => {
      if (!result.success) return;
      const serverThreads = threadsFromServer(result.data ?? [], user.id);
      setThreads((prev) => {
        const assistant = prev.filter((t) => t.id === "bot_assistant");
        // Keep threads opened from a product page that have no messages yet.
        const pending = prev.filter((t) => t.id !== "bot_assistant" && t.messages.length === 0 && !serverThreads.some((s) => s.id === t.id));
        return [...assistant, ...serverThreads, ...pending];
      });
    });
  }, [isOpen, user]);

  // Persist drafts to localStorage whenever drafts state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (err) {
      console.warn("Could not save drafts to storage:", err);
    }
  }, [drafts, isLoaded]);

  // Listen for open-messages event to open or create specific user/artisan thread
  useEffect(() => {
    const handleOpenMessagesEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent?.detail;

      if (detail && detail.threadId) {
        const threadId = detail.threadId;
        setThreads((prev) => {
          const exists = prev.some((t) => t.id === threadId);
          if (exists) {
            return prev;
          }
          const newThread: Thread = {
            id: threadId,
            name: detail.name || "Artisan Maker",
            subtitle: detail.subtitle || "",
            avatarText: (detail.name || "M").slice(0, 2).toUpperCase(),
            isBot: false,
            time: "",
            unread: false,
            messages: [],
          };
          return [...prev, newThread];
        });
        setActiveThreadId(threadId);
        setInputMessage(drafts[threadId] || "");
      }
    };

    window.addEventListener("open-messages", handleOpenMessagesEvent);
    return () =>
      window.removeEventListener("open-messages", handleOpenMessagesEvent);
  }, [drafts]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages, isBotThinking]);

  // Handle typing input and sync with drafts map
  const handleInputChange = (text: string) => {
    setInputMessage(text);
    if (activeThreadId) {
      setDrafts((prev) => {
        if (!text.trim()) {
          const next = { ...prev };
          delete next[activeThreadId];
          return next;
        }
        return { ...prev, [activeThreadId]: text };
      });
    }
  };

  // Open conversation from inbox and load any existing draft
  const handleOpenThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setInputMessage(drafts[threadId] || "");
    setBotError(null);
  };

  // Back to inbox: keeps all conversations and drafts permanently
  const handleBackToInbox = () => {
    setActiveThreadId(null);
    setInputMessage("");
    setBotError(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeThreadId) return;

    const userText = inputMessage.trim();
    const currentThreadId = activeThreadId;

    // Clear input and draft for this thread
    setInputMessage("");
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[currentThreadId];
      return next;
    });
    setBotError(null);

    // Append user message
    const updatedThreads = threads.map((t) => {
      if (t.id === currentThreadId) {
        return {
          ...t,
          time: "Just now",
          messages: [...t.messages, { role: "user" as const, content: userText }],
        };
      }
      return t;
    });
    setThreads(updatedThreads);

    if (currentThreadId === "bot_assistant") {
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
        const reply: string | undefined = data.data?.reply;
        if (data.success && reply) {
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id === "bot_assistant") {
                return {
                  ...t,
                  time: "Just now",
                  messages: [
                    ...t.messages,
                    { role: "assistant" as const, content: reply },
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
      // A real message to another HeriTech member; their reply arrives through /api/messages.
      const result = await apiJson("/api/messages", {
        method: "POST",
        body: JSON.stringify({ receiverId: currentThreadId, content: userText }),
      });
      if (!result.success) {
        setThreads(threads);
        setInputMessage(userText);
        setBotError(result.error ?? "Your message wasn't sent. Try again.");
      }
    }
  };

  if (!isOpen) return null;

  const closeAll = () => {
    handleBackToInbox();
    onClose();
  };

  return (
    <>
      <div onClick={closeAll} className="fixed inset-0 bg-pine-900/40 backdrop-blur-[2px] z-50" aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="messages-title"
        className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-surface shadow-pop z-50 flex flex-col"
      >
        <div className="h-16 px-4 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            {activeThreadId && (
              <button
                onClick={handleBackToInbox}
                className="w-10 h-10 -ml-2 rounded-md flex items-center justify-center text-ink-3 hover:bg-paper-2 hover:text-ink cursor-pointer"
                aria-label={translateSync("Back to inbox")}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 id="messages-title" className="font-display text-2xl font-semibold text-ink truncate leading-tight">
                {activeThread ? translateSync(activeThread.name) : translateSync("Messages")}
              </h2>
              {activeThread?.isBot && <p className="text-xs text-ink-3 leading-tight">{translateSync("Powered by Gemini")}</p>}
            </div>
          </div>

          <button
            onClick={closeAll}
            className="w-10 h-10 -mr-2 rounded-md flex items-center justify-center text-ink-3 hover:bg-paper-2 hover:text-ink cursor-pointer"
            aria-label={translateSync("Close messages")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!activeThreadId ? (
          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {threads.map((t) => {
              const hasDraft = Boolean(drafts[t.id]?.trim());
              const last = t.messages[t.messages.length - 1]?.content;

              return (
                <button
                  key={t.id}
                  onClick={() => handleOpenThread(t.id)}
                  className="w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors cursor-pointer hover:bg-pine-50"
                >
                  {t.isBot ? (
                    <div className="w-10 h-10 rounded-full shrink-0 bg-pine-100 flex items-center justify-center">
                      <Image src="/logo_heritech-removebg-preview.png" alt="" width={28} height={28} className="w-7 h-7 object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-paper-2 text-ink-2 font-semibold text-xs flex items-center justify-center shrink-0">
                      {t.avatarText || t.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-sm text-ink truncate ${t.unread ? "font-semibold" : "font-medium"}`}>{translateSync(t.name)}</span>
                        {t.isBot && <Badge tone="pine">AI</Badge>}
                      </div>
                      {t.time && <span className="text-xs text-ink-3 shrink-0">{translateSync(t.time)}</span>}
                    </div>
                    <p className="text-xs text-ink-3 truncate mt-0.5">{translateSync(t.subtitle)}</p>
                    {hasDraft ? (
                      <p className="text-sm truncate mt-1">
                        <span className="text-lantern-600 font-medium">{translateSync("Draft")}: </span>
                        <span className="text-ink-2">{drafts[t.id]}</span>
                      </p>
                    ) : (
                      last && <p className="text-sm text-ink-2 truncate mt-1">{last}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-paper">
              {activeThread?.messages?.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user" ? "bg-pine-700 text-white rounded-br-sm" : "bg-surface border border-line text-ink-2 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isBotThinking && (
                <div className="flex items-center gap-2 text-sm text-ink-3 pl-1">
                  <span className="flex gap-1" aria-hidden>
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce [animation-delay:-0.1s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce" />
                  </span>
                  {activeThread?.isBot
                    ? translateSync("HeriTech is thinking")
                    : `${activeThread?.name || translateSync("Artisan")} ${translateSync("is typing")}`}
                </div>
              )}

              {botError && (
                <div className="text-sm text-danger bg-danger-100 border border-danger/20 rounded-md px-3 py-2" role="alert">
                  {translateSync(botError)}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-line flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={activeThread?.isBot ? translateSync("Ask about materials, payouts or passes…") : translateSync("Write a message…")}
                aria-label={translateSync("Message")}
                className={`${controlClass} h-11 flex-1`}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-11 h-11 rounded-md bg-pine-700 hover:bg-pine-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label={translateSync("Send")}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}

export default MessagesPanel;
