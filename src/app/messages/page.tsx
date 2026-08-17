"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  HeartHandshake,
  ShieldCheck,
  Palette,
  Camera,
} from "lucide-react";

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  contextType?: string;
  contextId?: string;
  isSystem: boolean;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    workshopName?: string;
    stationName?: string;
  };
  receiver: {
    id: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    workshopName?: string;
    stationName?: string;
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const currentUserId = user?.id || "usr_art_05";

  // Load messages
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${currentUserId}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setMessages(data.data);
        if (!selectedPartnerId) {
          // Select first partner
          const first = data.data[0];
          const partnerId = first.senderId === currentUserId ? first.receiverId : first.senderId;
          setSelectedPartnerId(partnerId);
        }
      } else {
        // Mock sample conversations for immediate demonstration
        const sampleMessages: MessageItem[] = [
          {
            id: "msg_01",
            senderId: "usr_lgu_04",
            receiverId: currentUserId,
            content: "📍 Engr. Maria Santos (CEPMO Baguio) confirmed your reservation for Batch #HT-2026-0102 (Baguio Bamboo Float Frames). Please arrive at Depot A for QR verification.",
            contextType: "batch_reservation",
            contextId: "HT-2026-0102",
            isSystem: true,
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            sender: { id: "usr_lgu_04", fullName: "Engr. Maria Santos", role: "lgu", stationName: "Baguio CEPMO" },
            receiver: { id: currentUserId, fullName: user?.fullName || "Danilo Cruz", role: "artisan", workshopName: "Cordillera Guild" },
          },
          {
            id: "msg_02",
            senderId: currentUserId,
            receiverId: "usr_lgu_04",
            content: "Hello Engr. Santos! I'll be arriving tomorrow at 10:00 AM with our guild truck to scan the QR token.",
            contextType: "batch_reservation",
            contextId: "HT-2026-0102",
            isSystem: false,
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
            sender: { id: currentUserId, fullName: user?.fullName || "Danilo Cruz", role: "artisan" },
            receiver: { id: "usr_lgu_04", fullName: "Engr. Maria Santos", role: "lgu", stationName: "Baguio CEPMO" },
          },
          {
            id: "msg_03",
            senderId: "usr_buyer_03",
            receiverId: currentUserId,
            content: "🎉 Order #HT-ORD-519 completed for 'Cordillera Botanical Loom Wall Tapestry'! 70% direct escrow payout ($31.50) sent to your guild. Thank you for diverting 1.5 kg of festival waste!",
            contextType: "order",
            contextId: "HT-ORD-519",
            isSystem: true,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            sender: { id: "usr_buyer_03", fullName: "Bea Alonzo", role: "buyer" },
            receiver: { id: currentUserId, fullName: user?.fullName || "Danilo Cruz", role: "artisan" },
          },
          {
            id: "msg_04",
            senderId: currentUserId,
            receiverId: "usr_buyer_03",
            content: "Maraming salamat Bea! We have hand-woven your tapestry using natural marigold dyes from Baguio. Shipping out tomorrow morning via express courier!",
            contextType: "order",
            contextId: "HT-ORD-519",
            isSystem: false,
            createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
            sender: { id: currentUserId, fullName: user?.fullName || "Danilo Cruz", role: "artisan" },
            receiver: { id: "usr_buyer_03", fullName: "Bea Alonzo", role: "buyer" },
          },
        ];
        setMessages(sampleMessages);
        setSelectedPartnerId("usr_buyer_03");
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentUserId]);

  // Extract unique conversation partners
  const partnersMap = new Map<string, { partner: any; lastMsg: MessageItem }>();
  messages.forEach((msg) => {
    const isSender = msg.senderId === currentUserId;
    const partner = isSender ? msg.receiver : msg.sender;
    if (partner?.id) {
      partnersMap.set(partner.id, { partner, lastMsg: msg });
    }
  });

  const partners = Array.from(partnersMap.values());
  const activeConversation = messages.filter(
    (m) =>
      (m.senderId === currentUserId && m.receiverId === selectedPartnerId) ||
      (m.senderId === selectedPartnerId && m.receiverId === currentUserId)
  );

  const selectedPartner = partnersMap.get(selectedPartnerId || "")?.partner;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedPartnerId) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: selectedPartnerId,
          content: replyText.trim(),
          contextType: "general",
          isSystem: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setReplyText("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>THREADED IN-APP COMMUNICATION HUB</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
          HeriTech Messages & Circular Coordination
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Direct communication channels connecting <strong>Buyers ↔ Artisans</strong> (for thank-you notes & shipping updates) and <strong>Artisans ↔ LGU Officers</strong> (for harvest depot pickup scheduling).
        </p>
      </div>

      {/* Split Inbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl border border-[#E6E2D8] overflow-hidden shadow-sm min-h-[600px]">
        {/* Left Column: Conversation Channels (4 cols) */}
        <div className="lg:col-span-4 border-r border-[#E6E2D8] p-4 space-y-3 overflow-y-auto max-h-[650px]">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Conversations ({partners.length})
            </span>
          </div>

          <div className="space-y-2">
            {partners.map(({ partner, lastMsg }) => {
              const isSelected = selectedPartnerId === partner.id;
              const isLgu = partner.role === "lgu";
              const isArtisan = partner.role === "artisan";

              return (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartnerId(partner.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-[#F8F6F0] border-[#1A6B3A] shadow-xs"
                      : "bg-white border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isLgu
                            ? "bg-blue-100 text-blue-800"
                            : isArtisan
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isLgu ? <Camera className="w-4 h-4" /> : isArtisan ? <Palette className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {partner.fullName}
                        </h4>
                        <span className="text-[10px] text-gray-500 truncate block">
                          {partner.workshopName || partner.stationName || "Heritage Patron"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isLgu
                          ? "bg-blue-50 text-blue-700"
                          : isArtisan
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {partner.role}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-2 truncate font-medium">
                    {lastMsg.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Pane (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6">
          {selectedPartner ? (
            <>
              {/* Partner Top Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A6B3A] text-white flex items-center justify-center font-bold text-sm">
                    {selectedPartner.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{selectedPartner.fullName}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedPartner.workshopName || selectedPartner.stationName || "Verified Heritage Buyer"}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono-data text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
                  ENCRYPTED AUDIT THREAD
                </span>
              </div>

              {/* Message History Stream */}
              <div className="flex-1 py-6 space-y-4 overflow-y-auto max-h-[460px] pr-2">
                {activeConversation.map((msg) => {
                  const isMe = msg.senderId === currentUserId;

                  if (msg.isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-1 my-3 shadow-xs"
                      >
                        <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>HeriTech Automated Milestone Event</span>
                        </div>
                        <p className="text-emerald-900 leading-relaxed font-medium">
                          {msg.content}
                        </p>
                        <span className="text-[10px] text-emerald-700 font-mono-data block pt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-[#1A6B3A] text-white rounded-br-xs"
                            : "bg-[#F8F6F0] text-gray-900 border border-[#E6E2D8] rounded-bl-xs"
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono-data mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="pt-4 border-t border-gray-100 flex items-center space-x-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Send a message to ${selectedPartner.fullName}...`}
                  className="flex-1 p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1A6B3A]"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-5 py-3 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8 space-y-2">
              <MessageSquare className="w-10 h-10 text-gray-300" />
              <p className="text-xs font-semibold">Select a conversation from the left to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
