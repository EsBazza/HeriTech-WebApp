/**
 * Rewrites the stored split on every order to the current SPLIT in src/lib/escrow.ts
 * (60% artisan / 20% LGU / 15% developers / 5% NGO). Payments are simulated, so this only
 * changes how recorded sales are divided; what each buyer paid stays the same.
 *
 *   npm run migrate:split               dry run against .env: prints what would change
 *   npm run migrate:split -- --apply    writes it
 *   npm run migrate:split:demo -- --apply   same against the demo project
 */
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../src/lib/firebase/admin-core";
import { calculateEscrowSplit } from "../src/lib/escrow";

const APPLY = process.argv.includes("--apply");
const cents = (n: number) => Math.round(n * 100);

async function main() {
  const db = adminDb();
  const snap = await db.collection("orders").get();
  let changed = 0;
  let writer = db.batch();
  let pending = 0;

  for (const doc of snap.docs) {
    const o = doc.data();
    const free = o.paymentMode === "free_claim" || !o.amountPaid;
    const discount = Number(o.discount ?? 0);
    // The discount always came out of HeriTech's own share, so the list price is what was paid plus it.
    const full = calculateEscrowSplit(Number(o.amountPaid ?? 0) + discount);
    const next = free
      ? { artisanPayout: 0, lguShare: 0, developerShare: 0, ngoShare: 0 }
      : { artisanPayout: full.artisanPayout, lguShare: full.lguShare, developerShare: (cents(full.developerShare) - cents(discount)) / 100, ngoShare: full.ngoShare };

    const same = (Object.keys(next) as (keyof typeof next)[]).every((k) => o[k] === next[k]) && o.charityMaintenanceShare === undefined;
    if (same) continue;
    changed++;
    console.log(`${doc.id}  paid ${o.amountPaid}  ->  ${next.artisanPayout} / ${next.lguShare} / ${next.developerShare} / ${next.ngoShare}`);
    if (APPLY) {
      writer.update(doc.ref, { ...next, charityMaintenanceShare: FieldValue.delete() });
      if (++pending === 400) {
        await writer.commit();
        writer = db.batch();
        pending = 0;
      }
    }
  }
  if (APPLY && pending) await writer.commit();
  console.log(`${snap.size} orders, ${changed} ${APPLY ? "updated" : "would change (dry run; add --apply to write)"}.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
