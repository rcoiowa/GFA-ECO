import { handleRcoInquiry, RCO_PERMISSION } from "../lead-intake/rco.ts";
import type { LeadIntakeDeps } from "../lead-intake/handler.ts";

const origin = "https://rco-iowa-public.thomas-499.workers.dev";
const base = {
  name: "Synthetic RCO Inquiry",
  email: "rco-test@example.invalid",
  organization: "Synthetic Test",
  topic: "RecoveryOS pilot conversation",
  message: "Synthetic test only",
  contact_permission: true,
  permission_version: "rco-iowa-inquiry-v1",
  submission_id: "ab472668-f208-4b16-a2bb-89efbb1080d1",
  website: "",
  turnstile_token: "test-token",
};
function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}
function fixture(verification: Record<string, unknown> = {}) {
  const rows: Record<string, unknown>[] = [];
  let calls = 0;
  const deps: LeadIntakeDeps = {
    getAdmin: () => ({
      from: (table: string) => {
        assert(table === "leads", "must only use canonical leads");
        return {
          select: () => ({
            eq: (_key: string, value: string) => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: rows.some((r) => r.wix_submission_id === value)
                    ? { id: 999 }
                    : null,
                }),
            }),
          }),
          insert: (row: Record<string, unknown>) => ({
            select: () => ({
              single: () => {
                rows.push(row);
                return Promise.resolve({ data: { id: 999 }, error: null });
              },
            }),
          }),
        };
      },
    }),
    fetch: async (url) => {
      assert(
        String(url).includes("turnstile/v0/siteverify"),
        "no external email calls",
      );
      calls++;
      return new Response(
        JSON.stringify({
          success: true,
          hostname: new URL(origin).hostname,
          action: "rco_inquiry",
          ...verification,
        }),
        { status: 200 },
      );
    },
  };
  return {
    deps,
    rows,
    get calls() {
      return calls;
    },
  };
}
function request(
  payload: unknown = base,
  from: string | null = origin,
  method = "POST",
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (from) headers.origin = from;
  return new Request(
    "https://example.supabase.co/functions/v1/lead-intake/rco-iowa",
    {
      method,
      headers,
      ...(method === "POST" ? { body: JSON.stringify(payload) } : {}),
    },
  );
}
async function withEnv(fn: () => Promise<void>) {
  const values = {
    TURNSTILE_SECRET: "test-secret",
    LEAD_INTAKE_SECRET: "test-intake",
    RESEND_API_KEY: "test-key",
    RESEND_FROM: "test@example.invalid",
    LEAD_ALERT_TO: "staff@example.invalid",
  };
  const previous = Object.fromEntries(
    Object.keys(values).map((k) => [k, Deno.env.get(k)]),
  );
  try {
    for (const [k, v] of Object.entries(values)) Deno.env.set(k, v);
    await fn();
  } finally {
    for (const [k, v] of Object.entries(previous)) {
      v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v);
    }
  }
}
Deno.test("RCO inquiry preserves provenance, explicit consent, canonical write, privacy and retry idempotency", () =>
  withEnv(async () => {
    const f = fixture();
    const response = await handleRcoInquiry(request(), f.deps);
    assert(response.status === 200, "valid request accepted");
    const body = await response.json();
    assert(
      body.ok && body.code === "received" && !body.id && !body.lead_id,
      "no internal IDs exposed",
    );
    const row = f.rows[0];
    assert(
      row.source === "rco_iowa_inquiry_v1" && row.organization_inquiry === true,
      "source and routing server-owned",
    );
    assert(row.residence_interest === "unspecified", "does not infer housing");
    const receipt = JSON.parse(String(row.notes));
    assert(
      receipt.text === RCO_PERMISSION && receipt.origin === origin &&
        receipt.accepted === true,
      "permission receipt",
    );
    const retry = await handleRcoInquiry(request(), f.deps);
    assert(
      retry.status === 200 && f.rows.length === 1 && f.calls === 2,
      "retry is idempotent and re-verifies token",
    );
  }));
for (
  const [label, patch] of Object.entries({
    "missing consent": { contact_permission: false },
    "wrong consent version": { permission_version: "other" },
    "invalid email": { email: "bad" },
    "injected routing": { source: "attacker" },
    "invalid topic": { topic: "housing" },
    "honeypot": { website: "bot" },
    "oversize message": { message: "x".repeat(1201) },
    "invalid id": { submission_id: "123" },
    "missing verification": { turnstile_token: "" },
  })
) {
  Deno.test(`RCO rejects ${label}`, () =>
    withEnv(async () => {
      const f = fixture();
      const r = await handleRcoInquiry(request({ ...base, ...patch }), f.deps);
      assert(
        r.status === 400 && f.rows.length === 0 && f.calls === 0,
        "invalid input does not verify or write",
      );
    }));
}
for (const from of [null, "https://attacker.example"]) {
  Deno.test(`RCO rejects origin ${from}`, () =>
    withEnv(async () => {
      const f = fixture();
      const r = await handleRcoInquiry(request(base, from), f.deps);
      assert(
        r.status === 403 && !r.headers.has("access-control-allow-origin") &&
          f.rows.length === 0,
        "reject origin",
      );
    }));
}
for (
  const bad of [{ success: false }, { hostname: "attacker.example" }, {
    action: "contact_connect",
  }]
) {
  Deno.test(`RCO rejects challenge ${JSON.stringify(bad)}`, () =>
    withEnv(async () => {
      const f = fixture(bad);
      const r = await handleRcoInquiry(request(), f.deps);
      assert(r.status === 400 && f.rows.length === 0, "reject wrong challenge");
    }));
}
Deno.test("RCO preflight, missing configuration, malformed and oversized requests", () =>
  withEnv(async () => {
    const f = fixture();
    assert(
      (await handleRcoInquiry(request(base, origin, "OPTIONS"), f.deps))
        .status === 204,
      "preflight",
    );
    assert(
      (await handleRcoInquiry(request(base, origin, "GET"), f.deps)).status ===
        405,
      "method",
    );
    assert(
      (await handleRcoInquiry(request({ message: "x".repeat(9000) }), f.deps))
        .status === 413,
      "body bound",
    );
    Deno.env.delete("TURNSTILE_SECRET");
    assert(
      (await handleRcoInquiry(request(), f.deps)).status === 503,
      "missing secret fails closed",
    );
    assert(f.rows.length === 0, "no writes");
  }));
