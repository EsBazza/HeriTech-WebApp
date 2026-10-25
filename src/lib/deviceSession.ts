"use client";

/**
 * Things this browser keeps for whoever is signed in: their cart, the assistant
 * conversation, unsent drafts and read markers. A shared phone at the booth or on
 * stage passes between people, so all of it is forgotten when the account changes.
 */
export const DEVICE_KEYS = {
  cart: "heritech_cart",
  assistantThread: "heritech_assistant_thread_v5",
  drafts: "heritech_chat_drafts_v4",
  seen: "heritech_chat_seen_v1",
} as const;

/** Fired on window after the previous account's device data was cleared. */
export const ACCOUNT_CHANGED_EVENT = "heritech:account-changed";

export function forgetDeviceSession() {
  try {
    for (const key of Object.values(DEVICE_KEYS)) localStorage.removeItem(key);
  } catch {
    // Storage blocked: there is nothing stored to forget.
  }
  window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
}
