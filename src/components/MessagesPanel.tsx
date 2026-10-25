"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowUp, Check, Package, Search, Sparkles, X, MessageSquare } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, cn } from "@/components/ui";
import { DemoSignIn } from "@/components/auth/DemoSignIn";
import { apiJson, authFetch } from "@/lib/api";
import type { UserRole } from "@/lib/firebase/types";
import { userRole } from "@/lib/roleGuard";
import { ACCOUNT_CHANGED_EVENT, DEVICE_KEYS } from "@/lib/deviceSession";

interface Message {
  role: "user" | "assistant";
  content: string;
  /** Written by HeriTech on someone's behalf (order notices), not typed by them. */
  isSystem?: boolean;
  /** ISO time it was sent; missing for older assistant turns kept in the browser. */
  at?: string;
  /** Shown straight away while the server is still saving it. */
  pending?: boolean;
}

interface Person {
  id: string;
  fullName: string;
  role?: UserRole;
  workshopName: string | null;
  stationName: string | null;
}

export interface ServerMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isSystem?: boolean;
  createdAt: string;
  sender: Person | null;
  receiver: Person | null;
}

interface Thread {
  id: string;
  name: string;
  subtitle: string;
  avatarText?: string;
  isBot?: boolean;
  /** The other person's role, for the label beside their name. */
  role?: UserRole;
  /** The piece the conversation started from, when opened from a product page. */
  topic?: string;
  messages: Message[];
  /** ISO time of the latest message, for ordering the inbox. */
  lastAt?: string;
}

/** Groups the signed-in user's messages into one thread per other person. */
function threadsFromServer(messages: ServerMessage[], myId: string): Thread[] {
  const byPerson = new Map<string, Thread>();
  for (const m of messages) {
    const mine = m.senderId === myId;
    // Automatic notices sent in my name (e.g. "New order…" to the maker) are meant for the other person.
    if (mine && m.isSystem) continue;
    const other = mine ? m.receiver : m.sender;
    const otherId = mine ? m.receiverId : m.senderId;
    const thread = byPerson.get(otherId) ?? {
      id: otherId,
      name: other?.fullName ?? "HeriTech member",
      subtitle: other?.workshopName || other?.stationName || "",
      avatarText: initials(other?.fullName ?? "?"),
      role: other?.role,
      messages: [],
    };
    thread.messages.push({ role: mine ? "user" : "assistant", content: m.content, isSystem: m.isSystem, at: m.createdAt });
    thread.lastAt = m.createdAt;
    byPerson.set(otherId, thread);
  }
  // Most recent conversation first
  return [...byPerson.values()].sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
}

/** Conversations whose latest message is from the other person and newer than this device last read. */
export function countUnreadThreads(messages: ServerMessage[], myId: string): number {
  let seen: Record<string, string> = {};
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY) || "{}") ?? {};
  } catch {
    /* storage blocked: nothing counts as read */
  }
  return threadsFromServer(messages, myId).filter((t) => {
    const last = t.messages[t.messages.length - 1];
    if (last?.role !== "assistant" || !t.lastAt) return false;
    // Before the inbox has ever been opened here, nothing is flagged; after that, a new person counts.
    return Object.keys(seen).length > 0 && (!seen[t.id] || seen[t.id] < t.lastAt);
  }).length;
}

// Only the assistant conversation is kept in the browser; conversations with
// people live in Firestore and are loaded from /api/messages.
const THREADS_STORAGE_KEY = DEVICE_KEYS.assistantThread;
const DRAFTS_STORAGE_KEY = DEVICE_KEYS.drafts;
/** When each conversation was last read here, so new replies show as unread. */
const SEEN_STORAGE_KEY = DEVICE_KEYS.seen;
/** Turns sent with each assistant question, and turns kept in the browser. */
const ASSISTANT_HISTORY_SENT = 12;
const ASSISTANT_HISTORY_KEPT = 50;
/** How often an open panel checks for replies. */
const POLL_MS = 6_000;

const INITIAL_THREADS: Thread[] = [
  {
    id: "bot_assistant",
    name: "HeriTech Assistant",
    subtitle: "Ask anything about materials, maps, or payouts",
    isBot: true,
    messages: [
      {
        role: "assistant",
        content: "Hi, I'm the HeriTech assistant. Ask me about materials, the map or where your money goes.",
      },
    ],
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  buyer: "Buyer",
  artisan: "Artisan",
  lgu: "Local government",
  admin: "HeriTech team",
};

/** A steady colour per person, from the palette, so faces are easy to tell apart. */
const AVATAR_TONES = [
  "bg-pine-100 text-brand",
  "bg-lantern-100 text-lantern-700",
  "bg-impact-100 text-impact",
  "bg-warn-100 text-warn",
];
const toneFor = (id: string) => AVATAR_TONES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_TONES.length];

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** "Demo Artisan C" → "DA"; "Maria" → "MA". */
const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase() || "?";
};

function Avatar({ thread, size = "md" }: { thread: Thread; size?: "md" | "lg" }) {
  const box = size === "lg" ? "w-11 h-11" : "w-12 h-12";
  if (thread.isBot) {
    return (
      <span className={cn(box, "rounded-full shrink-0 bg-[#f6f1e7] flex items-center justify-center")}>
        <Image src="/logo_heritech-removebg-preview.png" alt="" width={32} height={32} className="w-8 h-8 object-contain" />
      </span>
    );
  }
  return (
    <span className={cn(box, "rounded-full shrink-0 font-semibold text-[14px] flex items-center justify-center", toneFor(thread.id))}>
      {thread.avatarText || initials(thread.name)}
    </span>
  );
}

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesPanel({ isOpen, onClose }: MessagesPanelProps) {
  const { translateSync, translateTemplate, formatDate, currentLanguage } = useTranslation();
  const { user, signInWithGoogle } = useAuth();

  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [query, setQuery] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(false);
  const [threadsReload, setThreadsReload] = useState(0);
  // Messages up to this index were already there when the conversation opened; later ones animate in.
  const [baseline, setBaseline] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const firstLoad = useRef(true);
  // The latest threads, for handlers registered once.
  const threadsRef = useRef(threads);
  threadsRef.current = threads;
  // Who is signed in now, so an inbox request made for the previous account is dropped.
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  const time = useCallback(
    (iso: string) => {
      try {
        return new Intl.DateTimeFormat(currentLanguage.code, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
      } catch {
        return new Date(iso).toLocaleTimeString();
      }
    },
    [currentLanguage.code]
  );
  const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(d, now)) return translateSync("Today");
    if (sameDay(d, yesterday)) return translateSync("Yesterday");
    return formatDate(d);
  };
  const inboxTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return sameDay(d, new Date()) ? time(iso) : dayLabel(iso);
  };

  // While open: lock the page behind, move focus into the panel, and give it back on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  // Keep Tab inside the panel while it is open.
  useEffect(() => {
    if (!isOpen) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [isOpen]);

  // Escape steps back: from a conversation to the inbox, then closes.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeThreadId) {
        setActiveThreadId(null);
        setInputMessage("");
        setBotError(null);
      } else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, activeThreadId, onClose]);

  // Load the assistant thread, drafts and read markers from localStorage on mount
  useEffect(() => {
    try {
      const savedAssistant = localStorage.getItem(THREADS_STORAGE_KEY);
      if (savedAssistant) {
        const parsed = JSON.parse(savedAssistant);
        if (parsed?.id === "bot_assistant" && Array.isArray(parsed.messages)) {
          setThreads((prev) => prev.map((t) => (t.id === "bot_assistant" ? { ...t, ...parsed } : t)));
        }
      }
      const savedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts);
        if (parsedDrafts && typeof parsedDrafts === "object") setDrafts(parsedDrafts);
      }
      const savedSeen = localStorage.getItem(SEEN_STORAGE_KEY);
      if (savedSeen) {
        const parsedSeen = JSON.parse(savedSeen);
        if (parsedSeen && typeof parsedSeen === "object") setSeen(parsedSeen);
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
      if (assistant) {
        // Keep the stored conversation short so it never grows without bound.
        const trimmed = { ...assistant, messages: assistant.messages.slice(-ASSISTANT_HISTORY_KEPT) };
        localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(trimmed));
      }
    } catch (err) {
      console.warn("Could not save messages to storage:", err);
    }
  }, [threads, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seen));
    } catch (err) {
      console.warn("Could not save drafts to storage:", err);
    }
  }, [drafts, seen, isLoaded]);

  // Someone else signed in (or out) on this device: none of the last person's conversations stay on screen.
  useEffect(() => {
    const reset = () => {
      setThreads(INITIAL_THREADS);
      setDrafts({});
      setSeen({});
      setActiveThreadId(null);
      setInputMessage("");
      setThreadsLoading(false);
      firstLoad.current = true;
    };
    window.addEventListener(ACCOUNT_CHANGED_EVENT, reset);
    return () => window.removeEventListener(ACCOUNT_CHANGED_EVENT, reset);
  }, []);

  // Conversations with people: loaded when the panel opens, then checked every few seconds
  // so a reply from the other side appears without reloading.
  const loadThreads = useCallback(
    async (silent: boolean) => {
      if (!user) return;
      if (!silent) {
        setThreadsLoading(true);
        setThreadsError(false);
      }
      const result = await apiJson<ServerMessage[]>("/api/messages");
      if (userIdRef.current !== user.id) return;
      if (!silent) setThreadsLoading(false);
      if (!result.success) {
        if (!silent) setThreadsError(true);
        return;
      }
      // A send in progress would briefly vanish if replaced now; the next check picks it up.
      if (sendingRef.current) return;
      const serverThreads = threadsFromServer(result.data ?? [], user.id);
      setThreads((prev) => {
        const assistant = prev.filter((t) => t.id === "bot_assistant");
        const merged = serverThreads.map((s) => {
          const local = prev.find((t) => t.id === s.id);
          return local ? { ...s, topic: local.topic, role: s.role ?? local.role } : s;
        });
        // Keep threads opened from a product page that have no messages yet.
        const pending = prev.filter((t) => t.id !== "bot_assistant" && t.messages.length === 0 && !serverThreads.some((s) => s.id === t.id));
        return [...assistant, ...merged, ...pending];
      });
      // The first time this device loads its inbox, what is already there counts as read.
      if (firstLoad.current) {
        firstLoad.current = false;
        setSeen((prev) => {
          const next = { ...prev };
          for (const t of serverThreads) if (!next[t.id] && t.lastAt) next[t.id] = t.lastAt;
          return next;
        });
      }
    },
    [user]
  );

  useEffect(() => {
    if (!isOpen || !user) return;
    loadThreads(false);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") loadThreads(true);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [isOpen, user, threadsReload, loadThreads]);

  // Listen for open-messages event to open or create specific user/artisan thread
  useEffect(() => {
    const handleOpenMessagesEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.threadId) {
        const threadId = detail.threadId;
        setThreads((prev) => {
          const existing = prev.find((t) => t.id === threadId);
          if (existing) {
            return detail.productTitle ? prev.map((t) => (t.id === threadId ? { ...t, topic: detail.productTitle } : t)) : prev;
          }
          const newThread: Thread = {
            id: threadId,
            name: detail.name || "Artisan Maker",
            subtitle: detail.subtitle || "",
            avatarText: initials(detail.name || "Maker"),
            role: "artisan",
            topic: detail.productTitle,
            messages: [],
          };
          return [...prev, newThread];
        });
        openThread(threadId);
      }
    };
    window.addEventListener("open-messages", handleOpenMessagesEvent);
    return () => window.removeEventListener("open-messages", handleOpenMessagesEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeThread?.messages.length, isBotThinking, activeThreadId]);

  // Reading a conversation marks it read, including replies that arrive while it is open.
  useEffect(() => {
    if (!activeThread?.lastAt) return;
    const id = activeThread.id;
    const at = activeThread.lastAt;
    setSeen((prev) => (prev[id] === at ? prev : { ...prev, [id]: at }));
  }, [activeThread?.id, activeThread?.lastAt]);

  // Grow the box with what is typed, up to about five lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [inputMessage, activeThreadId]);

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

  function openThread(threadId: string) {
    setActiveThreadId(threadId);
    setInputMessage(drafts[threadId] || "");
    setBotError(null);
    setBaseline(threadsRef.current.find((t) => t.id === threadId)?.messages.length ?? 0);
  }

  const handleBackToInbox = () => {
    setActiveThreadId(null);
    setInputMessage("");
    setBotError(null);
  };

  const sendText = async (raw: string) => {
    const userText = raw.trim();
    if (!userText || !activeThreadId) return;
    const currentThreadId = activeThreadId;
    const now = new Date().toISOString();

    setInputMessage("");
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[currentThreadId];
      return next;
    });
    setBotError(null);

    const isBot = currentThreadId === "bot_assistant";
    const history = (activeThread?.messages ?? []).slice(-ASSISTANT_HISTORY_SENT).map((m) => ({ role: m.role, content: m.content }));
    setThreads((prev) =>
      prev.map((t) =>
        t.id === currentThreadId
          ? { ...t, lastAt: now, messages: [...t.messages, { role: "user" as const, content: userText, at: now, pending: !isBot }] }
          : t
      )
    );

    if (isBot) {
      setIsBotThinking(true);
      try {
        // authFetch sends the sign-in token, so the assistant's rate limit is per person.
        const res = await authFetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ message: userText, history }),
        });
        const data = await res.json();
        const reply: string | undefined = data.data?.reply;
        if (data.success && reply) {
          const at = new Date().toISOString();
          setThreads((prev) =>
            prev.map((t) => (t.id === "bot_assistant" ? { ...t, lastAt: at, messages: [...t.messages, { role: "assistant" as const, content: reply, at }] } : t))
          );
        } else {
          setBotError(data.error || "Could not reach HeriTech Assistant. Try again.");
        }
      } catch (err) {
        console.error("Assistant chat error:", err);
        setBotError("Could not reach HeriTech Assistant. Try again.");
      } finally {
        setIsBotThinking(false);
      }
      return;
    }

    // A real message to another HeriTech member; their reply arrives through /api/messages.
    sendingRef.current = true;
    const result = await apiJson("/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId: currentThreadId, content: userText }),
    });
    sendingRef.current = false;
    setThreads((prev) =>
      prev.map((t) =>
        t.id !== currentThreadId
          ? t
          : result.success
            ? { ...t, messages: t.messages.map((m) => (m.pending && m.at === now ? { ...m, pending: false } : m)) }
            : { ...t, messages: t.messages.filter((m) => !(m.pending && m.at === now)) }
      )
    );
    if (!result.success) {
      setInputMessage(userText);
      setBotError(result.error ?? "Your message wasn't sent. Try again.");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendText(inputMessage);
  };

  if (!isOpen) return null;

  const closeAll = () => {
    handleBackToInbox();
    onClose();
  };

  // Replies that fit who is talking to whom; one tap fills the box (or asks the assistant).
  const iAmMaker = userRole(user) === "artisan";
  const quickReplies: string[] = !activeThread
    ? []
    : activeThread.isBot
      ? ["Where does my money go?", "How do I check a pass?", "How is waste collected?"]
      : iAmMaker
        ? ["Thank you for your order!", "It ships within 2 days.", "Happy to tell you how I made it."]
        : [
            activeThread.topic ? `Is the ${activeThread.topic} still available?` : "Is this piece still available?",
            "How long does shipping take?",
            "How did you make it?",
          ];

  const unread = (t: Thread) => {
    if (t.isBot || !t.lastAt) return false;
    const last = t.messages[t.messages.length - 1];
    return last?.role === "assistant" && (!seen[t.id] || seen[t.id] < t.lastAt);
  };

  const q = query.trim().toLowerCase();
  // An artisan comes here for their buyers, so those conversations lead and the assistant goes last.
  const ordered = iAmMaker ? [...threads.filter((t) => !t.isBot), ...threads.filter((t) => t.isBot)] : threads;
  const visible = q
    ? ordered.filter((t) => [t.name, t.subtitle, t.messages[t.messages.length - 1]?.content ?? ""].some((s) => translateSync(s).toLowerCase().includes(q)))
    : ordered;
  const peopleCount = threads.filter((t) => !t.isBot).length;
  const unreadCount = threads.filter(unread).length;

  const msgs = activeThread?.messages ?? [];
  const lastMine = msgs.map((m) => m.role).lastIndexOf("user");

  return (
    <>
      <div onClick={closeAll} className="fixed inset-0 bg-pine-900/40 backdrop-blur-[2px] z-50" aria-hidden="true" />

      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="messages-title"
        className="chat-panel fixed top-0 right-0 h-[100dvh] w-full sm:w-[420px] lg:w-[920px] bg-surface shadow-pop z-50 flex outline-none animate-[drawer-in_0.28s_var(--ease-sheet)]"
      >
        {/* Inbox */}
        <section className={cn("flex flex-col min-h-0 w-full lg:w-[340px] lg:shrink-0 bg-surface lg:bg-paper-2", activeThreadId && "hidden lg:flex")}>
          <div className="pt-[max(1rem,env(safe-area-inset-top,0px))] px-5 pb-3 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 id="messages-title" className="font-display text-[30px] leading-tight font-semibold text-ink">
                  {translateSync(iAmMaker ? "Chats" : "Messages")}
                </h2>
                {iAmMaker && (
                  <p className="text-[14px] text-ink-3">
                    {unreadCount > 0
                      ? translateTemplate("{count} new from buyers", { count: unreadCount })
                      : peopleCount === 1
                        ? translateSync("1 buyer conversation")
                        : translateTemplate("{count} buyer conversations", { count: peopleCount })}
                  </p>
                )}
              </div>
              <button
                onClick={closeAll}
                className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-ink-3 hover:bg-paper-2 lg:hover:bg-surface hover:text-ink cursor-pointer"
                aria-label={translateSync("Close messages")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="mt-3 flex items-center gap-2 h-11 px-3.5 rounded-full bg-paper-2 lg:bg-surface text-ink-3 focus-within:ring-2 focus-within:ring-pine-500">
              <Search className="w-4 h-4 shrink-0" />
              <span className="sr-only">{translateSync("Search conversations")}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={translateSync("Search conversations")}
                className="flex-1 min-w-0 bg-transparent text-[15px] text-ink placeholder:text-ink-3 outline-none"
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            {threadsLoading && threads.length <= 1 && (
              <div className="px-3 py-3 flex items-center gap-3" role="status" aria-label={translateSync("Loading conversations")}>
                <span className="w-12 h-12 rounded-full bg-paper-2 animate-pulse shrink-0" />
                <span className="flex-1 space-y-2">
                  <span className="block h-4 w-1/2 rounded-sm bg-paper-2 animate-pulse" />
                  <span className="block h-3 w-3/4 rounded-sm bg-paper-2 animate-pulse" />
                </span>
              </div>
            )}
            {threadsError && (
              <div className="mx-3 my-2 px-4 py-3 rounded-lg bg-danger-100 flex items-center justify-between gap-3 text-sm" role="alert">
                <span className="text-danger">{translateSync("Couldn't load your conversations.")}</span>
                <button type="button" onClick={() => setThreadsReload((n) => n + 1)} className="h-9 px-3 rounded-full bg-surface text-ink font-medium cursor-pointer">
                  {translateSync("Retry")}
                </button>
              </div>
            )}
            <ul className="space-y-0.5">
              {visible.map((t, i) => {
                const hasDraft = Boolean(drafts[t.id]?.trim());
                const last = t.messages[t.messages.length - 1];
                const isNew = unread(t);
                const active = t.id === activeThreadId;
                return (
                  <li key={t.id} className="chat-thread" style={{ "--i": i } as React.CSSProperties}>
                    <button
                      onClick={() => openThread(t.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "w-full px-3 py-3 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer",
                        active ? "bg-pine-100" : "hover:bg-paper-2 lg:hover:bg-surface"
                      )}
                    >
                      <span className="relative">
                        <Avatar thread={t} />
                        {t.isBot && (
                          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-lantern text-white flex items-center justify-center ring-2 ring-surface">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("text-[16px] text-ink truncate", isNew ? "font-semibold" : "font-medium")}>{translateSync(t.name)}</span>
                          <span className={cn("text-[13px] shrink-0", isNew ? "text-lantern-600 font-medium" : "text-ink-3")}>
                            {t.isBot ? translateSync("Assistant") : inboxTime(t.lastAt)}
                          </span>
                        </span>
                        <span className="flex items-center justify-between gap-2 mt-0.5">
                          <span className={cn("text-[14px] truncate", isNew ? "text-ink" : "text-ink-3")}>
                            {hasDraft ? (
                              <>
                                <span className="text-lantern-600 font-medium">{translateSync("Draft")}: </span>
                                {drafts[t.id]}
                              </>
                            ) : last ? (
                              <>
                                {last.role === "user" && !t.isBot && <span>{translateSync("You")}: </span>}
                                {last.isSystem ? translateSync(last.content) : last.content}
                              </>
                            ) : (
                              translateSync(t.subtitle || "Say hello")
                            )}
                          </span>
                          {isNew && <span className="w-2.5 h-2.5 rounded-full bg-lantern shrink-0" aria-label={translateSync("New message")} />}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {iAmMaker && !q && !threadsLoading && peopleCount === 0 && (
              <div className="chat-hello mx-3 mb-3 rounded-xl bg-paper-2 lg:bg-surface px-4 py-5">
                <p className="text-[16px] font-medium text-ink">{translateSync("No buyer chats yet")}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
                  {translateSync("Buyers can message you from any of your pieces. Their questions and order notes will appear here.")}
                </p>
              </div>
            )}
            {q && visible.length === 0 && <p className="px-4 py-6 text-[15px] text-ink-3">{translateTemplate("No conversations match \"{query}\".", { query })}</p>}
          </div>
        </section>

        {/* Conversation */}
        <section className={cn("flex-1 min-w-0 flex flex-col min-h-0 bg-paper", !activeThreadId && "hidden lg:flex")}>
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
              <span className="chat-empty-mark w-20 h-20 rounded-full bg-pine-100 text-brand flex items-center justify-center">
                <MessageSquare className="w-8 h-8" strokeWidth={1.5} />
              </span>
              <p className="mt-6 font-display text-[28px] leading-tight font-semibold text-ink">{translateSync("Pick a conversation")}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2 max-w-[34ch]">
                {translateSync("Talk with the makers behind each piece, or ask the HeriTech assistant anything.")}
              </p>
            </div>
          ) : (
            <>
              <header className="pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-3 px-3 sm:px-4 bg-surface shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToInbox}
                    className="lg:hidden w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-ink-2 hover:bg-paper-2 hover:text-ink cursor-pointer"
                    aria-label={translateSync("Back to inbox")}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar thread={activeThread} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold text-ink truncate leading-tight">{translateSync(activeThread.name)}</p>
                    <p className="text-[13px] text-ink-3 truncate mt-0.5 flex items-center gap-1.5">
                      {activeThread.isBot ? (
                        <>
                          <span aria-hidden className="w-2 h-2 rounded-full bg-impact" />
                          {translateSync("Powered by Gemini")}
                        </>
                      ) : (
                        [activeThread.role && translateSync(ROLE_LABEL[activeThread.role]), activeThread.subtitle && translateSync(activeThread.subtitle)]
                          .filter(Boolean)
                          .join(" · ")
                      )}
                    </p>
                  </div>
                  <button
                    onClick={closeAll}
                    className="w-11 h-11 -mr-1 rounded-full flex items-center justify-center text-ink-3 hover:bg-paper-2 hover:text-ink cursor-pointer"
                    aria-label={translateSync("Close messages")}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {activeThread.topic && (
                  <p className="mt-3 flex items-center gap-2 rounded-full bg-paper-2 pl-3 pr-4 py-1.5 text-[13px] text-ink-2 w-fit max-w-full">
                    <Package className="w-3.5 h-3.5 shrink-0 text-lantern-600" />
                    <span className="truncate">{translateTemplate("About: {piece}", { piece: translateSync(activeThread.topic) })}</span>
                  </p>
                )}
              </header>

              <div key={activeThread.id} className="chat-scroll flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-5" aria-live="polite">
                {msgs.length === 0 && (
                  <div className="chat-hello mx-auto my-8 max-w-[32ch] flex flex-col items-center text-center">
                    <Avatar thread={activeThread} size="lg" />
                    <p className="mt-3 text-[16px] font-medium text-ink">{translateTemplate("Start a conversation with {name}", { name: translateSync(activeThread.name) })}</p>
                    <p className="mt-1 text-[14px] text-ink-3">{translateSync("Pick a quick question below or write your own.")}</p>
                  </div>
                )}

                {msgs.map((m, idx) => {
                  const prev = msgs[idx - 1];
                  const next = msgs[idx + 1];
                  const newDay = m.at && (!prev?.at || !sameDay(new Date(prev.at), new Date(m.at)));
                  const joinedAbove = prev && prev.role === m.role && !prev.isSystem && !m.isSystem && !newDay;
                  const joinedBelow = next && next.role === m.role && !next.isSystem && !m.isSystem && !(next.at && m.at && !sameDay(new Date(next.at), new Date(m.at)));
                  const mine = m.role === "user";
                  const animate = idx >= baseline;
                  return (
                    <React.Fragment key={`${idx}-${m.at ?? ""}`}>
                      {newDay && m.at && (
                        <p className="my-4 text-center">
                          <span className="inline-block rounded-full bg-paper-2 px-3 py-1 text-[12px] font-medium text-ink-3">{dayLabel(m.at)}</span>
                        </p>
                      )}
                      {m.isSystem ? (
                        <div className={cn("my-4 mx-auto max-w-[88%] rounded-xl bg-lantern-100 px-4 py-3", animate && "chat-in")}>
                          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-lantern-700">
                            <Package className="w-3.5 h-3.5" />
                            {translateSync("Order update")}
                            {m.at && <span className="font-normal text-ink-3">· {time(m.at)}</span>}
                          </p>
                          <p className="mt-1 text-[15px] leading-relaxed text-ink whitespace-pre-wrap">{translateSync(m.content)}</p>
                        </div>
                      ) : (
                        <div className={cn("flex flex-col", mine ? "items-end" : "items-start", joinedAbove ? "mt-1" : "mt-4")}>
                          <div
                            className={cn(
                              "max-w-[82%] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words",
                              mine ? "bg-pine-700 text-white" : "bg-surface text-ink",
                              "rounded-[20px]",
                              mine ? (joinedBelow ? "rounded-br-md" : "rounded-br-sm") : joinedBelow ? "rounded-bl-md" : "rounded-bl-sm",
                              mine && joinedAbove && "rounded-tr-md",
                              !mine && joinedAbove && "rounded-tl-md",
                              m.pending && "opacity-70",
                              animate && (mine ? "chat-in-mine" : "chat-in")
                            )}
                          >
                            {m.content}
                          </div>
                          {!joinedBelow && (m.at || (mine && idx === lastMine)) && (
                            <p className="mt-1 px-1 flex items-center gap-1 text-[12px] text-ink-3">
                              {m.at && time(m.at)}
                              {mine && idx === lastMine && !activeThread.isBot && (
                                m.pending ? (
                                  <span>· {translateSync("Sending…")}</span>
                                ) : (
                                  <span className="chat-sent inline-flex items-center gap-0.5 text-impact">
                                    · <Check className="w-3.5 h-3.5" /> {translateSync("Sent")}
                                  </span>
                                )
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {isBotThinking && (
                  <div className="mt-4 flex items-center gap-2 chat-in">
                    <span className="inline-flex items-center gap-1 rounded-[20px] rounded-bl-sm bg-surface px-4 py-3.5" aria-hidden>
                      <span className="chat-dot w-2 h-2 rounded-full bg-ink-3" />
                      <span className="chat-dot w-2 h-2 rounded-full bg-ink-3 [animation-delay:0.15s]" />
                      <span className="chat-dot w-2 h-2 rounded-full bg-ink-3 [animation-delay:0.3s]" />
                    </span>
                    <span className="text-[13px] text-ink-3">{translateSync("HeriTech is thinking")}</span>
                  </div>
                )}

                {botError && (
                  <div className="mt-4 text-sm text-danger bg-danger-100 rounded-lg px-3.5 py-2.5" role="alert">
                    {translateSync(botError)}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {!user && !activeThread.isBot ? (
                /* Messages to people are sent from an account, so guests sign in here instead of hitting an error */
                <div className="px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-surface space-y-2 shrink-0">
                  <p className="text-sm text-ink-2">{translateSync("Sign in to message this maker.")}</p>
                  <Button size="lg" className="w-full" onClick={signInWithGoogle}>
                    {translateSync("Sign in with Google")}
                  </Button>
                  <DemoSignIn roles={["buyer"]} />
                </div>
              ) : (
                <div className="bg-surface shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                  {!inputMessage.trim() && !isBotThinking && (
                    <div className="chat-quick flex lg:flex-wrap gap-2 overflow-x-auto lg:overflow-visible px-3 sm:px-4 pt-3 pb-1 [scrollbar-width:none]" aria-label={translateSync("Quick replies")}>
                      {quickReplies.map((r, i) => (
                        <button
                          key={r}
                          type="button"
                          style={{ "--i": i } as React.CSSProperties}
                          onClick={() => {
                            if (activeThread.isBot) sendText(translateSync(r));
                            else {
                              handleInputChange(translateSync(r));
                              inputRef.current?.focus();
                            }
                          }}
                          className="chat-chip shrink-0 h-9 px-3.5 rounded-full bg-paper-2 text-[14px] text-ink-2 hover:bg-pine-100 hover:text-ink transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {translateSync(r)}
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="px-3 sm:px-4 pt-2 flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={inputMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        // Enter sends; Shift+Enter starts a new line.
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          sendText(inputMessage);
                        }
                      }}
                      placeholder={activeThread.isBot ? translateSync("Ask about materials, payouts or passes…") : translateSync("Write a message…")}
                      aria-label={translateSync("Message")}
                      className="flex-1 min-h-11 max-h-[132px] resize-none rounded-[22px] bg-paper-2 px-4 py-[11px] text-[15px] leading-[22px] text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-pine-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      data-ready={Boolean(inputMessage.trim())}
                      className="chat-send w-11 h-11 rounded-full bg-lantern hover:bg-lantern-700 disabled:bg-paper-2 disabled:text-ink-3 text-white flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-default"
                      aria-label={translateSync("Send")}
                    >
                      <ArrowUp className="w-5 h-5" strokeWidth={2.25} />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </aside>
    </>
  );
}

export default MessagesPanel;
