# Draev — Next.js storefront

A Next.js (App Router + TypeScript + Tailwind) storefront with a real
backend: orders and products are stored in Netlify Blobs (built into your
existing Netlify hosting — no extra account or API key needed for that
part), behind a password-protected `/admin` dashboard.

## Setup — do this before your first real launch

### 1. Set your admin password

In the Netlify dashboard: **Site settings → Environment variables → Add a variable**

| Key | Value |
|---|---|
| `ADMIN_PASSWORD` | Pick a strong password. This is the only thing protecting `/admin`. |

Redeploy after adding it (env var changes need a new deploy to take effect).
Without this set, `/admin` login will always fail — on purpose, so it's
never accidentally left open.

### 2. (Optional, later) Turn on automatic order-status emails

Netlify can't send email by itself. If you want customers to get an email
when you mark their order Shipped/Delivered:

1. Sign up at resend.com (free tier: 100 emails/day, no card).
2. Verify a sending domain or use their test domain to start.
3. Add two more environment variables in Netlify:

| Key | Value |
|---|---|
| `RESEND_API_KEY` | From your Resend dashboard |
| `RESEND_FROM_EMAIL` | e.g. orders@yourdomain.com |

Until you do this, the site works completely fine — status emails are just
silently skipped.

### 3. Buy a domain and point it at Netlify

You're on a Netlify subdomain right now. Buy a domain (Namecheap, GoDaddy,
etc.), then in Netlify: **Domain settings → Add a domain** and follow their
DNS instructions. SSL is automatic and free once it's connected.

## Local development

```bash
npm install
netlify dev
```

**Use `netlify dev`, not `npm run dev`.** The order/product database
(Netlify Blobs) only works when running through the Netlify CLI locally —
plain `next dev` will 404 on all the `/api` routes. Install the CLI once
with `npm install -g netlify-cli` if you don't have it, then run
`netlify link` in this folder to connect it to your Netlify site.

## What's actually real now

- **Orders** are written to a database the moment a customer checks out
  (Cash on Delivery only) — not just a message you have to manually catch
  on WhatsApp. They show up instantly in `/admin`.
- **Products** are stored the same way. Add, edit availability, or delete
  them from `/admin` — no code required.
- **1-of-1 pieces sell out for real**: the moment an order is placed, that
  product is marked sold for every visitor, everywhere, immediately.
- **Admin access** is a single password (`ADMIN_PASSWORD`), stored as a
  cookie-based session — nobody else can see `/admin`'s contents.
- **Photo uploads**: adding a product lets you upload a photo directly from
  your device; it's stored the same way as everything else.

## What's still not done (do before telling customers this is live)

- **No refund/return, privacy, or shipping policy pages.** With COD, a
  clear refund/return policy matters more, not less — customers can refuse
  a package at the door.
- **No courier API integration** — you still book each delivery with
  TCS/Leopards/etc. manually per order using the info from `/admin`. That's
  normal at this stage, not a bug.
- **Single admin password, no per-staff accounts.** Fine for one person;
  revisit if you hire help.
- **No automated backups** of the order/product data beyond what Netlify
  Blobs itself provides.

## Project structure

```
src/
  app/
    admin/page.tsx       Password-gated dashboard: orders + product management
    api/                 Backend routes (products, orders, admin auth, uploads, images)
    layout.tsx           Root layout, fonts, StoreProvider
    page.tsx             Storefront page
  components/            One component per section/modal
  context/StoreContext.tsx   Client-side cart/UI state; talks to /api/* for real data
  lib/
    store.ts             Netlify Blobs read/write helpers (the database layer)
    auth.ts              Admin password/session check
    email.ts             Optional Resend email on order status change
    data.ts              Original product list — only used to seed the DB once
    types.ts             Shared types
```
