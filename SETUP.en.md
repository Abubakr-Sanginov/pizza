# Next Pizza — Setup Guide (EN)

A full-featured pizza e-commerce store built with **Next.js 14** + **Prisma** + **PostgreSQL**, including an admin panel, payments, push notifications, a Telegram bot, and a mobile app (Expo).

> Русская версия: [SETUP.ru.md](./SETUP.ru.md)

---

## Requirements

- **Node.js** 18+ (20 LTS recommended)
- **PostgreSQL** database ([Neon](https://neon.tech) works great — free serverless Postgres, the project was originally built on it)
- **npm** (ships with Node.js)

---

## Quick Start

```bash
# 1. Install dependencies (also generates the Prisma Client)
npm install

# 2. Create a .env.local file and fill it in (see the section below)

# 3. Push the DB schema (creates the tables)
npm run prisma:push

# 4. Seed with demo data (categories, products, admin user)
npm run prisma:seed

# 5. Run in development mode
npm run dev
```

The site will be available at **http://localhost:3000**

### Production build

```bash
npm run build
npm run start
```

---

## Admin login

After `npm run prisma:seed`, an admin account is created:

- **URL:** http://localhost:3000/admin/login
- **Email:** `admin@pizza.tg`
- **Password:** `111111`

> **Change this password** (or edit the credentials in `back/prisma/seed.ts`) before going live.

Demo customer: `user@test.ru` / `111111`.

---

## Environment variables (`.env.local`)

Create a `.env.local` file in the project root. Below is what each variable does. The site won't run properly without the required ones.

### Database (required)
```env
POSTGRES_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://user:pass@host:5432/dbname?sslmode=require
```
- `POSTGRES_URL` — main connection string (for Neon use the **Pooled connection**).
- `POSTGRES_URL_NON_POOLING` — direct connection (used for migrations). On Neon this is the connection **without** `-pooler` in the host.
- Always append `?sslmode=require`.
- **If you see `P1001 Can't reach database` or `the URL must start with postgresql://`** — the string is empty/invalid, or the Neon database is "asleep" (on the free tier it wakes up in a few seconds — just retry).

### NextAuth — authentication (required)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_string
```
- `NEXTAUTH_URL` — the public URL of the site. Locally `http://localhost:3000`, in production your domain `https://example.com`.
- `NEXTAUTH_SECRET` — secret used to sign sessions. Generate one: `openssl rand -base64 32` (or any long random string).

### SMTP — sending email (email verification)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASS=app_password
SMTP_FROM=your@email.com
SMTP_SECURE=true
```
- Used to verify email on registration. Without it, email signup won't work, but the site still runs.
- For Gmail, use an **App Password**, not your regular password.

### OAuth — social login (optional)
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
```
- Only fill in the ones you need. If left empty, the corresponding login button simply won't work.
- **Google:** [Google Cloud Console](https://console.cloud.google.com) → OAuth credentials.
- **GitHub:** Settings → Developer settings → OAuth Apps.
- **Apple:** Service ID + a JWT generated from a `.p8` key. Generate the secret here: https://bal.so/apple-gen-secret

### Telegram bot (WORKING)
```env
TELEGRAM_BOT_TOKEN=token_from_BotFather
TELEGRAM_CHAT_ID=chat_id_for_notifications
```
- `TELEGRAM_BOT_TOKEN` — get it from [@BotFather](https://t.me/BotFather).
- `TELEGRAM_CHAT_ID` — the chat/group ID where the bot sends order notifications.
- Run the bot: `npm run bot` (see the "Telegram bots" section below).

### Push notifications (Web Push / VAPID)
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:no-reply@example.com
```
- Needed for web push (browser notifications) and broadcasts from the admin panel.
- Generate keys: `npx web-push generate-vapid-keys`
- Without them, push is simply disabled (the site works, you'll see a warning in the logs).

### Telegram-bot payments (WORKING)
```env
PAYMENTS_BOT_TOKEN=payment_bot_token
PAYMENTS_BOT_USERNAME=bot_username_without_@
PAYMENTS_ADMIN_CHAT_ID=admin_chat_id
PAYMENT_INTERNAL_SECRET=random_string
NEXT_PUBLIC_SITE_URL=https://example.com
PAYMENT_CARD_NUMBER=card_number
PAYMENT_RECEIVER_NAME=Receiver name
PAYMENT_RECEIVER_PHONE=phone
PAYMENT_BANK_NAME=Bank name
STARS_FEE_PERCENT=10
STAR_PRICE_TJS=1.5
```
- The payment bot accepts payments (including Telegram Stars) and confirms orders.
- Run it: `npm run bot:payments`
- `PAYMENT_INTERNAL_SECRET` — a shared secret between the site and the bot (any long random string).
- `STARS_FEE_PERCENT` / `STAR_PRICE_TJS` — Telegram Stars payment settings.

### Image storage (S3-compatible) — recommended for production
```env
S3_BUCKET=
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_URL=https://cdn.example.com
# For Cloudflare R2 / Backblaze B2 / MinIO, set an endpoint:
S3_ENDPOINT=
# For MinIO / some R2 setups:
S3_FORCE_PATH_STYLE=false
```
- Image uploads (products, ingredients, stories, notifications) go through `/api/upload`.
- **If S3 is not configured, files are saved to the local `public/uploads` folder.** This works in development but **does NOT survive redeploys on serverless hosts (Vercel, Railway)** — images will be lost. For production you must configure S3.
- Any **S3-compatible** storage is supported:
  - **AWS S3** — set `S3_BUCKET`, `S3_REGION`, and keys. Leave `S3_ENDPOINT` empty.
  - **Cloudflare R2** — `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com`, `S3_PUBLIC_URL` = bucket's public domain.
  - **Backblaze B2 / Supabase Storage / MinIO** — set `S3_ENDPOINT` and, if needed, `S3_FORCE_PATH_STYLE=true`.
- `S3_PUBLIC_URL` — the public URL (CDN domain) files are served from. If omitted, the URL is built automatically from the bucket/endpoint.

### iiko Cloud — restaurant POS integration (UNTESTED)
```env
IIKO_API_LOGIN=
IIKO_ORGANIZATION_ID=
IIKO_TERMINAL_GROUP_ID=
IIKO_PAYMENT_TYPE_ID_CASH=
IIKO_PAYMENT_TYPE_ID_CARD=
IIKO_WEBHOOK_SECRET=
IIKO_API_URL=https://api-ru.iiko.services/api/1
IIKO_REQUEST_TIMEOUT_MS=15000
IIKO_MAX_RETRIES=2
CRON_SECRET=random_string
```
> **WARNING:** the iiko integration is implemented but **the author never tested it against a real iiko account** — it may not work or may behave incorrectly. Use at your own risk and test thoroughly before relying on it in production.
>
> **If you don't need iiko, just leave `IIKO_API_LOGIN` empty.** The integration disables itself automatically and does not affect the rest of the site.

- `IIKO_API_LOGIN` — the main API key from the iiko Cloud dashboard. Empty = integration off.
- `CRON_SECRET` — secret for the cron endpoints (`/api/iiko/poll-orders`, `/retry-orders`, `/sync-stoplist`).

### AI content translation (Google Gemini)
```env
GEMINI_API_KEY=
```
- Powers the "AI translate" button in the admin panel (auto-translates product names to Tajik/English).
- Get a key: [Google AI Studio](https://aistudio.google.com/app/apikey)
- Without it, the translate button won't work; everything else does.

### Misc
```env
NEXT_PUBLIC_API_URL=/api
```
- Base API path. Leave it as `/api`.

---

## Telegram bots

The project has two bots (run as separate processes):

| Command | What it does |
|---------|-------------|
| `npm run bot` | Main bot — order notifications in Telegram |
| `npm run bot:payments` | Payment bot — accepts payments and confirms orders |

In production they are usually run via `pm2` or as separate services so they stay up.

---

## Internationalization

Both the storefront and the admin panel are translated into **3 languages**: Russian, Tajik, English. The language switcher is in the site header. Translation strings live in `shared/locales/{ru,tg,en}.json`.

---

## Mobile app (Expo)

The `NextApp/` folder contains a React Native (Expo) mobile app. For Android push notifications you need a `google-services.json` from Firebase (place it at `NextApp/google-services.json`). See `NextApp/` for details.

---

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start in development mode |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run prisma:push` | Apply the DB schema (create tables) |
| `npm run prisma:seed` | Seed the DB with demo data |
| `npm run prisma:studio` | Open Prisma Studio (visual DB editor) |
| `npm run bot` | Start the main Telegram bot |
| `npm run bot:payments` | Start the payment bot |

---

## Common issues

- **`P1001 Can't reach database`** — DB unreachable. Check `POSTGRES_URL`; if it's Neon on the free tier, the DB is "asleep" — retry in a few seconds.
- **`the URL must start with postgresql://`** — `POSTGRES_URL` is empty or invalid.
- **`createContext is not a function` during build** — should be fixed; if it reappears, make sure server code doesn't import the client-side `react-i18next`.
- **Push not sending / VAPID warning** — `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are not set.
- **Emails not arriving** — check your SMTP settings (Gmail requires an App Password).

---

## Bare minimum to "just get it running"

To boot the site locally you only need:
1. `POSTGRES_URL` + `POSTGRES_URL_NON_POOLING`
2. `NEXTAUTH_URL` + `NEXTAUTH_SECRET`

Everything else (SMTP, OAuth, bots, payments, iiko, push, AI) can be added later as needed.
