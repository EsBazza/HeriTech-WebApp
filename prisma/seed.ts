import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Clearing existing data from PostgreSQL / Supabase...");
  await prisma.walletPass.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.materialBatch.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.user.deleteMany();

  console.log("👥 Seeding Users (LGU Officers, Artisans, Buyers)...");
  
  // 1. LGU Officers
  const lguChiangMai = await prisma.user.create({
    data: {
      id: "usr_lgu_01",
      email: "somchai@chiangmai.gov.th",
      role: "lgu",
      fullName: "Somchai Jaidee",
      country: "Thailand",
      stationName: "Chiang Mai Municipal Waste Operations",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const lguThane = await prisma.user.create({
    data: {
      id: "usr_lgu_02",
      email: "r.patil@thanecity.gov.in",
      role: "lgu",
      fullName: "Rajesh Patil",
      country: "India",
      stationName: "Thane Municipal Nirmalaya Collection Cell",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const lguPingxi = await prisma.user.create({
    data: {
      id: "usr_lgu_03",
      email: "wl.chen@ntpc.gov.tw",
      role: "lgu",
      fullName: "Chen Wei-Lun",
      country: "Taiwan",
      stationName: "New Taipei Pingxi Clean Recovery Bureau",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const lguBaguio = await prisma.user.create({
    data: {
      id: "usr_lgu_04",
      email: "maria.santos@baguio.gov.ph",
      role: "lgu",
      fullName: "Engr. Maria Santos",
      country: "Philippines",
      stationName: "Baguio City Environment & Parks Management (CEPMO)",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 2. Artisans
  const artApinya = await prisma.user.create({
    data: {
      id: "usr_art_01",
      email: "apinya@lannacrafts.th",
      role: "artisan",
      fullName: "Apinya Prasert",
      country: "Thailand",
      workshopName: "Lanna Bamboo & Paper Guild",
      artisanVerified: true,
      stripeAccountId: "acct_th_lanna_01",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const artPriya = await prisma.user.create({
    data: {
      id: "usr_art_02",
      email: "priya@sacredbotanicals.in",
      role: "artisan",
      fullName: "Priya Sharma",
      country: "India",
      workshopName: "Vedic Nirmalaya Inks & Natural Dyes",
      artisanVerified: true,
      stripeAccountId: "acct_in_vedic_02",
      avatarUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
    },
  });

  const artMeiLing = await prisma.user.create({
    data: {
      id: "usr_art_03",
      email: "meiling@pingxipaper.tw",
      role: "artisan",
      fullName: "Lin Mei-Ling",
      country: "Taiwan",
      workshopName: "Pingxi Heritage Paper Studio",
      artisanVerified: true,
      stripeAccountId: "acct_tw_paper_03",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  });

  const artWayan = await prisma.user.create({
    data: {
      id: "usr_art_04",
      email: "wayan@balispirits.id",
      role: "artisan",
      fullName: "Wayan Sudarta",
      country: "Indonesia",
      workshopName: "Sanur Kite Weave Workshop",
      artisanVerified: true,
      stripeAccountId: "acct_id_bali_04",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const artDanilo = await prisma.user.create({
    data: {
      id: "usr_art_05",
      email: "danilo@cordilleracrafts.ph",
      role: "artisan",
      fullName: "Danilo Cruz",
      country: "Philippines",
      workshopName: "Cordillera Botanical Loom & Bamboo Guild",
      artisanVerified: true,
      stripeAccountId: "acct_ph_cordillera_05",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Buyers
  const buySarah = await prisma.user.create({
    data: {
      id: "usr_buy_01",
      email: "sarah.j@singapore.sg",
      role: "buyer",
      fullName: "Sarah Jenkins",
      country: "Singapore",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  const buyKenji = await prisma.user.create({
    data: {
      id: "usr_buy_02",
      email: "kenji.sato@tokyo.jp",
      role: "buyer",
      fullName: "Kenji Sato",
      country: "Japan",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const buyBea = await prisma.user.create({
    data: {
      id: "usr_buy_03",
      email: "bea.alonzo@manila.ph",
      role: "buyer",
      fullName: "Bea Alonzo",
      country: "Philippines",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("📜 Seeding Step 0 Municipal Agreements (Consent Quotas)...");

  await prisma.agreement.createMany({
    data: [
      {
        id: "RA-2026-001",
        title: "Chiang Mai Yi Peng Lantern Waste Salvage MOU",
        organizerName: "Chiang Mai Municipality & TAT",
        festival: "Yi Peng Lantern Festival",
        country: "Thailand",
        allocatedKg: 2500.0,
        collectedKg: 842.5,
        status: "active",
        signedAt: new Date("2026-07-15T09:00:00Z"),
      },
      {
        id: "RA-2026-002",
        title: "Thane Nirmalaya Floral Diversion Protocol",
        organizerName: "Thane Municipal Corporation",
        festival: "Ganesh Chaturthi",
        country: "India",
        allocatedKg: 5000.0,
        collectedKg: 2140.0,
        status: "active",
        signedAt: new Date("2026-07-20T10:30:00Z"),
      },
      {
        id: "RA-2026-003",
        title: "Pingxi Lantern Paper Recovery Charter",
        organizerName: "New Taipei City Tourism Dept",
        festival: "Pingxi Sky Lantern Festival",
        country: "Taiwan",
        allocatedKg: 1200.0,
        collectedKg: 410.0,
        status: "active",
        signedAt: new Date("2026-08-01T14:00:00Z"),
      },
      {
        id: "RA-2026-004",
        title: "Sanur Beach Kite Remnant Protocol",
        organizerName: "Bali Kite Association (Pelangi)",
        festival: "Bali Kite Festival",
        country: "Indonesia",
        allocatedKg: 800.0,
        collectedKg: 220.0,
        status: "active",
        signedAt: new Date("2026-08-05T11:00:00Z"),
      },
      {
        id: "RA-2026-005",
        title: "Panagbenga Float Framework & Floral Salvage MOU",
        organizerName: "Baguio Flower Festival Foundation (BFFFI) & Baguio LGU",
        festival: "Panagbenga Flower Festival",
        country: "Philippines",
        allocatedKg: 3000.0,
        collectedKg: 1120.0,
        status: "active",
        signedAt: new Date("2026-08-08T08:30:00Z"),
      },
    ],
  });

  console.log("📦 Seeding Material Batches (AI Classification & Harvest Telemetry)...");

  await prisma.materialBatch.create({
    data: {
      id: "HT-2026-0101",
      title: "Yi Peng Intact Bamboo Struts & Hoops",
      materialType: "Bamboo",
      weightKg: 48.5,
      condition: "Excellent",
      status: "claimed",
      gpsLat: 18.7904,
      gpsLng: 98.9877,
      imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80",
      agreementId: "RA-2026-001",
      scannedByOfficerId: lguChiangMai.id,
      reservedByArtisanId: artApinya.id,
      claimedByArtisanId: artApinya.id,
      txHash: "a4f89d31b67c4238e55e2d83b784a9c6784ef3c92134e6a0d2f441098b1e4c77",
      aiInferredMaterial: "Treated Phyllostachys Bamboo Frames",
      aiInferredCondition: "Excellent / Structural",
      aiConfidence: 0.96,
    },
  });

  await prisma.materialBatch.create({
    data: {
      id: "HT-2026-0102",
      title: "Yi Peng Unburnt Rice Paper Shells",
      materialType: "Rice Paper",
      weightKg: 22.0,
      condition: "Good",
      status: "reserved",
      gpsLat: 18.7915,
      gpsLng: 98.9892,
      imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80",
      agreementId: "RA-2026-001",
      scannedByOfficerId: lguChiangMai.id,
      reservedByArtisanId: artApinya.id,
      txHash: "7b8f9e223d6a14c45b8812c9834a78bc098ef321d54e6a0123f441098b1e9988",
      aiInferredMaterial: "Mulberry & Rice Fibers",
      aiInferredCondition: "Good / Re-pulpable",
      aiConfidence: 0.91,
    },
  });

  await prisma.materialBatch.create({
    data: {
      id: "HT-2026-0201",
      title: "Ganesh Chaturthi Marigold & Rose Nirmalaya",
      materialType: "Botanical Flora",
      weightKg: 115.0,
      condition: "Excellent",
      status: "claimed",
      gpsLat: 19.1972,
      gpsLng: 72.9645,
      imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80",
      agreementId: "RA-2026-002",
      scannedByOfficerId: lguThane.id,
      reservedByArtisanId: artPriya.id,
      claimedByArtisanId: artPriya.id,
      txHash: "c89a0b12fe34d89a77123bc654e89fab98213456789abc01234def56789a1234",
      aiInferredMaterial: "Tagetes (Marigold) + Rosa Petals",
      aiInferredCondition: "Excellent / High Pigment Density",
      aiConfidence: 0.98,
    },
  });

  await prisma.materialBatch.create({
    data: {
      id: "HT-2026-0301",
      title: "Pingxi Colored Mulberry Lantern Paper",
      materialType: "Rice Paper",
      weightKg: 35.2,
      condition: "Good",
      status: "available",
      gpsLat: 25.0258,
      gpsLng: 121.7388,
      imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
      agreementId: "RA-2026-003",
      scannedByOfficerId: lguPingxi.id,
      txHash: "f123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      aiInferredMaterial: "Mulberry Lantern Paper",
      aiInferredCondition: "Good / Dry",
      aiConfidence: 0.94,
    },
  });

  await prisma.materialBatch.create({
    data: {
      id: "HT-2026-0501",
      title: "Panagbenga Grand Float Structural Bamboo & Everlasting Blooms",
      materialType: "Bamboo & Botanical Flora",
      weightKg: 64.0,
      condition: "Excellent",
      status: "claimed",
      gpsLat: 16.4023,
      gpsLng: 120.5960,
      imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80",
      agreementId: "RA-2026-005",
      scannedByOfficerId: lguBaguio.id,
      reservedByArtisanId: artDanilo.id,
      claimedByArtisanId: artDanilo.id,
      txHash: "e93ab7201c389bf44310d52a7810cbef1023a9d8214b7e80ac32f190ab78112e",
      aiInferredMaterial: "Cured Bolo Bamboo Scaffolds & Strawflower Bundles",
      aiInferredCondition: "Excellent / Structural & Dry",
      aiConfidence: 0.97,
    },
  });

  await prisma.materialBatch.create({
    data: {
      id: "HT-2026-0502",
      title: "Burnham Park Post-Parade Abaca & Raffia Float Ties",
      materialType: "Textiles & Natural Fiber",
      weightKg: 28.5,
      condition: "Good",
      status: "available",
      gpsLat: 16.4111,
      gpsLng: 120.5932,
      imageUrl: "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?w=800&auto=format&fit=crop&q=80",
      agreementId: "RA-2026-005",
      scannedByOfficerId: lguBaguio.id,
      txHash: "3a78bc9021defa67123456789abcdef0123456789abcdef0123456789abcdef0",
      aiInferredMaterial: "Braided Abaca & Benguet Pine Trims",
      aiInferredCondition: "Good / Reusable Fiber",
      aiConfidence: 0.93,
    },
  });

  console.log("🎨 Seeding Upcycled Products...");

  const prodLamp = await prisma.product.create({
    data: {
      id: "prod_01",
      title: "Lanna Luminary Minimalist Desk Lamp",
      description: "Crafted from recovered Yi Peng bamboo struts and translucent unburnt lantern paper. Features hand-bent structural joints and soft warm illumination.",
      price: 65.00,
      images: JSON.stringify(["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80"]),
      artisanId: artApinya.id,
      sourceBatchId: "HT-2026-0101",
      materialTags: JSON.stringify(["Bamboo", "Rice Paper", "Heritage Upcycle"]),
      stock: 5,
      kgDiverted: 1.40,
      ngoFundName: "Chiang Mai Clean Air & River Trust",
    },
  });

  const prodPaints = await prisma.product.create({
    data: {
      id: "prod_02",
      title: "Sacred Nirmalaya Botanical Watercolor Pan Set (12 Colors)",
      description: "Hand-extracted organic pigments from temple marigold and rose offerings collected during Ganesh Chaturthi. Non-toxic, archival grade.",
      price: 42.00,
      images: JSON.stringify(["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80"]),
      artisanId: artPriya.id,
      sourceBatchId: "HT-2026-0201",
      materialTags: JSON.stringify(["Botanical Flora", "Organic Pigment", "Artisan Chemistry"]),
      stock: 12,
      kgDiverted: 2.80,
      ngoFundName: "Clean Ganga & Masunda Lake Trust",
    },
  });

  const prodJournal = await prisma.product.create({
    data: {
      id: "prod_03",
      title: "Pingxi Heritage Hand-Bound Accordion Journal",
      description: "Bound using recycled colored lantern parchment with bamboo edge bindings. Contains 80 deckle-edged recycled paper pages.",
      price: 38.00,
      images: JSON.stringify(["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80"]),
      artisanId: artMeiLing.id,
      sourceBatchId: "HT-2026-0301",
      materialTags: JSON.stringify(["Mulberry Paper", "Bookbinding"]),
      stock: 8,
      kgDiverted: 0.95,
      ngoFundName: "Taiwan Mountain Trail Conservation Fund",
    },
  });

  const prodWallHanging = await prisma.product.create({
    data: {
      id: "prod_04",
      title: "Cordillera Heritage Botanical Loom Wall Hanging",
      description: "Hand-loomed by Cordillera master weavers incorporating salvaged Panagbenga structural bamboo frames and naturally dried Benguet everlasting florals.",
      price: 55.00,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800&auto=format&fit=crop&q=80"]),
      artisanId: artDanilo.id,
      sourceBatchId: "HT-2026-0501",
      materialTags: JSON.stringify(["Bolo Bamboo", "Everlasting Florals", "Cordillera Weave"]),
      stock: 6,
      kgDiverted: 1.75,
      ngoFundName: "Cordillera Ancestral Forest & Watershed Trust",
    },
  });

  console.log("💳 Seeding Orders & 70/20/10 Escrow Splits...");

  // Order 1: Lamp ($65 -> 45.50 / 13.00 / 6.50)
  const ord1 = await prisma.order.create({
    data: {
      id: "ord_1001",
      productId: prodLamp.id,
      buyerId: buySarah.id,
      amountPaid: 65.00,
      artisanPayout: 45.50,
      platformFee: 13.00,
      ngoContribution: 6.50,
      stripePaymentIntentId: "pi_mock_yipeng_01",
      status: "completed",
    },
  });

  // Order 2: Paints ($42 -> 29.40 / 8.40 / 4.20)
  const ord2 = await prisma.order.create({
    data: {
      id: "ord_1002",
      productId: prodPaints.id,
      buyerId: buyKenji.id,
      amountPaid: 42.00,
      artisanPayout: 29.40,
      platformFee: 8.40,
      ngoContribution: 4.20,
      stripePaymentIntentId: "pi_mock_thane_02",
      status: "completed",
    },
  });

  // Order 3: Philippine Wall Hanging ($55 -> 38.50 / 11.00 / 5.50)
  const ord3 = await prisma.order.create({
    data: {
      id: "ord_1003",
      productId: prodWallHanging.id,
      buyerId: buyBea.id,
      amountPaid: 55.00,
      artisanPayout: 38.50,
      platformFee: 11.00,
      ngoContribution: 5.50,
      stripePaymentIntentId: "pi_mock_baguio_03",
      status: "completed",
    },
  });

  console.log("🎫 Minting Verifiable Google Wallet Impact Passes...");

  await prisma.walletPass.create({
    data: {
      id: "pass_01",
      orderId: ord1.id,
      serial: "HT-492-AX",
      googleWalletObjectId: "3388000000022114455.HT_492_AX",
      qrPayload: "https://heritech.io/verify/HT-492-AX",
      harvestHash: "a4f89d31b67c4238e55e2d83b784a9c6784ef3c92134e6a0d2f441098b1e4c77",
    },
  });

  await prisma.walletPass.create({
    data: {
      id: "pass_02",
      orderId: ord2.id,
      serial: "HT-781-BK",
      googleWalletObjectId: "3388000000022114455.HT_781_BK",
      qrPayload: "https://heritech.io/verify/HT-781-BK",
      harvestHash: "c89a0b12fe34d89a77123bc654e89fab98213456789abc01234def56789a1234",
    },
  });

  await prisma.walletPass.create({
    data: {
      id: "pass_03",
      orderId: ord3.id,
      serial: "HT-519-PH",
      googleWalletObjectId: "3388000000022114455.HT_519_PH",
      qrPayload: "https://heritech.io/verify/HT-519-PH",
      harvestHash: "e93ab7201c389bf44310d52a7810cbef1023a9d8214b7e80ac32f190ab78112e",
    },
  });

  console.log("✅ HeriTech V4 database seeded successfully with PostgreSQL / Supabase!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
