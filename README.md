# LeadDesk Mini

A small lead-capture product built for the Digital Heroes Full Stack Development task (Task A + Task B).

- **Public side:** a landing page with a lead form (name, email, budget range, message), validated on both the client and the server.
- **Admin side:** a real, password-protected `/admin` area for listing leads, searching them, and moving each one through New → Contacted → Closed.

Stack: **Next.js 14 (App Router)** for both frontend and backend, **Prisma** as the ORM, **SQLite** for local dev (swap one line for Postgres in production), and a **JWT session in an httpOnly cookie** for admin auth.

---

## 1. Setup

```bash
npm install
npx prisma db push         # creates dev.db and the tables from schema.prisma
npm run seed                # creates the one admin user, from ADMIN_EMAIL/ADMIN_PASSWORD in .env
npm run dev                  # http://localhost:3000
```

Default dev login (only if you didn't change `.env`): `admin@leaddesk.local` / `changeme123`. Change these before deploying anywhere real — the seed script reads them from environment variables, they are never hardcoded in application code.

> Note: `npm install` runs `prisma generate` automatically via a `postinstall` hook. This needs to reach `binaries.prisma.sh` to download its query engine — normal on any real machine or CI/deploy platform, it's just blocked in the sandboxed environment this was built in.

### Deploying

1. Push the repo to GitHub.
2. Spin up a free Postgres instance (Neon, Supabase, or Railway all have free tiers).
3. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
4. Deploy to Vercel, setting these environment variables: `DATABASE_URL` (your Postgres connection string), `AUTH_SECRET` (generate with `openssl rand -base64 32`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
5. Run `npx prisma db push` once against the production database (Vercel's build step or a one-off local run with the prod `DATABASE_URL`), then `npm run seed` to create the admin account.

---

## 2. Data model

Two tables, defined in `prisma/schema.prisma`:

**`Lead`** — one row per form submission: `name`, `email`, `budgetRange`, `message`, a `status` enum (`NEW | CONTACTED | CLOSED`, defaulting to `NEW`), plus `createdAt`/`updatedAt` timestamps. Indexed on `status` and `createdAt` since those are exactly what the admin list filters and sorts by.

**`AdminUser`** — one row per admin account: `email` (unique) and `passwordHash` (bcrypt, never plaintext). Only one row exists in this project (seeded), but the table structure supports adding more admins later without any code changes — just insert another row.

I kept these as two separate models rather than, say, folding auth into a config file, because leads are the actual business data (need indexing, filtering, growth over time) while admin accounts are a small, slow-changing set — different enough access patterns that they don't belong in the same shape.

---

## 3. Auth approach

Admin auth is a **JWT stored in an httpOnly, signed cookie** — not a hardcoded password check, and not a full session-table system.

**Why JWT over a hardcoded string:** the brief explicitly calls for real login, not a magic string in an `if` statement. Credentials are checked against `AdminUser.passwordHash` with `bcrypt.compare`, and the login endpoint returns the same generic "Invalid email or password" whether the email doesn't exist or the password is wrong — so a failed attempt can't be used to enumerate valid admin emails.

**Why JWT over a database session table:** for a single-admin internal tool like this, a DB-backed session adds a table and a query on every request for a benefit (instant server-side revocation) that doesn't matter much here. A signed JWT gives the middleware something it can verify without hitting the database at all — useful because `middleware.ts` runs on the **Edge runtime**, where a full Prisma client isn't available. That's also why the JWT library is `jose` rather than `jsonwebtoken` — `jose` is Edge-compatible.

**Where enforcement happens (defense in depth, not just one gate):**
1. `src/middleware.ts` — intercepts every `/admin/*` request before it reaches a page or layout, redirecting to `/admin/login` if there's no valid session cookie.
2. `src/app/admin/page.tsx` — checks the session again server-side before rendering, so the admin page is safe on its own even if middleware config changes.
3. `GET /api/leads` and `PATCH /api/leads/[id]` — check the session independently too, since API routes should never trust that "the page that calls me is protected" is enough.

The cookie is `httpOnly` (JavaScript can't read it, blocking XSS token theft), `sameSite: "lax"` (CSRF mitigation), and `secure` in production (HTTPS only). Sessions expire after 8 hours.

**One thing I'd change with another day:** move from a single hardcoded admin row to proper multi-admin support with roles, and add rate-limiting on the login endpoint to slow down brute-force attempts — right now there's no lockout after repeated failed logins.

---

## 4. What I'd point out in a walkthrough

- The lead form validates with the exact same Zod schema (`src/lib/validation.ts`) on both the client and inside the API route, so the two can never silently drift apart.
- The admin leads list does search + status filtering server-side (in the Prisma query), not by fetching everything and filtering in the browser — matters once there are thousands of leads instead of a handful.
- Status changes in the admin table update optimistically in the UI and roll back if the server call fails, rather than waiting on a full round trip before showing anything.

---

*Built for the Digital Heroes Full Stack Development internship task. AI (Claude) was used to scaffold the Next.js/Prisma structure and write the initial implementation; I reviewed the auth design, adjusted the data model reasoning, and would rewrite the README's walkthrough notes in my own words before submitting, along with the required Loom recording.*
