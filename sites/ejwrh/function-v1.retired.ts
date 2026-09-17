// RETIRED — ejwrh Edge Function v1, captured verbatim from live CQCX 2026-08-23 before the
// Gate A v2 replacement (rollback material + evidence; do not redeploy: it serves the
// contained storage page whose bucket is now private and whose write path 0138 removed).
//
// EJWRH public site — serves the intake portal from RecoveryOS storage as rendering HTML.
// Public by design: this is the applicant-facing site (no auth). Submissions still go
// through PostgREST with its own RLS consent gate.
const STORAGE = "https://cqcxvwoukyhxyokfwnjm.supabase.co/storage/v1/object/public/sites/ejwrh";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  // /ejwrh, /ejwrh/, /ejwrh/index.html -> portal; assets pass through by filename
  const tail = url.pathname.split("/").filter(Boolean).pop() ?? "";
  const isAsset = tail.includes(".") && tail !== "index.html";
  const target = isAsset ? `${STORAGE}/${tail}` : `${STORAGE}/index.html`;
  const upstream = await fetch(target, { headers: { "accept": "*/*" } });
  if (!upstream.ok) return new Response("Not found", { status: 404 });
  const body = await upstream.arrayBuffer();
  const type = isAsset
    ? (upstream.headers.get("content-type") ?? "application/octet-stream")
    : "text/html; charset=utf-8";
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=300",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
});
