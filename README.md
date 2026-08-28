# The Petition for 700 Pages

A lighthearted, entirely pointless petition. There's a button. Click it. The
counter goes up. That's the whole website. No names, emails, or personal
information are ever collected — just a single shared number.

- `index.html`, `style.css`, `script.js` — the static site, meant to be hosted
  on GitHub Pages.
- `worker/` — a Cloudflare Worker that stores and serves the universal
  signature count via Cloudflare KV.

## How it works

The site is fully static. When you click "Sign the Petition", the page calls
a small Cloudflare Worker API:

- `GET /count` — returns the current signature count.
- `POST /sign` — increments the count by one and returns the new total.

The count is stored in a single Cloudflare KV key, shared by everyone who
visits the site.

## Deploying the Worker (backend)

1. Install [wrangler](https://developers.cloudflare.com/workers/wrangler/)
   and log in:
   ```bash
   cd worker
   npm install
   npx wrangler login
   ```
2. Create a KV namespace for the counter:
   ```bash
   npx wrangler kv namespace create COUNTER
   ```
   Copy the `id` it prints into `worker/wrangler.toml` under `[[kv_namespaces]]`.
3. (Optional but recommended) In `worker/src/index.js`, set `ALLOWED_ORIGIN`
   to your GitHub Pages URL (e.g. `https://yourusername.github.io`) instead
   of `*`, so only your site can call the counter.
4. Deploy:
   ```bash
   npx wrangler deploy
   ```
   This prints your Worker's URL, e.g.
   `https://petition-counter.yourname.workers.dev`.

## Deploying the site (frontend)

1. In `script.js`, set `WORKER_URL` to the Worker URL from the step above.
2. Push this repo to GitHub.
3. In the repo settings, enable **GitHub Pages**, serving from the `main`
   branch (root directory).
4. Visit your GitHub Pages URL — the petition is live.

## Local development

You can open `index.html` directly in a browser, but you'll need the Worker
running (`npx wrangler dev` inside `worker/`) and `WORKER_URL` pointed at
the local dev URL it prints (e.g. `http://127.0.0.1:8787`) to see the
counter work end to end.
