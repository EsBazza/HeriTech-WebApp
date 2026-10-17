import { describe, expect, it } from "vitest";
import { z } from "zod";
import { HttpError, parseBody, route, unauthorized } from "@/lib/server/http";
import { passSerial } from "@/lib/server/ids";

const jsonRequest = (body: string) => new Request("http://test/api", { method: "POST", body });

describe("parseBody", () => {
  const schema = z.object({ name: z.string().min(1), count: z.coerce.number().default(1) });

  it("returns parsed output with defaults applied", async () => {
    await expect(parseBody(jsonRequest('{"name":"a"}'), schema)).resolves.toEqual({ name: "a", count: 1 });
  });

  it("rejects malformed JSON with 400", async () => {
    await expect(parseBody(jsonRequest("{"), schema)).rejects.toMatchObject({ status: 400 });
  });

  it("names the failing field", async () => {
    await expect(parseBody(jsonRequest('{"name":""}'), schema)).rejects.toThrow(/^name: /);
  });
});

describe("route", () => {
  it("turns HttpErrors into JSON responses", async () => {
    const res = await route(async () => {
      throw unauthorized();
    })();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ success: false, error: "Sign in to continue." });
  });

  it("hides unexpected error details", async () => {
    const res = await route(async () => {
      throw new Error("database password is hunter2");
    })();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("hunter2");
  });

  it("passes HttpError subclasses through", () => {
    expect(new HttpError(418, "teapot").status).toBe(418);
  });
});

describe("passSerial", () => {
  it("uses the HT-XXXX-XXXX format without look-alike characters", () => {
    for (let i = 0; i < 200; i++) expect(passSerial()).toMatch(/^HT-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });
});
