# HeriTech — Project Context

**Last updated:** July 26, 2026
**Competition:** EDUtech Asia 2026 — Planet Protectors Sustainability Challenge (Higher Ed League)
**Status:** Team shortlisted. Building toward the live showcase, 4–5 November 2026, Sands Expo & Convention Centre, Singapore.

---

## 1. Executive Summary

Every year, Asian festivals — lantern releases, temple offerings, parade effigies — generate large volumes of single-use bamboo, paper, fabric, and floral waste. HeriTech is a **circular digital system** that intercepts this material before it becomes landfill, uses AI to classify and route it to local artisans, and gives every finished product a **verifiable digital provenance record** (a "HeriTech Pass" in Google Wallet) that proves where the material came from and how much money went to environmental causes.

The pitch in one line: *"We don't just upcycle waste — we build the digital infrastructure that makes upcycling accountable, traceable, and scalable across an entire region."*

The system has three layers, and **the digital layer is the actual product**, not a wrapper around a craft business:

1. **Sensing & classification layer** — Gemini-powered computer vision identifies, grades, and logs materials at the point of collection.
2. **Coordination layer** — a digital marketplace and ledger that matches materials to artisans, tracks custody, and automates fair, transparent revenue splits.
3. **Proof layer** — a publicly verifiable digital record (Wallet Pass + public ledger page) that turns a vague "we donate to charity" claim into an auditable one.

This document is the single source of truth for the project. It should be read in full by anyone (human or AI) working on the build.

---

## 2. Competition Context

### 2.1 Event & Eligibility
- **Organizer:** Terrapinn, in partnership with **Google for Education**.
- **Event dates:** 4–5 November 2026, Singapore (Sands Expo & Convention Centre, Halls D/E/F).
- **League:** Higher Ed (18+). Team of **4 students + 1 educator chaperone**, all from the same institution. All team members must be physically present in Singapore if shortlisted (you already are).
- **Awards:** Judges' Choice (top 3 teams per league) + People's Choice (attendee vote onsite). Champion of each league gets an additional Google for Education prize.
- **⚠️ Hard compliance rule:** Teams must meet the age/legal requirements for any Google tool used in their home country. Violations — **even with adult/teacher help** — cost a flat **20-point penalty**. Before using any Google AI tool in the actual build or demo, confirm each team member meets the local minimum age for a personal Google/Gemini account, or use school-managed Workspace for Education accounts instead.

### 2.2 Judging Criteria (from your briefing materials)
| Criterion | Weight | What it's really asking |
|---|---|---|
| Use of Google Tech | **40%** | Not "did you use Gemini once" — how deeply and specifically does the product *depend* on Google tools to function? |
| Creativity | 15% | Original mechanism, not just an original topic. |
| Practicality | 15% | Cost, accessibility, scalability — can this survive contact with a real festival, a real temple committee, a real artisan? |
| Knowledge/Research | 15% | Do you understand the waste problem's causes, scale, and existing solutions — not just its symptoms? |
| Presentation Skills | 15% | Clarity and persuasiveness live, in person, in Singapore. |

Because "Use of Google Tech" is worth as much as the next two criteria combined, the build plan below deliberately uses **more than one** Google tool in a load-bearing way (not decorative), and the pitch deck should narrate *why* each one was chosen over a non-Google alternative.

### 2.3 The Official Higher Ed Problem Statement (verbatim, condensed)
> *"Design a circular digital system that reduces waste, extends the life of technology, and creates lasting environmental and social value. Move away from the traditional 'take, make, discard' model toward systems that extend lifecycles, eliminate waste, and regenerate value."*

Read literally, this leans toward *device/e-waste* circularity. See Section 3 — this is the single most important strategic issue for your pitch, and it's fully solvable.

### 2.4 Suggested Google Tools (use this as your shopping list)
Gemini (app + Gems + Deep Research + Canvas + Audio Overview + Veo3 video), NotebookLM, Google Workspace for Education, ChromeOS tools, Google Maps / Maps Platform, Google Earth / Earth Engine, Google Lens, Google Cloud, Google Translate, YouTube, Teachable Machine, and "other relevant Google tools." Aim to visibly use **at least 4–5** of these across research, build, and pitch — not just the Gemini API.

---

## 3. Strategic Positioning — Making HeriTech Read as a "Circular Digital System"

This is the most important section in this document. Read it before changing anything else.

**The risk:** As originally pitched (waste → craft → sale → donation), HeriTech is a strong *circular economy* story but a weak *circular digital system* story, because the digital app is described as a convenience layer around a physical-goods business, not as the innovation itself. Judges scoring against the literal brief language ("extends the life of technology," "circular digital system") may not immediately see the fit.

**The fix — reposition, don't rebuild.** You keep the exact same idea, but you lead the pitch with the system, not the souvenirs:

1. **Name the digital system explicitly.** Give the platform itself a name distinct from the mission brand — e.g. **"HeriTech OS"** or **"The Provenance Engine."** Pitch it as: *"We built a circular digital system for physical materials. Festival waste is our first proof case — the same system could run on textile offcuts, e-waste, or construction scrap tomorrow."* This single move reframes the product from "an upcycling shop with an app" to "an app that happens to currently run on festival waste."
2. **Directly address "extends the life of technology" — don't dodge it, satisfy it literally.** Build your AI sorting stations on **donated/refurbished school Chromebooks** (many schools already have end-of-life ChromeOS devices sitting in storage). This means HeriTech's own operations are a working example of extending device lifecycles — you can say, with a straight face, that the system extends the life of both *materials* and *technology*. This is a small build decision with an outsized pitch payoff.
3. **Lean on the "system," not the "shop."** The Higher Ed brief explicitly allows "a focused innovation or a broader system-level solution." Present HeriTech as a **three-sided digital coordination system** (Organizers ↔ Artisans ↔ Consumers), with the physical craft output as one visible manifestation of a reusable backend. Show the architecture diagram before you show a product photo.
4. **Show the loop closing digitally, not just physically.** Every step in Section 6 should have a corresponding *data* event (material logged → claimed → crafted → sold → donation posted → pass issued). The judges should see a live ledger/dashboard, not just souvenirs — that dashboard *is* the circular digital system.
5. **Use the research tools, visibly, in your submission.** Use **NotebookLM** to synthesize your research sources (cite it in your deck: "research synthesized via NotebookLM from 12 sources"). Use **Gemini Deep Research** for the waste-stream data. Use **Veo3** to generate a 30–60 second explainer video. This directly satisfies "Use of Google Tech" and "Knowledge/Research" simultaneously.

**One sentence you can drop directly into your pitch:**
> "Where the brief asks for a circular digital system that extends the life of technology and eliminates waste — HeriTech is that system. It runs on refurbished school Chromebooks, it tracks every gram of material from waste to sale on a live digital ledger, and festival craft is simply the first vertical we're proving it on."

---

## 4. Problem Statement & Research Base

### 4.1 The Waste Problem — What the Data Actually Shows
HeriTech's material stream isn't limited to lantern paper and bamboo — the research base below deliberately spans three different material categories (paper/bamboo, floral/organic, textile) across five countries (Thailand, Taiwan, Vietnam, India, Indonesia), which matters for both "Knowledge/Research" depth and for showing judges the system generalizes rather than being a one-trick lantern app.

- **Sky/water lantern festivals — paper & bamboo.** Yi Peng and Loy Krathong (Chiang Mai, Thailand) release tens of thousands of paper-and-bamboo sky lanterns and banana-leaf/styrofoam krathongs in a single night; many lanterns contain metal wire and wax that don't biodegrade, and local authorities have had to restrict release zones because of litter and fire risk. **2026 dates: Yi Peng Nov 24–25, Loy Krathong Nov 25** — this falls just after your Singapore showcase, making it a realistic first pilot target. The same material profile shows up at Taiwan's **Pingxi Sky Lantern Festival** (2026: 3 March) and Vietnam's **Hoi An Lantern Festival**, which runs **monthly** (14th day of the lunar month) rather than annually — useful to know if you want a recurring pilot cadence instead of a once-a-year flagship.
- **Temple floral offerings — organic waste.** This is the largest-scale, best-documented waste stream in the region: an estimated **~800 million tonnes of flowers** are offered at temples, mosques, and gurudwaras across India annually, with roughly **8 million tonnes** dumped directly into rivers like the Ganges. Festival-specific collection is already precedented at municipal scale — during Maharashtra's **Ganesh Chaturthi** idol-immersion season, Thane Municipal Corporation alone collected **over 150 tonnes of "nirmalaya"** (floral/puja waste) across 18 immersion sites in a single year, composting roughly 40 tonnes of it. This is also the material stream with the strongest existing commercial proof point — see Phool.co in 4.2.
- **Bali Kite Festival — bamboo & cotton cloth (Indonesia, June–August).** Traditional and competition kites are built from bamboo frames and cotton cloth, flown over open rice paddies, and routinely damaged, lost, or discarded during flight. This is a genuinely different material category (textile, not paper), a different season (mid-year, filling the gap between the Nov/Mar lantern-festival cluster), and — unlike ritual effigies — the kites are recreational objects with no sacred-destruction meaning, which makes the consent conversation with organizers considerably simpler (see 4.4).
- **Ogoh-ogoh statues, Nyepi (Bali)** — bamboo-and-papier-mâché effigies, some several metres tall. **Flag this one carefully (see 4.4) — do not lead your pitch with it,** and don't treat it as a fourth "pilot option"; it's included here only so the team is aware of it and doesn't stumble into it by accident.

### 4.2 Precedents & Competitive Landscape (cite these — it strengthens "Knowledge/Research")
Naming these in your pitch shows judges you did the homework, and helps you clearly state *what's different* about HeriTech.

- **Phool.co (Kanpur, India)** — the strongest real-world validation of this entire model. Founded 2017, collects temple flower waste that was polluting the Ganges and converts it into incense, compost, and a leather alternative ("Fleather"). Recycled **over 11,000 metric tonnes** of floral waste in its first four years; employs **300+ marginalized women**. Critically: **it took Phool's founders about 18 months of relationship-building before any temple would hand over their waste** — this is your strongest evidence for why the "digital MOU / partnership layer" in Section 6 isn't a bureaucratic afterthought, it's the hardest and most important part of the system to get right. Phool did this manually over 18 months; HeriTech's pitch is that a digital consent/partnership registry can compress and scale that process.
- **Mymoniko (Malaysia/Cambodia)** — works with artisan workshops to turn kimono fabric into clutches and purses, with strong emphasis on storytelling about material origin. Closest direct analog to HeriTech's craft layer — your differentiator is the **AI + digital provenance layer**, which Mymoniko does not have.
- **XSProject (Jakarta, Indonesia)** — converts plastic/packaging waste into bags, and — importantly — **provides scholarships and inclusion pathways for informal waste pickers**, rather than routing around them. Model this for your own labor-ethics story (see Section 10).
- **GoodCity (Hong Kong, by Crossroads)** — an app for donating clothes/household goods to people in need. Validates that "waste-matching app" UX patterns work in Asian markets, but is donation-based, not marketplace/artisan-based.
- **NoLimbah, Nuplas, Upp! (Southeast Asia)** — general circular-economy/plastic-upcycling startups; useful for a "broader landscape" slide but not direct competitors.

### 4.3 Recommended Pilot Festivals (in priority order)
Deliberately picked to span three different material categories and three countries, so the pitch reads as "a system that works across festival types," not "a lantern app":

1. **Yi Peng & Loy Krathong, Chiang Mai, Thailand (Nov 24–25, 2026)** — paper & bamboo. Best-documented waste problem, strong visuals, immediately follows your showcase. Your flagship demo case (used for seed data throughout this document).
2. **Temple Floral Offerings / Ganesh Chaturthi "Nirmalaya" Collection, India** — floral & organic. The largest-scale waste stream by far, an existing municipal collection precedent to point to (Thane's ~150-tonne nirmalaya drives), and a direct line to the strongest real-world proof point in your whole deck (Phool.co).
3. **Bali Kite Festival, Indonesia (June–August)** — bamboo & cotton cloth. Textile diversity, a different season (fills the calendar gap between the Nov/Mar lantern cluster), and structurally easier organizer consent than any ritual object.

*Same-category alternatives, if logistics force a change of flagship:* Hoi An Lantern Festival (Vietnam, monthly cadence — useful if you want to pilot repeatedly rather than once a year) and Pingxi Sky Lantern Festival (Taiwan, ~March) sit in the same material category as Yi Peng.

### 4.4 Handle With Care / Do Not Lead With
- **Ogoh-ogoh (Bali Nyepi)** — these effigies are ritually **burned** as a spiritual act (symbolically destroying negative energy). "Rescuing" them from destruction runs against the meaning of the ritual itself, and pitching this to judges without acknowledging that would read as tone-deaf, not resourceful. If you want to reference Balinese material culture at all, talk to a cultural advisor first, or reframe around the **scaffolding/production offcuts** created *while building* Ogoh-ogoh (bamboo trims, unused papier-mâché) rather than the finished statues.
- **Any sacred/consecrated object** — the general rule: HeriTech should only intercept **surplus, discarded, or production-offcut material** that the community has already finished with and is not spiritually significant in itself (lantern frames after release, banana-leaf krathong remnants collected from riverbanks, fabric offcuts from lantern-making workshops) — not objects still carrying ritual meaning.

---

## 5. Users & Actors

| Actor | Role | What they get |
|---|---|---|
| **Festival Organizer / Temple Committee / Municipality** | Grants collection rights via a digital agreement | Cleaner post-event site, positive PR, waste-management cost reduction |
| **Collector / Volunteer** (can include informal waste pickers, paid) | Scans and logs material on-site | Fair payment per verified kg collected, not just goodwill |
| **HeriTech Platform (you)** | Runs classification, matching, ledger, marketplace | Transaction fee + data/impact reporting |
| **Artisan** | Claims material, crafts product, tags provenance | Free/low-cost material input + guaranteed fair-trade minimum price + new market access |
| **Consumer/Buyer** | Purchases finished product | A unique, traceable souvenir + transparent proof of impact |
| **Charity Partner** | Receives verified donation share | Funding + transparent, auditable reporting |

---

## 6. Product: App Flow v2

The original 4-step flow (Clean Up → Crafting → Buying → Digital Proof) is good bones but skips the two steps judges and real-world operators will ask about first: **rights/consent** and **safety triage**. Here is the improved 9-step flow:

**Step 0 — Partnership & Digital Consent (new)**
Before any collection happens, HeriTech issues a digital **Material Release Agreement** to the festival organizer/temple/municipality — a simple, timestamped digital consent record (not a stack of paperwork) defining what may be collected, when, and by whom. This closes the single biggest real-world risk (see Phool.co precedent) and is itself a "digital system" innovation worth pitching.

**Step 1 — Collection & AI Classification**
Volunteers/collectors use the HeriTech Scanner (a lightweight web app, ideally running on **refurbished school Chromebooks** at collection points) to photograph each item. **Gemini's multimodal API** identifies material type (bamboo / rice paper / silk / cloth), estimates condition, and flags contamination (wax, metal wire, food residue, mildew). Each item gets a unique **Material ID**, GPS tag (via Maps Platform), festival tag, and timestamp, written to a live ledger.

**Step 2 — Safety Triage (new)**
Items flagged as contaminated or unsafe are automatically routed to proper recycling/disposal — **not** offered to artisans. This step protects artisan health and product safety, and it's an easy, concrete answer when a judge asks "what happens to the waste you *can't* use?"

**Step 3 — Artisan Marketplace & Claim**
Verified artisan partners browse available material batches by type, quantity, and pickup location, and claim what they need. Framing matters: this **lowers artisan input costs and gives them new market access** — it is not "free labor," and your pitch should say so explicitly (see Section 10, Loophole: Labor Fairness).

**Step 4 — Crafting & Provenance Tagging**
When a piece is finished, the artisan photographs it and links it to the original Material ID(s). A short "material story" (waste photo → craft photo → finished product) is auto-drafted by Gemini from the logged journey data, then reviewed by the artisan before publishing — this is a genuinely useful, non-gimmicky use of generative AI.

**Step 5 — Marketplace Listing & Transparent Checkout**
The product is listed with its story. At checkout, the buyer sees an itemized split — e.g., artisan payment, platform/logistics cost, and verified charity donation — **not just "10% to charity."** Showing the full breakdown is what separates this from greenwashing (see Section 10).

**Step 6 — Charity Disbursement**
Donation share is logged to a public ledger with the (real, formally partnered) charity's name and a running total. This should be backed by an actual signed relationship before any public claim is made — see Section 10.

**Step 7 — HeriTech Pass Issuance**
On purchase, the buyer taps "Add to Google Wallet" and receives their pass (full spec in Section 7).

**Step 8 — Impact Dashboard (system-level view)**
A public dashboard aggregates: total material diverted (kg), artisans supported, funds donated, devices reused at collection points, and a per-festival breakdown. This is the single screen that most directly proves "circular digital system" to a judge — show it early in the demo, not last.

---

## 7. The HeriTech Pass — v2 (Redesigned for Clarity)

**Problem with v1:** "shows origin & donation" is vague — a judge or user can't tell at a glance what's actually being proven, and a wallet pass with no verification mechanism is just a nice-looking label, easy to dismiss as a gimmick.

**v2 design:**

- **Header:** Product photo + product name.
- **One-line story** (plain language, not marketing copy): *"This bracelet was once a Yi Peng sky lantern released in Chiang Mai, 24 Nov 2026."*
- **Fields (Generic pass, structured):**
  - Origin Festival & Date
  - Material Type
  - Artisan Name & Location
  - Donation Amount + Charity Name
  - Unique Provenance ID
- **QR code → public Impact Page.** This is the part that makes the pass *proof* instead of *decoration*: scanning it opens a public webpage showing the full chain-of-custody (waste photo → collection log → artisan claim → crafting photo → sale → donation ledger entry, all timestamped). Anyone — a judge, a skeptical buyer, a journalist — can verify the claim independently.
- **Plain-language label:** call it a **"Verified Impact Pass,"** not a generic loyalty-card-style name. The word "verified" is doing real work here because it points at the QR-code proof mechanism.

**Build note:** Google Wallet passes have two modes. **Demo mode** works immediately with no approval wait and is perfect for your live judge demo (add test users = your team + judges' emails). **Publishing access** (for issuing to the general public) requires a short Google review (business profile + screenshots, ~1–2 business days) — mention in your pitch that you're already in the publishing-access queue, so it reads as "in progress," not "hypothetical."

---

## 8. Technical Architecture

| Layer | Google Tech | What it does |
|---|---|---|
| Material classification | **Gemini API** (multimodal) | Identifies material type/condition/contamination from a photo |
| Collection device fleet | **ChromeOS** (refurbished/donated school Chromebooks) | Runs the Scanner web app at collection points; literal "extends the life of technology" proof point |
| Logistics/location | **Google Maps Platform** | Tags collection points, plans artisan pickup routes |
| Digital pass / proof | **Google Wallet API** (Generic Pass) | Issues the Verified Impact Pass |
| Backend/data | **Google Cloud** (Firestore or Cloud SQL + Cloud Functions) | Ledger of Material IDs, custody events, donations |
| Research synthesis | **NotebookLM** | Synthesizes waste-stream research, precedent research (cite in deck) |
| Deep research | **Gemini Deep Research** | Sourcing waste-tonnage and precedent data |
| Pitch video | **Veo3** (via Gemini) | 30–60s system explainer for the submission/showcase |
| Multilingual UX | **Google Translate API** | Artisan-facing UI in local languages (Thai, Vietnamese, Bahasa) |
| On-device fallback classifier | **Teachable Machine** | A lightweight, offline-capable backup classifier for low-connectivity collection sites — good secondary "Use of Google Tech" point, and a real practicality answer for rural/low-signal festival sites |

**Why this matters for judging:** each row above is a *specific, load-bearing* integration, not "we used Gemini to write our pitch." Be ready to explain, for each one, what would break if you removed it.

---

## 9. Business Model

**Revenue split per transaction (example — tune to real costs before pitching exact numbers):**
- ~50–60% → Artisan payment (fair-trade floor price, not "market rate for free materials")
- ~20–25% → Platform operations (logistics, collection, app/infra costs)
- ~15–20% → Verified charity donation

**Show this full breakdown at checkout and in the pitch.** A donation-only headline number ("10% to charity") invites a greenwashing challenge from a sharp judge; a transparent full split invites trust instead.

**Revenue streams beyond per-item margin:**
- Small listing/transaction fee on artisan sales
- B2B licensing of the "Provenance Engine" backend to other waste verticals (textile offcuts, e-waste refurbishers, construction scrap) — this is your answer to the "scalability" criterion and reinforces the "circular digital system, not just a shop" positioning.
- Optional: festival/city sponsorship for waste-diversion reporting (cities increasingly need ESG-style waste metrics for tourism boards).

---

## 10. Risks, Loopholes & Mitigations

Be ready for these questions from judges — each one below is paired with the answer you should already have.

1. **Waste ownership / legal rights.** Who actually owns discarded festival material — the organizer, the municipality, a temple committee? *Mitigation:* Step 0 digital consent agreement, before any collection. Cite Phool.co's 18-month trust-building process as evidence you understand this is the hard part, and explain how a digital agreement layer compresses it.
2. **Cultural/religious sensitivity.** Some festival objects are ritually significant and not meant to be "saved." *Mitigation:* Section 4.4 — explicit exclusion criteria, and pick pilot festivals where the material is genuinely post-use surplus, not a sacred object.
3. **Health & safety of collected material.** Wax, metal wire, fireworks residue, food waste contamination. *Mitigation:* Step 2 triage — contaminated items are routed to proper disposal, never to artisans.
4. **Informal waste-picker displacement.** In many Asian cities, waste picking is an existing livelihood. A volunteer-collection model can inadvertently take income from people who already do this work. *Mitigation:* pay collectors (including existing informal waste pickers) per verified kg logged — model this on XSProject's inclusion approach, not around it.
5. **Charity transparency / greenwashing risk.** A vague "10% to charity" claim is an easy target. *Mitigation:* full transparent split (Section 9) + public, verifiable ledger (Section 7) + a real, named, formally-partnered charity — do not name a specific charity in your pitch unless you have an actual agreement in place; use a placeholder ("a to-be-confirmed verified environmental NGO partner") until you do.
6. **Artisan labor fairness.** "Free materials for artisans" can read as extracting cheap labor. *Mitigation:* explicit fair-trade floor pricing, and frame the pitch around *lowering artisan input costs while guaranteeing minimum payment*, not "materials for free."
7. **Google Wallet publishing timeline.** Publishing access takes ~1–2 business days of review after prerequisites are met; it is not instant. *Mitigation:* use demo mode for your live judge demo (works immediately with test users), and mention you're in the publishing queue for the public launch.
8. **Age/legal compliance penalty.** Using Google AI tools without meeting local age/legal requirements costs a flat 20-point penalty even with adult help. *Mitigation:* confirm every team member's eligibility, or use school-managed Workspace for Education accounts for the build.
9. **Festival/brand IP use.** Using an official festival's name and imagery commercially may need permission from organizers. *Mitigation:* for the hackathon demo, use factual/historical references to real festivals for research credibility, but keep any product mockups generically branded ("HeriTech x [Pilot Festival, pending partnership]") rather than implying an existing commercial deal you don't have.
10. **Bystander privacy in collection photos.** Photos taken at festivals for AI classification may incidentally capture people. *Mitigation:* scanner workflow should default to close-up material shots, not wide festival scenes; state a simple photo-retention/privacy policy in the pitch — this is an easy, high-credibility line to add ("we designed the scanner to photograph the material, not the crowd").

---

## 11. MVP Scope for the Working Prototype (What You Can Actually Demo)

Given the goal is a **working app/prototype you can demo live**, scope it to what's genuinely buildable and reliable on a hackathon timeline — not a production system.

**Build for real:**
- Full click-through web app covering Steps 0–8 with realistic seed data (use Yi Peng/Chiang Mai as the flagship demo festival).
- Real Gemini API call for material photo classification (with a graceful fallback to a pre-set response if the API is slow/unavailable live — never let a live API hiccup break the demo).
- Real Google Wallet demo-mode pass generation (judges' emails added as test users ahead of time).
- Live-looking impact dashboard driven by the seeded ledger data.
- Public Impact Page behind the Pass's QR code, showing the mocked chain-of-custody.

**Simulate/mock clearly (and say so if asked — honesty here reads as maturity, not weakness):**
- Real charity partnership and payment processing.
- Real artisan network (use realistic but clearly fictional artisan profiles).
- Real festival organizer partnership agreement (show the *interface* for Step 0, not a real signed deal).

---

## 12. Roadmap Beyond the Hackathon (for the "Practicality/Scalability" criterion)

1. **Immediate next pilot:** Hoi An Lantern Festival (monthly cadence) for iterative testing, or Yi Peng/Loy Krathong (Nov 24–25, 2026) as a single high-visibility flagship pilot right after the showcase.
2. Formalize one real charity partnership and one real artisan cooperative partnership before the next event cycle.
3. Apply for Google Wallet publishing access in parallel with pilot planning.
4. License the underlying "Provenance Engine" to a second waste vertical (e.g., school e-waste, textile offcuts) to prove the "circular digital system, not just a craft shop" claim with a second real use case.

---

## 13. Pitch Talking Points

- *"We're not a craft marketplace with an app bolted on — we're a circular digital system for physical materials. Festival waste is our proof case."*
- *"It took Phool.co eighteen months of manual relationship-building to get temples to hand over their waste. We built a digital consent layer to make that trust-building process repeatable and fast."*
- *"Our collection stations run on refurbished school Chromebooks — we're extending the life of technology at the exact same time we're extending the life of materials."*
- *"Every dollar is traceable. Scan the pass, see the waste photo, the artisan, and the donation — in public, in real time."*

---

## 14. Open Questions for the Team (resolve before finalizing the pitch)

- Which festival is the flagship demo case — Yi Peng/Loy Krathong or Hoi An? (Affects seed data and story.)
- Do you have (or can you realistically get, even informally) a conversation started with a real charity or artisan group before the showcase, even a small local one? A real (even early-stage) relationship beats a hypothetical one in Q&A.
- Who on the team owns the Google Wallet Issuer account setup — this should be started now, not the week before the showcase, since publishing access needs lead time.
- Confirm every team member's eligibility to use the specific Google AI tools you plan to demo live, per the 20-point penalty rule.
