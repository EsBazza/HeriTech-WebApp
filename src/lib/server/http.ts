import "server-only";
import { NextResponse } from "next/server";
import { z, type ZodTypeAny } from "zod";

/** An error whose message is safe to show to the caller. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message = "Sign in to continue.") => new HttpError(401, message);
export const forbidden = (message = "Your account can't do that.") => new HttpError(403, message);
export const notFound = (message = "Not found.") => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

export function ok<T>(data: T, init?: ResponseInit & { message?: string }) {
  const { message, ...rest } = init ?? {};
  return NextResponse.json({ success: true, data, ...(message ? { message } : {}) }, rest);
}

function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  console.error("[api] unhandled error:", error);
  return NextResponse.json({ success: false, error: "Something went wrong on our side. Please try again." }, { status: 500 });
}

/**
 * Wraps a route handler so thrown HttpErrors become JSON responses and anything
 * unexpected is logged and returned as a generic 500.
 */
/** Public base URL of the app: NEXT_PUBLIC_APP_URL when set, otherwise the request's origin. */
export function appUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
}

export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/** Parses and validates a JSON body. Responds 400 with the first problem found. */
export async function parseBody<S extends ZodTypeAny>(request: Request, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length ? `${issue.path.join(".")}: ` : "";
    throw badRequest(`${where}${issue.message}`);
  }
  return result.data;
}

/** Common field schemas. */
export const fields = {
  id: z.string().trim().min(1).max(128),
  text: (max: number) => z.string().trim().min(1).max(max),
  optionalText: (max: number) =>
    z
      .string()
      .trim()
      .max(max)
      .optional()
      .transform((v) => (v ? v : null)),
  money: z.coerce.number().positive().max(100_000),
  kg: z.coerce.number().positive().max(1_000_000),
};
