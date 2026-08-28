/**
 * Cloudflare Worker powering the petition's universal signature counter.
 *
 * Storage: a single Cloudflare KV key holding an integer count.
 * Routes:
 *   GET  /count  -> { count }              (read only, no change)
 *   POST /sign   -> { count }              (increments by 1, returns new total)
 *
 * KV binding expected (see wrangler.toml): COUNTER
 */

const COUNT_KEY = "signature-count";

// Set this to your GitHub Pages origin, e.g. "https://yourname.github.io".
// Use "*" while testing locally if you like, but lock it down before going live.
const ALLOWED_ORIGIN = "*";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
      ...(init.headers || {}),
    },
  });
}

async function getCount(env) {
  const raw = await env.COUNTER.get(COUNT_KEY);
  const count = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(count) ? count : 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/count" && request.method === "GET") {
      const count = await getCount(env);
      return jsonResponse({ count });
    }

    if (url.pathname === "/sign" && request.method === "POST") {
      // Cloudflare KV has no atomic increment, so read-then-write is best
      // effort. Under heavy simultaneous traffic a handful of increments
      // could race and be dropped — acceptable for a lighthearted counter.
      const current = await getCount(env);
      const next = current + 1;
      await env.COUNTER.put(COUNT_KEY, String(next));
      return jsonResponse({ count: next });
    }

    return jsonResponse({ error: "Not found" }, { status: 404 });
  },
};
