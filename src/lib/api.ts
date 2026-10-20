"use client";

import { auth } from "@/lib/firebase/client";

/**
 * fetch() for HeriTech's own API routes. Adds the signed-in user's Firebase ID
 * token so the server can verify who is calling, and a JSON content type when
 * a body is sent. Guests are sent without a token.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(path, { ...init, headers });
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  /** HTTP status, so callers can tell "not found" (404) from a failed request. Absent when the server was unreachable. */
  status?: number;
}

/** authFetch + JSON parsing that never throws: failures come back as `{ success: false, error }`. */
export async function apiJson<T = unknown>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await authFetch(path, init);
    const body = (await res.json().catch(() => null)) as ApiResult<T> | null;
    if (!body) return { success: false, error: `Unexpected response (${res.status}).`, status: res.status };
    return { ...body, status: res.status };
  } catch {
    return { success: false, error: "Couldn't reach the server. Check your connection and try again." };
  }
}
