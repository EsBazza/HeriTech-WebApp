"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  User,
  ShieldCheck,
  Palette,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
  Package,
  Heart,
  Scale,
  Leaf,
  MessageSquare,
  Edit3,
  ExternalLink,
  MapPin,
  QrCode,
  Tag,
} from "lucide-react";
import { QRCodeViewer } from "@/components/qr/QRCodeViewer";

export default function ProfilePage() {
  const { user, signInWithGoogle, refreshProfile } = useAuth();

  // Profile Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editWorkshop, setEditWorkshop] = useState("");
  const [editStation, setEditStation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Role Application State
  const [modalType, setModalType] = useState<"artisan" | "lgu" | null>(null);
  const [workshopName, setWorkshopName] = useState("");
  const [craftTypology, setCraftTypology] = useState("Bamboo Joinery & Weaving");
  const [stationName, setStationName] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Profile Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [artisanProducts, setArtisanProducts] = useState<any[]>([]);
  const [lguBatches, setLguBatches] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selected Product Detail Modal (for Artisan)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || "");
      setEditCountry(user.country || "Philippines");
      setEditAvatarUrl(user.avatarUrl || "");
      setEditWorkshop(user.workshopName || "");
      setEditStation(user.stationName || "");

      // Load relevant role data
      async function loadProfileData() {
        try {
          const [prodRes, batchRes] = await Promise.all([
            fetch("/api/products"),
            fetch("/api/materials"),
          ]);
          const prodData = await prodRes.json();
          const batchData = await batchRes.json();

          if (prodData.success) {
            setArtisanProducts(prodData.data);
          }
          if (batchData.success) {
            setLguBatches(batchData.data);
          }
        } catch (e) {
          console.error("Profile data load error:", e);
        } finally {
          setLoadingData(false);
        }
      }
      loadProfileData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-[#1A6B3A]/10 text-[#1A6B3A] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Sign in to Access Your Profile</h2>
        <p className="text-xs text-gray-500">
          Sign in with Google to view your Google Impact Badges, order history, and artisan/LGU tools.
        </p>
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 rounded-xl bg-[#1A6B3A] text-white text-xs font-bold shadow-md hover:bg-[#14532D] transition-all"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          fullName: editFullName,
          country: editCountry,
          avatarUrl: editAvatarUrl || undefined,
          workshopName: editWorkshop || undefined,
          stationName: editStation || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("Profile updated successfully!");
        setEditModalOpen(false);
        await refreshProfile();
      }
    } catch (err) {
      console.error("Profile update failed:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/user/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: modalType,
          workshopName: modalType === "artisan" ? workshopName : undefined,
          craftTypology: modalType === "artisan" ? craftTypology : undefined,
          stationName: modalType === "lgu" ? stationName : undefined,
          country,
          bio,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message);
        setModalType(null);
        await refreshProfile();
      }
    } catch (err) {
      console.error("Application submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Tiered Google Impact Badges Definitions
  const badges = [
    {
      id: "b1",
      title: "Panagbenga Patron",
      tier: "Gold Tier",
      festival: "Panagbenga Flower Festival 🇵🇭",
      description: "Diverted 10+ kg of Baguio floral float armatures and empowered Cordillera weavers.",
      color: "from-amber-400 to-amber-600",
      icon: "🌸",
      unlocked: true,
      earnedDate: "Aug 2026",
    },
    {
      id: "b2",
      title: "Yi Peng Sky Guardian",
      tier: "Silver Tier",
      festival: "Yi Peng Lantern Festival 🇹🇭",
      description: "Intercepted wire-free bamboo frames in Chiang Mai for upcycled luminaries.",
      color: "from-blue-400 to-indigo-600",
      icon: "🏮",
      unlocked: true,
      earnedDate: "Aug 2026",
    },
    {
      id: "b3",
      title: "Nirmalaya River Protector",
      tier: "Bronze Tier",
      festival: "Ganesh Chaturthi Nirmalaya 🇮🇳",
      description: "Prevented temple floral runoff into Ulhas River; converted into natural ink pigments.",
      color: "from-emerald-400 to-teal-600",
      icon: "🪷",
      unlocked: false,
      earnedDate: "Locked (1 purchase required)",
    },
    {
      id: "b4",
      title: "Zero-Waste Circular Pioneer",
      tier: "Platinum Tier",
      festival: "Pan-Asian Milestone",
      description: "Diverted over 25+ kilograms across multiple Asian cultural celebrations.",
      color: "from-purple-400 to-purple-700",
      icon: "🌿",
      unlocked: false,
      earnedDate: "Locked (25 kg milestone)",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* User Header Profile Card */}
      <div className="bg-white rounded-3xl border border-[#E6E2D8] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-20 h-20 rounded-full object-cover border-4 border-[#1A6B3A] shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#1A6B3A] text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black text-gray-900">{user.fullName}</h1>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide border border-emerald-300">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono-data">{user.email}</p>
            <p className="text-xs text-gray-700 font-medium">
              Country: <strong>{user.country || "Philippines"}</strong>
            </p>
            {user.workshopName && (
              <p className="text-xs text-amber-800 font-bold">
                Guild Workshop: {user.workshopName}
              </p>
            )}
            {user.stationName && (
              <p className="text-xs text-blue-800 font-bold">
                Government Station: {user.stationName}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-[#E6E2D8] bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
          >
            <Edit3 className="w-4 h-4 text-gray-500" />
            <span>Edit Profile</span>
          </button>

          <Link
            href="/messages"
            className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>My Messages</span>
          </Link>

          {user.role === "admin" && (
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Hub</span>
            </Link>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. BUYER SECTION: TIERED GOOGLE IMPACT BADGES */}
      {/* ======================================================== */}
      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
              <Award className="w-4 h-4 text-amber-500" />
              <span>AUTHENTICATED GOOGLE IMPACT BADGES</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              Your Cultural & Ecological Patronage Gallery
            </h2>
          </div>
          <span className="text-xs font-mono-data text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
            2 BADGES UNLOCKED
          </span>
        </div>

        {/* Badges Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                badge.unlocked
                  ? "bg-white border-[#E6E2D8] hover:border-amber-400 hover:shadow-md"
                  : "bg-gray-50/60 border-gray-200 opacity-60"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${badge.color} text-white flex items-center justify-center text-2xl shadow-sm`}>
                    {badge.icon}
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase font-mono-data ${
                      badge.unlocked
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {badge.tier}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">{badge.title}</h3>
                  <p className="text-[10px] text-gray-500 font-medium">{badge.festival}</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono-data text-gray-500">
                <span>{badge.earnedDate}</span>
                {badge.unlocked && (
                  <span className="text-emerald-700 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>In Google Wallet</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. ARTISAN SECTION: PRODUCTS LISTED & SOLD DASHBOARD */}
      {/* ======================================================== */}
      {(user.role === "artisan" || user.role === "admin") && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
                <Palette className="w-4 h-4 text-amber-600" />
                <span>ARTISAN GUILD COMMERCE & SALES HUB</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                Your Heritage Goods & 70% Escrow Payouts
              </h2>
            </div>
            <Link
              href="/studio"
              className="px-4 py-2 rounded-xl bg-[#1A6B3A] text-white text-xs font-bold hover:bg-[#14532D] shadow-sm transition-all"
            >
              + List New Piece in Studio
            </Link>
          </div>

          {/* Artisan 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Products Listed</span>
              <p className="text-2xl font-black text-gray-900 font-mono-data">
                {artisanProducts.length}
              </p>
              <span className="text-[11px] text-gray-500 font-medium">In Global Marketplace</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Products Sold</span>
              <p className="text-2xl font-black text-blue-700 font-mono-data">3</p>
              <span className="text-[11px] text-blue-600 font-medium">Verified Orders</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">70% Net Payouts</span>
              <p className="text-2xl font-black text-emerald-700 font-mono-data">$113.40</p>
              <span className="text-[11px] text-emerald-600 font-medium">Direct Guild Payout</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total Diverted</span>
              <p className="text-2xl font-black text-[#1A6B3A] font-mono-data">
                {artisanProducts.reduce((sum, p) => sum + p.kgDiverted, 0).toFixed(1)} kg
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">Salvaged Waste Used</span>
            </div>
          </div>

          {/* Listed Products Gallery */}
          <div className="bg-white rounded-3xl border border-[#E6E2D8] p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">
              Your Listed Artifacts (Click piece to view details)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {artisanProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="p-3 rounded-2xl border border-gray-200 hover:border-[#1A6B3A] hover:shadow-md transition-all cursor-pointer bg-white space-y-2"
                >
                  <img
                    src={product.images[0] || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"}
                    alt={product.title}
                    className="w-full aspect-square rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 truncate">{product.title}</h4>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="font-mono-data font-black text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {product.kgDiverted} kg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 3. LGU OFFICER SECTION: MATERIAL HARVEST & HANDOVER HISTORY */}
      {/* ======================================================== */}
      {(user.role === "lgu" || user.role === "admin") && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-800">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>MUNICIPAL LGU MATERIAL HARVEST & HANDOVER REGISTRY</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                Logged Festival Waste & Physical Custody History
              </h2>
            </div>
            <Link
              href="/scanner"
              className="px-4 py-2 rounded-xl bg-[#1A6B3A] text-white text-xs font-bold hover:bg-[#14532D] shadow-sm transition-all"
            >
              + Scan New Field Waste
            </Link>
          </div>

          {/* LGU Metric Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total Batches Scanned</span>
              <p className="text-2xl font-black text-gray-900 font-mono-data">
                {lguBatches.length}
              </p>
              <span className="text-[11px] text-gray-500 font-medium">Under Step 0 MOUs</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total Tonnage Salvaged</span>
              <p className="text-2xl font-black text-emerald-700 font-mono-data">
                {lguBatches.reduce((acc, b) => acc + b.weightKg, 0).toFixed(1)} kg
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">Diverted from Landfill</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Handover Rate</span>
              <p className="text-2xl font-black text-blue-700 font-mono-data">
                {Math.round(
                  (lguBatches.filter((b) => b.status === "claimed").length / (lguBatches.length || 1)) * 100
                )}%
              </p>
              <span className="text-[11px] text-blue-600 font-medium">Claimed by Artisans</span>
            </div>
          </div>

          {/* Logged Materials & Handover History Table */}
          <div className="bg-white rounded-3xl border border-[#E6E2D8] p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">
              Material Harvest Log & Chain-of-Custody Handover Audit
            </h3>

            <div className="space-y-3">
              {lguBatches.map((batch) => {
                const isClaimed = batch.status === "claimed";
                const isReserved = batch.status === "reserved";

                return (
                  <div
                    key={batch.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-[#F8F6F0] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono-data text-xs font-bold text-gray-900">
                          {batch.id}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            isClaimed
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : isReserved
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {isClaimed
                            ? "CLAIMED & HANDED OVER"
                            : isReserved
                            ? "RESERVED (PENDING HANDOVER)"
                            : "AVAILABLE"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{batch.title}</h4>
                      <p className="text-xs text-gray-600 flex items-center space-x-2">
                        <span>
                          Scale: <strong>{batch.weightKg} kg</strong> ({batch.materialType})
                        </span>
                        <span>•</span>
                        <span>
                          Gemini Vision: <strong>{batch.condition} Grade</strong>
                        </span>
                      </p>
                    </div>

                    {/* Handover & Artisan details */}
                    <div className="text-left md:text-right text-xs space-y-1">
                      {isClaimed ? (
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">
                            Handed Over To
                          </span>
                          <span className="font-bold text-gray-900">
                            {batch.claimedByArtisan?.fullName || "Danilo Cruz"}
                          </span>
                          <p className="text-[10px] text-gray-500">
                            {batch.claimedByArtisan?.workshopName || "Cordillera Botanical Guild"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 font-medium">
                          Awaiting Artisan Reservation & QR Scan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Product Detail Modal (for Artisan Inspection) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#E6E2D8]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Listed Piece Details</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.title}
                className="w-full aspect-video rounded-2xl object-cover"
              />
              <div>
                <h4 className="text-base font-bold text-gray-900">{selectedProduct.title}</h4>
                <p className="text-gray-600 mt-1">{selectedProduct.description}</p>
              </div>

              <div className="p-3 bg-[#F8F6F0] rounded-xl space-y-1.5 font-mono-data">
                <div className="flex justify-between">
                  <span className="text-gray-500">Retail Price:</span>
                  <span className="font-bold text-gray-900">${selectedProduct.price.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Your 70% Payout per sale:</span>
                  <span className="font-bold text-blue-700">${(selectedProduct.price * 0.7).toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Source Harvest Batch:</span>
                  <span className="font-bold text-emerald-800">{selectedProduct.sourceBatchId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#E6E2D8]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Profile & Guild Info</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Display Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Country</label>
                <input
                  type="text"
                  required
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Profile Photo URL</label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900"
                />
              </div>

              {user.role === "artisan" && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Artisan Workshop / Guild Name</label>
                  <input
                    type="text"
                    value={editWorkshop}
                    onChange={(e) => setEditWorkshop(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900 font-semibold"
                  />
                </div>
              )}

              {user.role === "lgu" && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">LGU Station / Office Name</label>
                  <input
                    type="text"
                    value={editStation}
                    onChange={(e) => setEditStation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900 font-semibold"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-[#1A6B3A] text-white font-bold hover:bg-[#14532D]"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
