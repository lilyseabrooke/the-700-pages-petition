# The Petition for 700 Pages

A lighthearted, entirely pointless petition. There's a button. Click it. The
counter goes up. That's the whole website. No names, emails, or personal
information are ever collected — just a single shared number.

- `index.html`, `style.css`, `script.js` — the static site, meant to be hosted
  on GitHub Pages. Styled as a "Starfall Academy" petition per the design
  handoff from Claude Design; `assets/` holds its fonts and crest artwork.
- `wrangler.toml`, `src/index.js` — a Cloudflare Worker that stores and
  serves the universal signature count via Cloudflare KV. It lives at the
  repo root (rather than a subfolder) so Cloudflare's Git-connected Worker
  Builds can find it with no custom build/deploy command or root-directory
  override needed.

## How it works

The site is fully static. When you click "Sign the Petition", the page calls
a small Cloudflare Worker API:

- `GET /count` — returns the current signature count.
- `POST /sign` — increments the count by one and returns the new total.

The count is stored in a single Cloudflare KV key, shared by everyone who
visits the site.

## Deploying the Worker (backend)

This repo is connected to Cloudflare Workers Builds: every push to `main`
auto-deploys the Worker using `wrangler.toml` at the repo root as the
config-as-code source of truth (including the `COUNTER` KV binding — don't
add or edit bindings by hand in the dashboard, since they get reconciled
away on the next deploy in favor of whatever's in this file).

To deploy manually instead (e.g. from your own machine):
```bash
npm install -g wrangler   # or use npx wrangler ...
npx wrangler login
npx wrangler deploy
```

(Optional but recommended) In `src/index.js`, set `ALLOWED_ORIGIN` to your
GitHub Pages URL (e.g. `https://yourusername.github.io`) instead of `*`, so
only your site can call the counter.

## Deploying the site (frontend)

1. In `script.js`, `WORKER_URL` should already point at your deployed
   Worker's `.workers.dev` URL.
2. In the repo settings, enable **GitHub Pages**, serving from the `main`
   branch (root directory).
3. Visit your GitHub Pages URL — the petition is live.

## Local development

You can open `index.html` directly in a browser, but you'll need the Worker
running locally (`npx wrangler dev` from the repo root) and `WORKER_URL` in
`script.js` pointed at the local dev URL it prints (e.g.
`http://127.0.0.1:8787`) to see the counter work end to end.
