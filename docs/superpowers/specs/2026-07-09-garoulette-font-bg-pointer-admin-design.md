# Garoulette — Custom font, background colour, pointer fix, admin CRUD

Date: 2026-07-09
Status: Approved (design)

## Scope

Four independent features on the existing Next 16 (App Router) kiosk app:

1. Per-campaign custom font (curated whitelist).
2. Per-campaign background colour.
3. Wheel pointer/landing alignment fix.
4. `/admin` area: full CRUD over campaigns with password auth (bcrypt hash in `.env`), jose session cookie, and `proxy.ts` guard. **No better-auth.**

Structure is **feature-based**. Admin lives in `src/features/admin/` and mirrors the layout of `src/features/campaign/` (`actions/`, `components/`, `lib/`, `schemas/`, `hooks/`).

## Existing structure (reference)

```
src/features/campaign/
  actions/spin.action.ts        # next-safe-action
  components/*.tsx              # client UI (wheel, spin-stage, ...)
  lib/{storage,draw,stock,availability,theme,sounds,images}.ts
  schemas/campaign.schema.ts    # zod: prize/draw/settings/theme
  hooks/use-sounds.ts
  types.ts
app/campaign/[slug]/page.tsx    # server: loadCampaign -> CampaignScreen
env.ts                          # @t3-oss/env-nextjs
```

Data on disk: `data/campaigns/<slug>/{settings,prizes,draws}.json` + `images/`.
`storage.ts` today only **reads** settings/prizes and **writes** draws (atomic tmp+rename, per-slug file lock). Admin adds the remaining write helpers.

---

## Feature 1 — Custom font (curated whitelist)

**Problem:** `next/font/google` must be imported statically at module top level; an arbitrary runtime font name cannot be loaded. Solution: import a fixed whitelist, map `settings.theme.font` → one of them.

**`src/features/campaign/lib/fonts.ts`**
- Statically import a small set of Google fonts, each with `variable`:
  `Comfortaa`, `Outfit`, `Poppins`, `Montserrat`, `Nunito`, `Fredoka`, `Baloo_2`, `Quicksand` (playful/kiosk-friendly; final list may be trimmed).
- Export:
  - `campaignFontVariables: string` — all font `.variable` classNames joined, attached once to `<html>` in `app/layout.tsx` so every `--font-*` var is defined.
  - `resolveFontVar(name?: string): string` — case-insensitive lookup by display name → that font's `var(--font-x)`; unknown/undefined → default (`var(--font-sans)` / Outfit).
  - `FONT_OPTIONS: { label: string; value: string }[]` — for the admin dropdown (value = canonical name stored in settings).

**Apply:** in `app/campaign/[slug]/page.tsx`, extend the wrapper's inline style (already `themeStyle(settings)`) with `--font-sans: resolveFontVar(settings.theme?.font)`. All descendants (wheel labels, headline via `font-sans`) inherit. No change to child components.

**Layout:** add `campaignFontVariables` to the `<html>` className list.

---

## Feature 2 — Background colour

- `themeSchema` (campaign.schema.ts) += `backgroundColor: z.string().optional()`.
- `theme.ts` `themeStyle()`: when `theme.backgroundColor` present, add `"--background": theme.backgroundColor`. Campaign root already renders `bg-background` (campaign-screen.tsx), so the override cascades to the whole kiosk surface. Foreground is left unchanged (designer picks a readable bg) — deriving contrast is out of scope.
- Editable in the admin settings form (colour input).

---

## Feature 3 — Wheel pointer/landing fix

**Current:** pointer element rendered at left / 9 o'clock (`wheel.tsx`, `top-1/2 left-0`). `landingRotation` (campaign-screen.tsx) lands the winning wedge at the **top** (`R = currentTurns*360 - center`, since `center + R ≡ 0`). Mismatch.

**Geometry:** conic gradient `from -seg/2`; wedge `i` center sits at gradient angle `i*seg`, measured clockwise from top. After CSS `rotate(R)`, its on-screen angle is `i*seg + R` clockwise from top. Left pointer = 270°. Want `i*seg + R ≡ 270 (mod 360)` ⇒ `R ≡ 270 - i*seg`.

**Change:** in `landingRotation`, add a documented `POINTER_ANGLE_DEG = 270` constant and return `currentTurns*360 - center + POINTER_ANGLE_DEG + jitter`. Keeps forward spin (several full turns). Pointer element unchanged.

**Test:** pure helper `landingRotationFor(prizeIndex, seg, currentRotation)` extracted (no jitter path or jitter injected) so the offset is unit-testable: `((center + R) mod 360)` equals `POINTER_ANGLE_DEG`.

---

## Feature 4 — Admin CRUD

Mirror `campaign` feature layout:

```
src/features/admin/
  actions/{login,logout,campaign,prizes,image,draws}.action.ts   # next-safe-action
  components/*.tsx        # forms, tables (client), dashboard chrome
  lib/{session,auth,dal}.ts
  schemas/admin.schema.ts # zod for login + campaign/prizes edit + upload
app/admin/login/page.tsx
app/admin/(dashboard)/layout.tsx        # verifySession guard + chrome
app/admin/(dashboard)/page.tsx          # dashboard: list + stats
app/admin/(dashboard)/campaigns/new/page.tsx
app/admin/(dashboard)/campaigns/[slug]/page.tsx
proxy.ts                                # root guard
scripts/hash-password.mjs
```

### 4a. Env + deps

- Deps: `bcryptjs` (pure-JS, no native build), `jose`.
- `.env`: remove `APP_PASSWORD`; add `APP_PASSWORD_HASH` (bcrypt string) and `SESSION_SECRET` (≥32 chars).
- `env.ts` server schema: `APP_PASSWORD_HASH: z.string().min(1)`, `SESSION_SECRET: z.string().min(32)`, keep `APP_URL`. Update `runtimeEnv`.
- `scripts/hash-password.mjs`: `node scripts/hash-password.mjs <password>` → prints `APP_PASSWORD_HASH=...`. Used to seed `.env` for local dev.

### 4b. Auth + session

- `lib/auth.ts`: `verifyPassword(plain: string): Promise<boolean>` = `bcrypt.compare(plain, env.APP_PASSWORD_HASH)`.
- `lib/session.ts` (`import "server-only"`): jose HS256 over `SESSION_SECRET`.
  - `createSession()` — set cookie `admin_session` (httpOnly, sameSite lax, `secure` in prod, path `/`, 7d), payload `{ role: "admin", exp }`.
  - `verifySessionOptimistic(token?)` — jose `jwtVerify`, returns payload or null (used by proxy).
  - `deleteSession()`.
- `lib/dal.ts`: `requireAdmin()` = read cookie via `next/headers`, `jwtVerify`; if invalid → `redirect("/admin/login")`. Wrapped in React `cache`. Called by guarded layout + every admin server action (defense-in-depth; proxy is only optimistic per Next docs).

### 4c. proxy.ts (root)

- `export const config = { matcher: ["/admin/:path*"] }`.
- Read `admin_session` cookie, `verifySessionOptimistic`.
- `/admin/login` + no session → allow. Authenticated on `/admin/login` → redirect `/admin`.
- Any other `/admin/*` without session → redirect `/admin/login`.
- Node runtime (Next 16 default); jose is Node-compatible.

### 4d. Write layer (extend `campaign/lib/storage.ts`)

All slug-validated (`^[a-z0-9-]+$`, reject traversal), atomic (tmp+rename), draws-mutating ops inside `withCampaignLock`:
- `saveSettings(slug, settings)` — validate via `settingsSchema`, write `settings.json`.
- `savePrizes(slug, prizes)` — validate via `prizesFileSchema`, write `prizes.json`.
- `createCampaign(slug, settings)` — reject if dir exists; mkdir dir + `images/`; write settings.json + `{ "prizes": [] }` + `{ "draws": [] }`.
- `deleteCampaign(slug)` — `fs.rm(dir, { recursive: true, force: true })`.
- `resetDraws(slug)` — write `{ "draws": [] }` (locked).
- `saveImage(slug, filename, bytes)` — sanitize filename (basename, safe charset, allowed ext png/jpg/jpeg/webp), size cap (e.g. 5 MB), write into `images/`, return stored filename.

### 4e. Server actions (`actions/*.action.ts`, next-safe-action + zod, each `requireAdmin()` first)

- `login.action.ts` — `{ password }` → `verifyPassword` → `createSession` → redirect `/admin` (no requireAdmin).
- `logout.action.ts` — `deleteSession` → redirect `/admin/login`.
- `campaign.action.ts` — `createCampaign`, `deleteCampaign`, `saveCampaignSettings` (settings+theme incl backgroundColor/font).
- `prizes.action.ts` — `savePrizes` (full prize list replace: add/edit/remove).
- `image.action.ts` — FormData upload (logo or prize image) → `saveImage`, returns filename; mime + size validated.
- `draws.action.ts` — `resetDraws`.
- `revalidatePath` on affected admin + `/campaign/[slug]` routes after writes.

### 4f. UI

- `app/admin/(dashboard)/layout.tsx`: `await requireAdmin()`, render nav (Campaigns, logout button) + children.
- **Dashboard** `page.tsx`: `listCampaigns()` + per-campaign draw count / remaining stock (reuse `computeStock`). Rows link to edit; buttons: create, delete (confirm), reset draws (confirm).
- **New** `campaigns/new/page.tsx`: form (slug + name) → `createCampaign` → redirect to edit.
- **Edit** `campaigns/[slug]/page.tsx`: server-loads campaign, renders client editors:
  - Settings+theme: name, welcomeMessage, primaryColor, secondaryColor, **backgroundColor**, **font** (dropdown `FONT_OPTIONS`), logo (upload), enabled, startAt, expiresAt, resetDelaySeconds, spinDurationSeconds.
  - Prizes editor: repeatable rows (name, weight, initialStock, color, image upload) with add/remove; single save = `savePrizes`.
  - Stats table: draws per prize, remaining stock, total draws.
  - Danger zone: reset draws, delete campaign.
- Inputs via `@base-ui/react` + existing `src/components/ui/button.tsx`. Admin styling is plain/functional (not the kiosk theme). New shared admin components live in `src/features/admin/components/`; new shadcn/base-ui form primitives may be added under `src/components/ui/` if needed.

### 4g. Stats

Derived, not stored: total draws, draws-per-prize (`draws.filter(prizeId)`), remaining stock (`computeStock`). Shown on dashboard (summary) + edit page (table).

---

## Testing (TDD)

- `landingRotationFor` → offset equals `POINTER_ANGLE_DEG` for sampled indices/seg counts.
- `resolveFontVar` → known name, case-insensitive, unknown → default.
- `themeStyle` → `--background` present only when `backgroundColor` set.
- storage writes → roundtrip in a temp dir; slug validation rejects `../` and absolute paths; `saveImage` rejects bad ext/oversize and sanitizes filename.
- `verifyPassword` → true for matching plain vs hash, false otherwise.
- session → `createSession`/`verifySessionOptimistic` roundtrip; tampered/expired token → null.
- proxy → `unstable_doesProxyMatch` includes `/admin/x`, excludes non-admin; unauthenticated `/admin` redirects, `/admin/login` allowed.

## Out of scope

- Multi-user / roles (single shared password).
- Password change UI (regenerate hash via script).
- Foreground/contrast auto-derivation from background colour.
- Arbitrary (non-whitelist) fonts.

## New deps / env

- Deps: `bcryptjs`, `jose`.
- Env: `APP_PASSWORD_HASH`, `SESSION_SECRET` (replaces `APP_PASSWORD`).
