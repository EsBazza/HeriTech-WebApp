// End-to-end API checks. Needs the emulators and a dev server in demo mode; see README "Testing".
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const AUTH_EMU = "http://127.0.0.1:9099";
let failures = 0;

function check(name, cond, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  ${extra}`}`);
  if (!cond) failures++;
}

async function call(path, { token, method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function login(role) {
  const demo = await call("/api/auth/demo", { method: "POST", body: { role } });
  const res = await fetch(`${AUTH_EMU}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: demo.json.data.token, returnSecureToken: true }),
  });
  const { idToken } = await res.json();
  const profile = await call("/api/auth/profile", { token: idToken, method: "POST" });
  return { token: idToken, user: profile.json.data };
}

// --- guests ---
check("guest: admin users -> 401", (await call("/api/admin/users")).status === 401);
check("guest: messages -> 401", (await call("/api/messages")).status === 401);
check("guest: order -> 401", (await call("/api/orders", { method: "POST", body: { items: [{ productId: "prod_01" }], shippingAddress: {} } })).status === 401);
check("bad token -> 401", (await call("/api/messages", { token: "garbage" })).status === 401);
const pub = await call("/api/stats");
check("public stats ok", pub.status === 200 && pub.json.data.escrowSplitSummary.totalGrossVolume === 87, JSON.stringify(pub.json?.data?.escrowSplitSummary));
check("public leaderboard is real", pub.json.data.leaderboard.length > 0 && pub.json.data.leaderboard.every((e) => ["artisan", "lgu"].includes(e.role)));

const buyer = await login("buyer");
const artisan = await login("artisan");
const lgu = await login("lgu");
const admin = await login("admin");
check("demo logins resolve to seeded accounts", buyer.user.id === "usr_buy_01" && artisan.user.id === "usr_art_05" && lgu.user.id === "usr_lgu_04" && admin.user.role === "admin");

// --- privilege escalation is blocked ---
const esc = await call("/api/user/profile/update", { token: buyer.token, method: "POST", body: { role: "admin", fullName: "Sarah J." } });
check("buyer cannot set own role", esc.status === 200 && esc.json.data.role === "buyer");
check("buyer: admin stats -> 403", (await call("/api/admin/stats", { token: buyer.token })).status === 403);
check("buyer: log batch -> 403", (await call("/api/materials", { token: buyer.token, method: "POST", body: {} })).status === 403);
check("buyer: ai scan -> 403", (await call("/api/ai/scan", { token: buyer.token, method: "POST", body: {} })).status === 403);

// --- LGU logs a batch ---
const img = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
const agrBefore = (await call("/api/agreements", { token: lgu.token })).json.data.find((a) => a.id === "RA-2026-005");
const logged = await call("/api/materials", {
  token: lgu.token,
  method: "POST",
  body: { title: "Test paper", materialType: "Paper and card", weightKg: 12.5, condition: "Dry", gpsLat: 15.03, gpsLng: 120.69, imageUrl: img, agreementId: "RA-2026-005" },
});
check("lgu logs batch with sequential id", logged.status === 201 && logged.json.data.id === `HT-${new Date().getFullYear()}-1001`, JSON.stringify(logged.json));
const batchId = logged.json.data?.id;
const agrAfter = (await call("/api/agreements", { token: lgu.token })).json.data.find((a) => a.id === "RA-2026-005");
check("agreement collectedKg incremented atomically", Math.abs(agrAfter.collectedKg - agrBefore.collectedKg - 12.5) < 1e-9, `${agrBefore.collectedKg} -> ${agrAfter.collectedKg}`);
check("unknown agreement rejected", (await call("/api/materials", { token: lgu.token, method: "POST", body: { ...logged.json.data, imageUrl: img, agreementId: "RA-NOPE" } })).status === 400);

// --- artisan reserves; second reserve conflicts ---
const reserve = await call(`/api/materials/${batchId}/reserve`, { token: artisan.token, method: "POST" });
check("artisan reserves batch", reserve.status === 200 && reserve.json.data.status === "reserved");
check("double reserve -> 409", (await call(`/api/materials/${batchId}/reserve`, { token: artisan.token, method: "POST" })).status === 409);
const lguMsgs = (await call("/api/messages", { token: lgu.token })).json.data;
check("logging officer got system message", lguMsgs.some((m) => m.isSystem && m.contextId === batchId));
const buyerMsgs = (await call("/api/messages", { token: buyer.token })).json.data;
check("other users can't see it", !buyerMsgs.some((m) => m.contextId === batchId));

// --- product from unclaimed batch is refused ---
check("listing from unclaimed batch -> 400", (await call("/api/products", { token: artisan.token, method: "POST", body: { title: "X", price: 10, images: [img], sourceBatchId: batchId, kgDiverted: 1, ngoFundName: "Trust" } })).status === 400);

// --- handover ---
const tok = await call("/api/handover/token", { token: artisan.token, method: "POST", body: { batchId } });
check("artisan gets handover token", tok.status === 200 && tok.json.data.token.startsWith("HT1."));
const tampered = tok.json.data.token.slice(0, -2) + (tok.json.data.token.endsWith("AA") ? "BB" : "AA");
check("tampered token -> 400", (await call("/api/handover/verify", { token: lgu.token, method: "POST", body: { token: tampered } })).status === 400);
check("artisan can't verify own code -> 403", (await call("/api/handover/verify", { token: artisan.token, method: "POST", body: { token: tok.json.data.token } })).status === 403);
const verified = await call("/api/handover/verify", { token: lgu.token, method: "POST", body: { token: tok.json.data.token } });
check("lgu verifies handover", verified.status === 200 && verified.json.data.status === "claimed", JSON.stringify(verified.json));
check("replayed token -> 409", (await call("/api/handover/verify", { token: lgu.token, method: "POST", body: { token: tok.json.data.token } })).status === 409);

// --- artisan lists a piece from the claimed batch ---
const listed = await call("/api/products", { token: artisan.token, method: "POST", body: { title: "Test lamp", price: 33.33, images: [img], sourceBatchId: batchId, kgDiverted: 2, stock: 2, ngoFundName: "Test charity" } });
check("artisan lists product", listed.status === 201 && Array.isArray(listed.json.data.images));
const productId = listed.json.data?.id;
check("buyer can't edit someone else's listing", (await call(`/api/products/${productId}`, { token: buyer.token, method: "PATCH", body: { price: 1 } })).status === 403);

// --- multi-item checkout ---
const order = await call("/api/orders", {
  token: buyer.token,
  method: "POST",
  body: { items: [{ productId, quantity: 2 }, { productId: "prod_01", quantity: 1 }], shippingAddress: { fullName: "Sarah", streetAddress: "1 Main", city: "Singapore", country: "Singapore" } },
});
check("checkout creates one order + pass per line", order.status === 201 && order.json.data.orders.length === 2 && order.json.data.passes.length === 2, JSON.stringify(order.json));
const o1 = order.json.data.orders[0];
check("split is 70/25/5 and sums exactly", o1.amountPaid === 66.66 && o1.artisanPayout === 46.66 && o1.lguShare === 16.67 && Math.round((o1.artisanPayout + o1.lguShare + o1.charityMaintenanceShare) * 100) === 6666, JSON.stringify(o1));
const after = (await call(`/api/products/${productId}`)).json.data;
check("stock decremented", after.stock === 0, `stock=${after.stock}`);
check("over-buying -> 409", (await call("/api/orders", { token: buyer.token, method: "POST", body: { items: [{ productId }], shippingAddress: { fullName: "a", streetAddress: "b", city: "c", country: "d" } } })).status === 409);
const artisanMsgs = (await call("/api/messages", { token: artisan.token })).json.data;
check("artisan notified of order", artisanMsgs.some((m) => m.contextType === "order" && m.contextId === o1.id));

const serial = order.json.data.passes[0].serial;
const ver = await call(`/api/verify/${serial}`);
check("new pass verifies publicly", ver.status === 200 && ver.json.data.escrowAudit.lguShare === 16.67 && ver.json.data.originHarvest.batchId === batchId, JSON.stringify(ver.json).slice(0, 300));
check("seeded pass verifies", (await call("/api/verify/HT-D3M0-0001")).json?.data?.serial === "HT-D3M0-0001");
const wallet = await call(`/api/wallet/${serial}`, { token: buyer.token });
check("buyer gets a Google Wallet save link (or a clear 503 if Wallet isn't configured)", (wallet.status === 200 && wallet.json.data.saveUrl.startsWith("https://pay.google.com/gp/v/save/")) || wallet.status === 503, JSON.stringify(wallet.json).slice(0, 200));
check("someone else can't get that wallet link", (await call(`/api/wallet/${serial}`, { token: artisan.token })).status === 403);
const history = (await call("/api/orders", { token: buyer.token })).json.data;
check("order history includes passes", history.some((h) => h.pass?.serial === serial));

check("new pass record is unchanged since collection", ver.json.data.integrity === "match", ver.json.data.integrity);
check("seeded pass record is unchanged since collection", (await call("/api/verify/HT-D3M0-0001")).json?.data?.integrity === "match");
check("odd serial -> 404, not 500", (await call("/api/verify/..%2Fx")).status === 404);

// --- listings: optional charity, weight capped on edit too ---
const noCharity = await call("/api/products", { token: artisan.token, method: "POST", body: { title: "No charity", price: 5, images: [img], sourceBatchId: batchId, kgDiverted: 1 } });
check("listing without a charity partner -> 201", noCharity.status === 201 && noCharity.json.data.ngoFundName === "", JSON.stringify(noCharity.json).slice(0, 200));
check("edit can't claim more kg than the batch -> 400", (await call(`/api/products/${noCharity.json.data?.id}`, { token: artisan.token, method: "PATCH", body: { kgDiverted: 50 } })).status === 400);
check("seeded listing with demo artwork can be edited", (await call("/api/products/prod_03", { token: artisan.token, method: "PATCH", body: { price: 41, ngoFundName: "", images: ["/demo/products/wall-shelf.svg"] } })).status === 200);

// --- reservations: artisans only, cancel and admin release ---
check("admin can't reserve -> 403", (await call("/api/materials/HT-2026-0301/reserve", { token: admin.token, method: "POST" })).status === 403);
check("artisan reserves a seeded batch", (await call("/api/materials/HT-2026-0301/reserve", { token: artisan.token, method: "POST" })).status === 200);
const cancelled = await call("/api/materials/HT-2026-0301/release", { token: artisan.token, method: "POST" });
check("holder cancels reservation", cancelled.status === 200 && cancelled.json.data.status === "available", JSON.stringify(cancelled.json).slice(0, 200));
check("officer told about the cancellation", (await call("/api/messages", { token: lgu.token })).json.data.some((m) => m.contextId === "HT-2026-0301" && /cancelled/.test(m.content)));
await call("/api/materials/HT-2026-0401/reserve", { token: artisan.token, method: "POST" });
check("buyer can't release -> 403", (await call("/api/materials/HT-2026-0401/release", { token: buyer.token, method: "POST" })).status === 403);
check("admin releases a reservation", (await call("/api/materials/HT-2026-0401/release", { token: admin.token, method: "POST" })).json?.data?.status === "available");
check("release of an available batch -> 409", (await call("/api/materials/HT-2026-0401/release", { token: admin.token, method: "POST" })).status === 409);

// --- agreement quota ---
check("batch over the agreement quota -> 409", (await call("/api/materials", { token: lgu.token, method: "POST", body: { title: "Too much", materialType: "Mixed plastics", weightKg: 200, condition: "Dry", gpsLat: 15.03, gpsLng: 120.69, imageUrl: img, agreementId: "RA-2026-004" } })).status === 409);

// --- deleting a sold product keeps its pass working ---
check("artisan archives product", (await call(`/api/products/${productId}`, { token: artisan.token, method: "DELETE" })).status === 200);
check("archived product's pass still verifies", (await call(`/api/verify/${serial}`)).status === 200);
check("archived product hidden from shop", !(await call("/api/products")).json.data.some((p) => p.id === productId));

// --- AI routes without a Gemini key ---
const scan = await call("/api/ai/scan", { token: lgu.token, method: "POST", body: { imageBase64: img, festivalHint: "panagbenga" } });
check("scan falls back to labelled sample in demo mode", scan.status === 200 && scan.json.data.isSample === true);
check("chat reports offline honestly", (await call("/api/chat", { method: "POST", body: { message: "hi" } })).status === 503);
const longHistory = Array.from({ length: 120 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(2500) }));
check("long chat history is trimmed, not rejected", (await call("/api/chat", { method: "POST", body: { message: "hi", history: longHistory } })).status === 503);
const story = await call("/api/ai/story", { token: artisan.token, method: "POST", body: { batchId, materialType: "Paper and card", craftTypology: null, artisanWorkshop: null, festival: null } });
check("story writer accepts empty fields (labelled sample in demo)", story.status === 200 && story.json.data.isSample === true, JSON.stringify(story.json).slice(0, 200));

// --- role applications ---
const apply = await call("/api/user/apply", { token: buyer.token, method: "POST", body: { type: "artisan", workshopName: "Sarah Studio" } });
check("buyer applies to be artisan", apply.status === 200 && apply.json.data.verificationStatus === "pending_artisan");
const apps = (await call("/api/admin/applications", { token: admin.token })).json.data;
check("admin sees only applicants", apps.some((a) => a.id === buyer.user.id) && apps.every((a) => a.verificationStatus !== "none"));
const approve = await call("/api/admin/applications", { token: admin.token, method: "POST", body: { userId: buyer.user.id, action: "approve" } });
check("admin approves -> artisan", approve.json.data?.role === "artisan");
check("admin can't drop own admin role", (await call("/api/admin/applications", { token: admin.token, method: "POST", body: { userId: admin.user.id, action: "change_role", targetRole: "buyer" } })).status === 400);
const stats = (await call("/api/admin/stats", { token: admin.token })).json.data;
check("admin pending count is real", stats.kpis.pendingApplicationsCount === 0, JSON.stringify(stats.kpis));

// --- agreements ---
const agr = await call("/api/agreements", { token: lgu.token, method: "POST", body: { title: "T", organizerName: "O", festival: "F", country: "PH", allocatedKg: 100 } });
check("agreement id continues after seed", agr.status === 201 && agr.json.data.id === `RA-${new Date().getFullYear()}-006`, JSON.stringify(agr.json));

// --- validation ---
check("invalid JSON -> 400", (await fetch(BASE + "/api/chat", { method: "POST", body: "{" })).status === 400);
check("unsupported language -> 400", (await call("/api/translate", { method: "POST", body: { text: "hi", targetLanguage: "xx" } })).status === 400);
check("translate: more than 100 strings -> 400", (await call("/api/translate", { method: "POST", body: { text: Array(101).fill("hi"), targetLanguage: "th" } })).status === 400);
check("translate: more than 20,000 characters -> 400", (await call("/api/translate", { method: "POST", body: { text: Array(5).fill("x".repeat(4500)), targetLanguage: "th" } })).status === 400);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
