# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server (Express + Vite middleware) on `http://localhost:5000`. On Windows binds to `127.0.0.1` (set in `server/index.ts` to avoid `ENOTSUP` on `0.0.0.0`).
- `npm run build` — build client (`vite build` → `dist/public`) and bundle server (`esbuild server/index.ts` → `dist/index.js`). Both must succeed; `npm start` and the prod box require `dist/`.
- `npm start` — run the production bundle (`node dist/index.js`).
- `npm run check` — TypeScript type check (`tsc --noEmit`). There is **no test suite and no linter**; this is the only programmatic correctness gate.
- `npm run db:push` — push Drizzle schema in `shared/schema.ts` to the DB at `DATABASE_URL`. **Note**: drizzle-kit's interactive "create or rename" prompt does not accept piped input via stdin; if it stalls (e.g. similarly-named existing table), apply DDL directly via a one-shot `Pool.query` script — see the `try_on_history` migration history for an example.
- `npm run scrape` — Puppeteer scraper at `scraper/celio-scraper.mjs`. **Requires the dev server running** because it POSTs scraped products to `http://localhost:5000/api`. Resumable via `scraper/scraper-progress.json`.
- One-off maintenance scripts in `scripts/` (`fix-product-colors.mjs`, `translate-products-to-italian.mjs`, `sync-cegid-prices.mjs`, …) are standalone `.mjs` that import the same DB. Read each before running.

A populated `.env` is required for everything except `npm run check`. Minimum: `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`. Stripe / PayPal / Replicate are optional — code degrades cleanly when their keys are absent (Stripe init at top of `server/routes.ts` returns `null`; the try-on endpoint returns 500 with an Italian message when `REPLICATE_API_TOKEN` is missing).

## Architecture

### Single-process monorepo

This is **one Node process** that serves both the API and the React app. There is no separate frontend dev server.

- In dev, `server/index.ts` registers API routes first, then `setupVite()` mounts Vite as Express middleware so `/src/main.tsx` and HMR are served from the same port as `/api/*`.
- In prod, `serveStatic()` serves pre-built `dist/public` and falls through to `index.html` for client-side routes.
- `dist/` shape is intentional: `dist/index.js` (server) sits next to `dist/public/` (client). `serveStatic` resolves `public` relative to the running script — moving the server bundle breaks it.
- **tsx does NOT auto-reload** the server on file changes in dev. After editing `server/*` or `shared/*`, kill node and `npm run dev` again. Vite HMR only handles `client/src/*`.

### Path aliases

Vite and TypeScript both map:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*` (used by client AND server — schema lives here so types cross the boundary)
- `@assets/*` → `attached_assets/*` (Vite only)

Cross-boundary code (types, validators) must live in `shared/`.

### Database layer

- **Driver**: Neon serverless over WebSockets (`server/db.ts`). `neonConfig.webSocketConstructor = ws` must stay or Neon won't work in Node.
- **ORM**: Drizzle, schema-first. All tables, enums, `drizzle-zod` insert schemas in `shared/schema.ts` (~1k LOC, single file). Adding a table: define here → push → `import from '@shared/schema'`.
- **Storage abstraction**: `server/storage.ts` exports `IStorage` interface + single `DatabaseStorage` implementation. Most routes call `storage.*`; some bulk/admin handlers query `db` directly. Both styles exist — match the surrounding code.
- **Two databases in production**: dev uses Neon `ep-divine-thunder-…` (us-west-2), prod uses Neon `ep-curly-silence-…` (us-east-1). They are independent — schema changes must be applied to both. The local `.env` and the prod `/var/www/celiopromo/.env` carry different `DATABASE_URL`s.

### Server routing — `server/routes.ts`

One **~4.4k-line file** registering every endpoint inside `registerRoutes(app)`. No router splitting. The function returns the `http.Server` so `setupVite` can attach HMR.

Cross-cutting concerns to know about:

- **Stripe** is conditionally initialized; endpoints null-check the client.
- **`groupByBaseName()` + `fixProductImages()`** (top of file) post-process scraped product data on every read: merge color variants into one representative product, strip junk URLs (FR-flag SVG, header assets, any `*.svg`). New product-listing endpoints **must** reuse these helpers or the storefront will look inconsistent vs the rest of the site.
- **`isJunkImage()`** (top of file) is the predicate behind `fixProductImages` and behind the cart's image-cleanup pipeline. Centralize any new "this URL is not a real product image" rules there.
- **Cart image hygiene** — write-time and read-time. `POST /api/cart/add` runs `fixProductImages` over the product before storing the image (preferring `colorImages[color][0]` if a color was selected). `GET /api/cart` self-heals: if any item has a junk image, it re-resolves from the products table and writes back. The heal is one-shot per cart.
- **Virtual try-on** (`/api/virtual-tryon`) calls Replicate's `cuuupid/idm-vton` model (version pinned in code). Server polls every 2s up to 60 attempts (120 s cap). It bails fast on non-OK HTTP from Replicate (401 → "Token Replicate non valido", 402 → "Crediti AI esauriti") so a bad token doesn't waste 120 s. On success, if `userId` was sent in the body, the result is persisted to `try_on_history`. Failures inside the history insert never break the user's image response.
- **Admin image upload** (`/api/admin/upload-image`) accepts multipart files, validates by mime OR extension (catches iPhone HEIC labelled `application/octet-stream`), and returns a base64 `data:` URL. Storing self-contained data URLs in DB columns avoids any filesystem/object-storage setup; fine for a few dozen rows but inflates row size ~33%, so don't use for the product catalog.
- **Email** through `server/email.ts` (Resend). Order confirmations are Italian invoice-style with 22% VAT.

### Category slug routing — `getProductsByCategory` in `server/storage.ts`

Slugs from URLs (e.g. `/category/maglioni`) map to DB categories via this function in this order:

1. **Special-case slugs** (top of function): `novita` / `nouveautes` returns the newest 48 products. `nameRegex` map (`baggy-party`, `one-piece`) filters product names by regex — these are "themed collections" without a real DB category.
2. **Direct match** on normalized category (lowercased, diacritics stripped, `&` removed, spaces → `-`).
3. **`aliasMap`**: explicit slug → DB-category/subcategory aliases (`maglioni` → `Maglioni & Felpe`, `shorts` → `Pantaloncini`, `bermudas` → `Bermuda` subcategory, etc.).

When a category page shows "0 articoli", check this function first — most failures are missing alias entries, not data problems.

### Client — `client/src/`

- **Router** is **wouter** (not React Router, despite the dep). `client/src/App.tsx` lists all routes. `/admin/*` wraps pages in `AdminLayout`; `/team/*` is a separate ERP surface.
- **Server state** uses **TanStack Query** with a default `queryFn` that treats `queryKey[0]` as the URL (`client/src/lib/queryClient.ts`). Components write `useQuery({ queryKey: ['/api/products'] })` and the URL gets fetched automatically. `apiRequest()` is the mutation helper.
- **UI** is **shadcn/ui** in `client/src/components/ui/` — generated, do not edit by hand. Use `components.json` to regenerate. Tailwind in `tailwind.config.ts` + CSS vars in `client/src/index.css`.
- **Customer auth** is localStorage-only — no JWT cookies. After login/register, `localStorage.customerAuth` carries `{id, email, firstName, lastName, profilePhoto}`. `Header.tsx` reads it on every render. `CustomerAuth.tsx` (`/account` route) branches on its presence: profile view (cart + try-on history) when set, login/register form when not. Profile photo is stored in users.profilePhoto as a base64 data URL.
- **Storefront copy is Italian**. The scraper pulls French (`celio.com/fr-fr/`); `scripts/translate-products-to-italian.mjs` translates fields. Keep user-facing strings Italian.

### Scraper pipeline

Two-phase Puppeteer job (`scraper/celio-scraper.mjs`):
1. Walk category listing pages on celio.com → collect product URLs + basics.
2. Visit each product page → images, colors, sizes, description → POST to local `/api`.

Resumable via `scraper-progress.json`. After scraping, the `scripts/` cleanup chain (`fix-product-colors.mjs`, `download-best-images.mjs`, `trim-images.mjs`, `sync-cegid-prices.mjs`, `translate-products-to-italian.mjs`) is typically run in order.

## Production deployment

Production runs on a VPS, not Replit / Vercel / etc. Live at `https://celiopromo.it`.

- **Host**: `81.88.18.81` (user `administrator`). Plain `ssh` password auth is **rejected** by the host policy — connect via Python + Paramiko (proven). Use a key-based auth setup or Paramiko in deploy scripts.
- **App location**: `/var/www/celiopromo/`.
- **Process manager**: pm2 (`celiopromo` is the process name, id 2). It runs `dist/index.js` directly. Restart with `pm2 restart celiopromo --update-env` after `.env` changes.
- **nginx** terminates TLS (Let's Encrypt via certbot) and proxies `celiopromo.it` → `127.0.0.1:5001`. Config at `/etc/nginx/sites-available/celiopromo`. The `:5001` server block carries a critical `client_max_body_size 10M;` — without it, image uploads >1 MB fail with HTTP 413 before reaching Node. **This directive lives only on the server, not in any deploy artifact** — if nginx config is restored from backup it must be re-added.
- **Port collision**: `biellasmart` (a sibling Node app, also pm2-managed) listens on `:5000`. The Celio prod app uses `:5001`. The local dev server uses `:5000`. Don't change either without checking pm2 + nginx.
- **PostgreSQL** (16) is also running locally on the box at `:5432`, but Celio prod uses Neon (different DB from dev — see Database layer above), not the local Postgres.

### Deployment workflow

There is no CI. Deploys are manual, scripted by `deploy_celiopromo.py` in the local user's temp dir (not in the repo — keep it that way; the file embeds SSH credentials):

1. `npm run build` locally.
2. Run the deploy script. It (a) tars `dist/` to `~/celiopromo_dist_pre_<ts>.tar.gz` for rollback, (b) SFTPs new `dist/`, `shared/`, `server/`, `package.json`, `package-lock.json`, (c) appends `REPLICATE_API_TOKEN` to prod `.env` if missing, (d) `pm2 restart celiopromo --update-env`, (e) hits the public URL + `/api/products?limit=1` for smoke verification.
3. Schema changes need a separate step: connect to the prod Neon DB and apply DDL directly (since `npm run db:push` on the server would also stall on the interactive prompt for any rename ambiguity).

Rollback: `cd /var/www/celiopromo && tar xzf /home/administrator/celiopromo_dist_pre_<ts>.tar.gz && pm2 restart celiopromo`.

## Conventions

- ESM everywhere (`"type": "module"`). `import`, not `require`. `tsx` runs in dev; `esbuild --format=esm --packages=external` bundles for prod.
- Don't introduce a new image-storage strategy without thinking through it. The catalog has external celio.com URLs (real, durable). Customer profile photos and admin store/lookbook photos are **base64 data URLs in the DB** (intentional — small N, zero infra). Product catalog growth via base64 would be a mistake.
- The scraper, helper scripts, and admin tools assume `groupByBaseName`-merged shape. When debugging "missing variants" or "wrong main image", check that helper before the DB.
- `replit.md` and `README_SETUP.md` are **historical** (Replit-era setup notes, mention `MemStorage` which no longer exists). This file is the source of truth.
- The Replicate token is the most fragile production dependency: it can expire and burn a 24-hour outage. There's a scheduled remote-trigger health check (24h cadence) that pings `/v1/account` and pm2 status; check its history if production behavior degrades.
