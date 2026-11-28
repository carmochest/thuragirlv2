// POST /api/early — saves an early-access email to the Cloudflare D1 database bound as DB.
// The table is created on first use. View the list in Cloudflare: Storage & databases > D1 > thuragirl-waitlist.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PLANS = ["Standard", "Pro"];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return json({ error: "origin" }, 403);
    } catch {
      return json({ error: "origin" }, 403);
    }
  }
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "bad" }, 400);
  if (Number(request.headers.get("Content-Length") || 0) > 2048) return json({ error: "bad" }, 400);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad" }, 400);
  }
  if (!b || typeof b !== "object") return json({ error: "bad" }, 400);
  // honeypot field that people never see: bots fill it, so pretend success and save nothing
  if (b.company) return json({ ok: true });

  const email = String(b.email || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return json({ error: "bad" }, 400);
  const plan = PLANS.includes(b.plan) ? b.plan : null;
  const lang = b.lang === "th" ? "th" : "en";
  const country = (request.cf && request.cf.country) || null;

  if (!env.DB) return json({ error: "unavailable" }, 503);
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS early_access (email TEXT PRIMARY KEY, plan TEXT, lang TEXT, country TEXT, signed_up_at TEXT NOT NULL)"
    ).run();
    await env.DB.prepare(
      "INSERT INTO early_access (email, plan, lang, country, signed_up_at) VALUES (?1, ?2, ?3, ?4, ?5) " +
        "ON CONFLICT(email) DO UPDATE SET plan = COALESCE(excluded.plan, early_access.plan)"
    )
      .bind(email, plan, lang, country, new Date().toISOString())
      .run();
  } catch (e) {
    console.error("early_access insert failed", e && e.message);
    return json({ error: "unavailable" }, 503);
  }
  return json({ ok: true });
}
