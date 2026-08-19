export type UserRole = "buyer" | "artisan" | "lgu" | "admin" | "guest";

export function userRole(sessionOrUser: unknown): UserRole {
  if (!sessionOrUser || typeof sessionOrUser !== "object") {
    return "guest";
  }

  const obj = sessionOrUser as Record<string, unknown>;
  const rawRole =
    (obj.role as string) ||
    ((obj.user as Record<string, unknown>)?.role as string) ||
    "guest";

  const normalized = String(rawRole).toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "artisan") return "artisan";
  if (normalized === "lgu") return "lgu";
  if (normalized === "buyer") return "buyer";
  return "guest";
}
