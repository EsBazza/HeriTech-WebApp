import "server-only";
import { randomInt } from "node:crypto";
import type { Transaction } from "firebase-admin/firestore";
import { db } from "./firestore";

/**
 * Hands out the next number of a named sequence inside a transaction, so two
 * concurrent requests can never receive the same id.
 */
export async function nextSequence(tx: Transaction, name: string, start: number): Promise<number> {
  const ref = db.counters().doc(name);
  const snap = await tx.get(ref);
  const value = snap.exists ? (snap.get("value") as number) + 1 : start;
  tx.set(ref, { value });
  return value;
}

const SERIAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Random pass serial such as "HT-7KQ2-M9XD", without look-alike characters. */
export function passSerial(): string {
  const block = () => Array.from({ length: 4 }, () => SERIAL_ALPHABET[randomInt(SERIAL_ALPHABET.length)]).join("");
  return `HT-${block()}-${block()}`;
}
