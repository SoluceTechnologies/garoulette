# Garoulette — Font, Background, Pointer, Admin CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-campaign custom font + background colour, fix the wheel pointer/landing alignment, and build a password-protected `/admin` area with full campaign CRUD.

**Architecture:** Feature-based. Font/background/pointer changes extend the existing `src/features/campaign` feature. Admin is a new `src/features/admin` feature mirroring campaign's layout (`actions/`, `components/`, `lib/`, `schemas/`), guarded by a root `proxy.ts` and a per-action `adminAction` (next-safe-action middleware running `requireAdmin()`). All persistence stays file-based under `data/campaigns/<slug>/`.

**Tech Stack:** Next 16 (App Router, `proxy.ts`), React 19, next-safe-action v8, zod v4, `@t3-oss/env-nextjs`, `@base-ui/react`, `next/font/google`. New: `bcryptjs`, `jose`. Tests: `vitest` + `vite-tsconfig-paths`.

## Global Constraints

- Next.js is 16.2.10 — middleware file convention is **`proxy.ts`** at repo root (NOT `middleware.ts`). Function named `proxy`. Node.js runtime (default; do not set `runtime`).
- Read `node_modules/next/dist/docs/` before using unfamiliar Next APIs (per AGENTS.md — this Next differs from training data).
- Feature-based structure: admin code lives under `src/features/admin/`, mirroring `src/features/campaign/`.
- Path aliases (tsconfig): `@/*` → `src/*`, `@/env` → `env.ts`, `@/config/*` → `config/*`.
- No better-auth / no auth library beyond `bcryptjs` + `jose`. Single shared admin password; hash stored in `.env` as `APP_PASSWORD_HASH`.
- Every mutating admin server action is built from `adminAction` (auth enforced in middleware). `login`/`logout` use the base `action`.
- Atomic writes: temp file + `fs.rename`. Draws-mutating writes go through the existing `withCampaignLock`.
- Slugs must match `^[a-z0-9-]+$` (reject path traversal) everywhere a slug reaches the filesystem.
- Lint/format via Biome: run `npm run check` before each commit.
- Spec: `docs/superpowers/specs/2026-07-09-garoulette-font-bg-pointer-admin-design.md`.

---

## File Structure

**Created:**
- `vitest.config.ts` — test runner config (node env, tsconfig paths).
- `src/features/campaign/lib/fonts.ts` — font whitelist, `resolveFontVar`, `FONT_OPTIONS`.
- `src/features/campaign/lib/fonts.test.ts`
- `src/features/campaign/lib/theme.test.ts`
- `src/features/campaign/lib/landing.ts` — pure `landingRotationFor`.
- `src/features/campaign/lib/landing.test.ts`
- `src/features/campaign/lib/storage.test.ts`
- `src/features/admin/lib/auth.ts` / `auth.test.ts`
- `src/features/admin/lib/session.ts` / `session.test.ts`
- `src/features/admin/lib/dal.ts`
- `src/features/admin/lib/safe-action.ts` — `adminAction`.
- `src/features/admin/schemas/admin.schema.ts`
- `src/features/admin/actions/{login,logout,campaign,prizes,image,draws}.action.ts`
- `src/features/admin/components/{settings-form,prizes-editor,stats-table,danger-zone,logout-button,image-field}.tsx`
- `proxy.ts` (repo root)
- `scripts/hash-password.mjs`
- `app/admin/login/page.tsx`
- `app/admin/(dashboard)/layout.tsx`
- `app/admin/(dashboard)/page.tsx`
- `app/admin/(dashboard)/campaigns/new/page.tsx`
- `app/admin/(dashboard)/campaigns/[slug]/page.tsx`

**Modified:**
- `package.json` — devDeps + `test` script.
- `env.ts` — `APP_PASSWORD_HASH`, `SESSION_SECRET`.
- `.env` — replace `APP_PASSWORD`.
- `app/layout.tsx` — attach `campaignFontVariables`.
- `app/campaign/[slug]/page.tsx` — apply font var.
- `src/features/campaign/schemas/campaign.schema.ts` — `theme.backgroundColor`.
- `src/features/campaign/lib/theme.ts` — `--background`.
- `src/features/campaign/lib/storage.ts` — write helpers + `assertValidSlug`.
- `src/features/campaign/components/campaign-screen.tsx` — use `landingRotationFor`.

---

## Task 0: Test tooling (vitest)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run test:watch`. Alias resolution for `@/*`, `@/env`, `@/config/*` in tests.

- [ ] **Step 1: Install dev deps**

```bash
npm i -D vitest vite-tsconfig-paths
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    // env.ts validates env at import; skip so unit tests don't need full .env.
    env: { SKIP_ENV_VALIDATION: "true" },
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add scripts to `package.json`**

Add to `"scripts"`:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs (no tests yet)**

Run: `npm test`
Expected: exits 0 with "No test files found" (or similar); command succeeds.

- [ ] **Step 5: Commit**

```bash
npm run check
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 1: Font whitelist module

**Files:**
- Create: `src/features/campaign/lib/fonts.ts`, `src/features/campaign/lib/fonts.test.ts`

**Interfaces:**
- Produces:
  - `campaignFontVariables: string` — space-joined `next/font` variable classNames.
  - `resolveFontVar(name?: string): string` — returns `var(--font-<key>)` for a known font (case-insensitive), else `var(--font-sans)`.
  - `FONT_OPTIONS: { label: string; value: string }[]` — for admin dropdown.

- [ ] **Step 1: Write the failing test**

`src/features/campaign/lib/fonts.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { FONT_OPTIONS, resolveFontVar } from "./fonts";

describe("resolveFontVar", () => {
  it("resolves a known font by exact name", () => {
    expect(resolveFontVar("Comfortaa")).toBe("var(--font-comfortaa)");
  });

  it("is case-insensitive", () => {
    expect(resolveFontVar("comfortaa")).toBe("var(--font-comfortaa)");
  });

  it("falls back to default for unknown or missing names", () => {
    expect(resolveFontVar("NotAFont")).toBe("var(--font-sans)");
    expect(resolveFontVar(undefined)).toBe("var(--font-sans)");
  });

  it("exposes options with matching values", () => {
    const values = FONT_OPTIONS.map((o) => o.value);
    expect(values).toContain("Comfortaa");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- fonts`
Expected: FAIL — cannot resolve `./fonts`.

- [ ] **Step 3: Write `src/features/campaign/lib/fonts.ts`**

```ts
import {
  Baloo_2,
  Comfortaa,
  Fredoka,
  Montserrat,
  Nunito,
  Outfit,
  Poppins,
  Quicksand,
} from "next/font/google";

const comfortaa = Comfortaa({ subsets: ["latin"], variable: "--font-comfortaa" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-baloo" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand" });

type FontEntry = { name: string; cssVar: string; className: string };

const FONTS: FontEntry[] = [
  { name: "Comfortaa", cssVar: "--font-comfortaa", className: comfortaa.variable },
  { name: "Outfit", cssVar: "--font-outfit", className: outfit.variable },
  { name: "Poppins", cssVar: "--font-poppins", className: poppins.variable },
  { name: "Montserrat", cssVar: "--font-montserrat", className: montserrat.variable },
  { name: "Nunito", cssVar: "--font-nunito", className: nunito.variable },
  { name: "Fredoka", cssVar: "--font-fredoka", className: fredoka.variable },
  { name: "Baloo 2", cssVar: "--font-baloo", className: baloo.variable },
  { name: "Quicksand", cssVar: "--font-quicksand", className: quicksand.variable },
];

/** All font variable classNames — attach once to <html> so every var is defined. */
export const campaignFontVariables = FONTS.map((f) => f.className).join(" ");

/** Options for the admin font dropdown. */
export const FONT_OPTIONS = FONTS.map((f) => ({ label: f.name, value: f.name }));

/** Resolve a campaign font name to a CSS `var(...)`; unknown/missing → default. */
export function resolveFontVar(name?: string): string {
  if (!name) return "var(--font-sans)";
  const match = FONTS.find(
    (f) => f.name.toLowerCase() === name.toLowerCase(),
  );
  return match ? `var(${match.cssVar})` : "var(--font-sans)";
}
```

> Note: importing `next/font/google` in a vitest (node) context works because the test only calls `resolveFontVar`/`FONT_OPTIONS`; Next's font loader is transformed at build but the objects expose `.variable` strings. If vitest errors on the `next/font/google` import, add `test.server.deps.inline: ["next"]` is NOT needed — instead the test imports the module normally; Next 16 provides a node-safe stub. If it still fails, split the pure logic: keep `FONTS` name/cssVar mapping in a separate `font-map.ts` (no next/font import) and test that. Prefer the direct approach first.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- fonts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
npm run check
git add src/features/campaign/lib/fonts.ts src/features/campaign/lib/fonts.test.ts
git commit -m "feat(campaign): font whitelist + resolveFontVar"
```

---

## Task 2: Wire fonts into layout + campaign page

**Files:**
- Modify: `app/layout.tsx`, `app/campaign/[slug]/page.tsx`

**Interfaces:**
- Consumes: `campaignFontVariables`, `resolveFontVar` (Task 1); `themeStyle` (existing).

- [ ] **Step 1: Attach font variables in `app/layout.tsx`**

Add import at top:
```ts
import { campaignFontVariables } from "@/features/campaign/lib/fonts";
```
Add `campaignFontVariables` to the `<html>` `cn(...)` list (after `outfit.variable`):
```tsx
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        outfit.variable,
        campaignFontVariables,
      )}
```

- [ ] **Step 2: Apply the campaign font in `app/campaign/[slug]/page.tsx`**

Add import:
```ts
import { resolveFontVar } from "@/features/campaign/lib/fonts";
```
Change the wrapper `style` to merge the font var over `themeStyle`:
```tsx
    <div
      className="flex min-h-full flex-1"
      style={{
        ...themeStyle(settings),
        "--font-sans": resolveFontVar(settings.theme?.font),
      } as React.CSSProperties}
    >
```

- [ ] **Step 3: Verify build/typecheck**

Run: `npm run build`
Expected: build succeeds (compiles the two changed server files). If build is slow, `npx tsc --noEmit` is an acceptable faster check.

- [ ] **Step 4: Commit**

```bash
npm run check
git add app/layout.tsx app/campaign/[slug]/page.tsx
git commit -m "feat(campaign): apply per-campaign font from settings.theme.font"
```

---

## Task 3: Background colour theme override

**Files:**
- Modify: `src/features/campaign/schemas/campaign.schema.ts`, `src/features/campaign/lib/theme.ts`
- Create: `src/features/campaign/lib/theme.test.ts`

**Interfaces:**
- Produces: `themeStyle(settings)` includes `--background` iff `theme.backgroundColor` set.

- [ ] **Step 1: Add `backgroundColor` to the theme schema**

In `campaign.schema.ts`, `themeSchema`:
```ts
export const themeSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  logo: z.string().optional(),
  font: z.string().optional(),
});
```

- [ ] **Step 2: Write the failing test**

`src/features/campaign/lib/theme.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { Settings } from "../schemas/campaign.schema";
import { themeStyle } from "./theme";

const base: Settings = { name: "x" };

describe("themeStyle", () => {
  it("omits --background when no backgroundColor", () => {
    const style = themeStyle(base) as Record<string, string>;
    expect(style["--background"]).toBeUndefined();
  });

  it("sets --background when backgroundColor present", () => {
    const style = themeStyle({
      ...base,
      theme: { backgroundColor: "#101010" },
    }) as Record<string, string>;
    expect(style["--background"]).toBe("#101010");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- theme`
Expected: FAIL — `--background` undefined in second case.

- [ ] **Step 4: Update `theme.ts`**

```ts
import type { CSSProperties } from "react";
import type { Settings } from "@/features/campaign/schemas/campaign.schema";

export const DEFAULT_THEME = {
  primaryColor: "#FF6B35",
  secondaryColor: "#1A1A2E",
} as const;

export function themeStyle(settings: Settings): CSSProperties {
  const theme = settings.theme ?? {};
  const style: Record<string, string> = {
    "--primary": theme.primaryColor ?? DEFAULT_THEME.primaryColor,
    "--secondary": theme.secondaryColor ?? DEFAULT_THEME.secondaryColor,
  };
  if (theme.backgroundColor) {
    style["--background"] = theme.backgroundColor;
  }
  return style as CSSProperties;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- theme`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
npm run check
git add src/features/campaign/schemas/campaign.schema.ts src/features/campaign/lib/theme.ts src/features/campaign/lib/theme.test.ts
git commit -m "feat(campaign): per-campaign background colour"
```

---

## Task 4: Wheel pointer/landing fix

**Files:**
- Create: `src/features/campaign/lib/landing.ts`, `src/features/campaign/lib/landing.test.ts`
- Modify: `src/features/campaign/components/campaign-screen.tsx`

**Interfaces:**
- Produces: `POINTER_ANGLE_DEG = 270`; `landingRotationFor(prizeIndex, seg, currentRotation, jitter?): number`.
- Consumes: used by `campaign-screen.tsx` `landingRotation`.

- [ ] **Step 1: Write the failing test**

`src/features/campaign/lib/landing.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { POINTER_ANGLE_DEG, landingRotationFor } from "./landing";

const norm = (deg: number) => ((deg % 360) + 360) % 360;

describe("landingRotationFor", () => {
  it("lands the wedge centre at the left pointer (270deg)", () => {
    const seg = 60; // 6 prizes
    for (let i = 0; i < 6; i++) {
      const r = landingRotationFor(i, seg, 0, 0);
      // on-screen angle of wedge centre = i*seg + r
      expect(norm(i * seg + r)).toBeCloseTo(POINTER_ANGLE_DEG, 5);
    }
  });

  it("spins forward past the current rotation", () => {
    const r = landingRotationFor(0, 60, 720, 0);
    expect(r).toBeGreaterThan(720);
  });

  it("keeps jitter within half a segment", () => {
    const seg = 60;
    const r = landingRotationFor(2, seg, 0, seg * 0.3);
    const offset = norm(2 * seg + r);
    expect(Math.abs(offset - POINTER_ANGLE_DEG)).toBeLessThanOrEqual(seg * 0.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- landing`
Expected: FAIL — cannot resolve `./landing`.

- [ ] **Step 3: Write `src/features/campaign/lib/landing.ts`**

```ts
/**
 * Screen angle (clockwise from top) where the pointer sits.
 * The pointer element is rendered on the LEFT of the wheel = 9 o'clock = 270deg.
 */
export const POINTER_ANGLE_DEG = 270;

/**
 * Rotation (deg) that lands wedge `prizeIndex` under the pointer.
 *
 * Conic gradient starts `from -seg/2`, so wedge i's centre sits at gradient
 * angle `i*seg` clockwise from top. After rotating the wheel by R its centre
 * shows at `i*seg + R`. We want that to equal POINTER_ANGLE_DEG, i.e.
 * R = POINTER_ANGLE_DEG - i*seg, plus several forward turns.
 */
export function landingRotationFor(
  prizeIndex: number,
  seg: number,
  currentRotation: number,
  jitter = (Math.random() - 0.5) * seg * 0.6,
): number {
  const center = prizeIndex * seg;
  const currentTurns = Math.floor(currentRotation / 360) + 6;
  return currentTurns * 360 - center + POINTER_ANGLE_DEG + jitter;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- landing`
Expected: PASS (3 tests).

- [ ] **Step 5: Use it in `campaign-screen.tsx`**

Add import:
```ts
import { landingRotationFor } from "../lib/landing";
```
Replace the `landingRotation` callback body (lines ~72-84) with a delegation:
```tsx
  const landingRotation = useCallback(
    (prizeIndex: number) => landingRotationFor(prizeIndex, seg, rotation),
    [rotation, seg],
  );
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
npm run check
git add src/features/campaign/lib/landing.ts src/features/campaign/lib/landing.test.ts src/features/campaign/components/campaign-screen.tsx
git commit -m "fix(campaign): land winner under left pointer (270deg)"
```

---

## Task 5: Admin deps, env, password-hash script

**Files:**
- Modify: `package.json`, `env.ts`, `.env`
- Create: `scripts/hash-password.mjs`

**Interfaces:**
- Produces: `env.APP_PASSWORD_HASH: string`, `env.SESSION_SECRET: string`; `node scripts/hash-password.mjs <pw>` prints the hash line.

- [ ] **Step 1: Install deps**

```bash
npm i bcryptjs jose
npm i -D @types/bcryptjs
```

- [ ] **Step 2: Create `scripts/hash-password.mjs`**

```js
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 12);
console.log(`APP_PASSWORD_HASH=${hash}`);
```

- [ ] **Step 3: Update `env.ts`**

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    APP_URL: z.url(),
    APP_PASSWORD_HASH: z.string().min(1),
    SESSION_SECRET: z.string().min(32),
  },

  runtimeEnv: {
    APP_URL: process.env.APP_URL,
    APP_PASSWORD_HASH: process.env.APP_PASSWORD_HASH,
    SESSION_SECRET: process.env.SESSION_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
```

- [ ] **Step 4: Generate a dev hash + update `.env`**

Run (choose any dev password, e.g. `changeme123`):
```bash
node scripts/hash-password.mjs changeme123
```
Edit `.env` to (paste the hash from the command output; generate a secret with `openssl rand -base64 32`):
```
APP_URL=http://localhost:3000
APP_PASSWORD_HASH=<paste bcrypt hash here>
SESSION_SECRET=<paste `openssl rand -base64 32` output here>
```
Remove the old `APP_PASSWORD` line.

- [ ] **Step 5: Verify env loads**

Run: `SKIP_ENV_VALIDATION= node -e "process.env.APP_URL='http://localhost:3000';process.env.APP_PASSWORD_HASH='x';process.env.SESSION_SECRET='0123456789012345678901234567890123';import('@t3-oss/env-nextjs').then(()=>console.log('ok'))"`
Expected: prints `ok` (sanity that the package resolves). The real check is the app booting in later tasks.

- [ ] **Step 6: Commit (do NOT commit `.env`)**

`.env` is gitignored — confirm with `git status --short .env` showing nothing.
```bash
npm run check
git add package.json package-lock.json env.ts scripts/hash-password.mjs
git commit -m "chore(admin): add bcryptjs/jose, env hash+secret, hash-password script"
```

---

## Task 6: Password verification (`auth.ts`)

**Files:**
- Create: `src/features/admin/lib/auth.ts`, `src/features/admin/lib/auth.test.ts`

**Interfaces:**
- Produces: `verifyPassword(plain: string): Promise<boolean>`.

- [ ] **Step 1: Write the failing test**

`src/features/admin/lib/auth.test.ts`:
```ts
import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const hash = bcrypt.hashSync("s3cret-pass", 12);
    vi.stubEnv("APP_PASSWORD_HASH", hash);
    vi.stubEnv("SESSION_SECRET", "0123456789012345678901234567890123");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    const { verifyPassword } = await import("./auth");
    expect(await verifyPassword("s3cret-pass")).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const hash = bcrypt.hashSync("s3cret-pass", 12);
    vi.stubEnv("APP_PASSWORD_HASH", hash);
    vi.stubEnv("SESSION_SECRET", "0123456789012345678901234567890123");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    const { verifyPassword } = await import("./auth");
    expect(await verifyPassword("wrong")).toBe(false);
  });
});
```

> `vitest.config.ts` sets `SKIP_ENV_VALIDATION=true`, so `@/env` won't throw even though it reads `process.env` at import; the stubbed values flow through.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- auth`
Expected: FAIL — cannot resolve `./auth`.

- [ ] **Step 3: Write `src/features/admin/lib/auth.ts`**

```ts
import "server-only";
import bcrypt from "bcryptjs";
import { env } from "@/env";

/** Verify a plaintext password against the bcrypt hash in APP_PASSWORD_HASH. */
export async function verifyPassword(plain: string): Promise<boolean> {
  return bcrypt.compare(plain, env.APP_PASSWORD_HASH);
}
```

> If `server-only` makes the vitest import fail, the test imports `./auth` in a node env where `server-only` is a no-op module; if it errors, add `test.alias` mapping `"server-only"` to an empty stub in `vitest.config.ts`: `resolve: { alias: { "server-only": new URL("./test/server-only-stub.ts", import.meta.url).pathname } }` with `export {}` in that stub. Try without first.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- auth`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
npm run check
git add src/features/admin/lib/auth.ts src/features/admin/lib/auth.test.ts
git commit -m "feat(admin): verifyPassword against bcrypt hash"
```

---

## Task 7: Session (`session.ts`)

**Files:**
- Create: `src/features/admin/lib/session.ts`, `src/features/admin/lib/session.test.ts`

**Interfaces:**
- Produces:
  - `signSession(): Promise<string>` — signed JWT (role admin, 7d).
  - `verifySessionToken(token?: string): Promise<{ role: "admin" } | null>`.
  - `createSession(): Promise<void>` — sets `admin_session` cookie.
  - `deleteSession(): Promise<void>` — clears cookie.
- The token helpers are pure (no `next/headers`) so they are unit-testable; cookie helpers wrap them.

- [ ] **Step 1: Write the failing test**

`src/features/admin/lib/session.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";

const SECRET = "0123456789012345678901234567890123";

afterEach(() => vi.unstubAllEnvs());

async function load() {
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("APP_PASSWORD_HASH", "x");
  vi.stubEnv("SESSION_SECRET", SECRET);
  return import("./session");
}

describe("session token", () => {
  it("round-trips a signed session", async () => {
    const { signSession, verifySessionToken } = await load();
    const token = await signSession();
    expect(await verifySessionToken(token)).toEqual({ role: "admin" });
  });

  it("rejects a tampered token", async () => {
    const { signSession, verifySessionToken } = await load();
    const token = await signSession();
    expect(await verifySessionToken(`${token}x`)).toBeNull();
  });

  it("rejects undefined", async () => {
    const { verifySessionToken } = await load();
    expect(await verifySessionToken(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- session`
Expected: FAIL — cannot resolve `./session`.

- [ ] **Step 3: Write `src/features/admin/lib/session.ts`**

```ts
import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/env";

const COOKIE = "admin_session";
const key = new TextEncoder().encode(env.SESSION_SECRET);
const MAX_AGE_S = 7 * 24 * 60 * 60;

export async function signSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifySessionToken(
  token?: string,
): Promise<{ role: "admin" } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.role === "admin" ? { role: "admin" } : null;
  } catch {
    return null;
  }
}

export async function createSession(): Promise<void> {
  const token = await signSession();
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- session`
Expected: PASS (3 tests). (Only the pure token helpers are exercised; `next/headers` is not imported by those paths at call time, but the module imports it at top. If vitest fails to resolve `next/headers`, add `resolve.alias` for `next/headers` → a stub exporting `cookies: async () => ({ set(){}, delete(){}, get(){} })` in `vitest.config.ts`.)

- [ ] **Step 5: Commit**

```bash
npm run check
git add src/features/admin/lib/session.ts src/features/admin/lib/session.test.ts
git commit -m "feat(admin): jose-signed admin session cookie"
```

---

## Task 8: Data access layer (`dal.ts`) + `adminAction`

**Files:**
- Create: `src/features/admin/lib/dal.ts`, `src/features/admin/lib/safe-action.ts`

**Interfaces:**
- Consumes: `verifySessionToken`, `SESSION_COOKIE` (Task 7); base `action` from `@/lib/actions`.
- Produces:
  - `requireAdmin(): Promise<{ role: "admin" }>` — redirects to `/admin/login` if no valid session.
  - `adminAction` — next-safe-action client with `ctx.session`.

- [ ] **Step 1: Write `src/features/admin/lib/dal.ts`**

```ts
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Verify the admin session; redirect to login if absent/invalid. Memoised per request. */
export const requireAdmin = cache(async (): Promise<{ role: "admin" }> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) redirect("/admin/login");
  return session;
});
```

- [ ] **Step 2: Write `src/features/admin/lib/safe-action.ts`**

```ts
import { action } from "@/lib/actions";
import { requireAdmin } from "./dal";

/** Authenticated action client: enforces admin session, injects it into ctx. */
export const adminAction = action.use(async ({ next }) => {
  const session = await requireAdmin();
  return next({ ctx: { session } });
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
npm run check
git add src/features/admin/lib/dal.ts src/features/admin/lib/safe-action.ts
git commit -m "feat(admin): requireAdmin DAL + authenticated adminAction client"
```

---

## Task 9: Storage write helpers + slug validation

**Files:**
- Modify: `src/features/campaign/lib/storage.ts`
- Create: `src/features/campaign/lib/storage.test.ts`

**Interfaces:**
- Produces (all exported from `storage.ts`):
  - `assertValidSlug(slug: string): void` — throws if not `^[a-z0-9-]+$`.
  - `saveSettings(slug, settings: Settings): Promise<void>`
  - `savePrizes(slug, prizes: Prize[]): Promise<void>`
  - `createCampaign(slug, settings: Settings): Promise<void>` — rejects if exists.
  - `deleteCampaign(slug): Promise<void>`
  - `resetDraws(slug): Promise<void>`
  - `saveImage(slug, originalName: string, bytes: Buffer): Promise<string>` — returns stored filename.

- [ ] **Step 1: Write the failing test**

`src/features/campaign/lib/storage.test.ts`:
```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertValidSlug,
  campaignDir,
  createCampaign,
  deleteCampaign,
  loadCampaign,
  resetDraws,
  saveImage,
  savePrizes,
  saveSettings,
} from "./storage";

const SLUG = "__test-campaign";

afterEach(async () => {
  await fs.rm(campaignDir(SLUG), { recursive: true, force: true });
});

describe("assertValidSlug", () => {
  it("rejects traversal and bad chars", () => {
    expect(() => assertValidSlug("../evil")).toThrow();
    expect(() => assertValidSlug("Foo Bar")).toThrow();
    expect(() => assertValidSlug("ok-slug-1")).not.toThrow();
  });
});

describe("campaign write helpers", () => {
  it("creates, edits, and deletes a campaign", async () => {
    await createCampaign(SLUG, { name: "Test" });
    let c = await loadCampaign(SLUG);
    expect(c.settings.name).toBe("Test");
    expect(c.prizes).toEqual([]);

    await createCampaign(SLUG, { name: "Dup" }).catch((e) => e);
    await expect(createCampaign(SLUG, { name: "Dup" })).rejects.toThrow();

    await saveSettings(SLUG, { name: "Renamed" });
    await savePrizes(SLUG, [
      { id: "a", name: "Prize A", image: "a.webp", initialStock: 3, weight: 1 },
    ]);
    c = await loadCampaign(SLUG);
    expect(c.settings.name).toBe("Renamed");
    expect(c.prizes).toHaveLength(1);

    await deleteCampaign(SLUG);
    await expect(loadCampaign(SLUG)).rejects.toThrow();
  });

  it("resets draws", async () => {
    await createCampaign(SLUG, { name: "T" });
    const drawsFile = path.join(campaignDir(SLUG), "draws.json");
    await fs.writeFile(
      drawsFile,
      JSON.stringify({ draws: [{ id: "1", prizeId: "a", date: "2026-01-01" }] }),
    );
    await resetDraws(SLUG);
    const c = await loadCampaign(SLUG);
    expect(c.draws).toEqual([]);
  });

  it("saveImage sanitizes name, rejects bad ext", async () => {
    await createCampaign(SLUG, { name: "T" });
    const name = await saveImage(SLUG, "../My Logo!.PNG", Buffer.from("x"));
    expect(name).toMatch(/^[a-z0-9._-]+\.png$/);
    await expect(
      saveImage(SLUG, "bad.exe", Buffer.from("x")),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage`
Expected: FAIL — imports not exported.

- [ ] **Step 3: Add helpers to `storage.ts`**

Add near the top (after `campaignDir`):
```ts
const SLUG_RE = /^[a-z0-9-]+$/;

export function assertValidSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`Invalid campaign slug: ${slug}`);
  }
}

async function atomicWrite(file: string, data: string): Promise<void> {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, data, "utf8");
  await fs.rename(tmp, file);
}
```

Add these exports (bottom of file). Note imports needed at top: `Settings`, `Prize`, `prizeSchema` are in the schema; import `type Prize` and `type Settings` and `settingsSchema`, `prizesFileSchema` (already imported partially — extend the existing import):
```ts
import {
  type Draw,
  type Prize,
  type Settings,
  drawsFileSchema,
  prizesFileSchema,
  settingsSchema,
} from "@/features/campaign/schemas/campaign.schema";
```
Helpers:
```ts
export async function saveSettings(
  slug: string,
  settings: Settings,
): Promise<void> {
  assertValidSlug(slug);
  const parsed = settingsSchema.parse(settings);
  await atomicWrite(
    path.join(campaignDir(slug), "settings.json"),
    JSON.stringify(parsed, null, 2),
  );
}

export async function savePrizes(
  slug: string,
  prizes: Prize[],
): Promise<void> {
  assertValidSlug(slug);
  const parsed = prizesFileSchema.parse({ prizes });
  await atomicWrite(
    path.join(campaignDir(slug), "prizes.json"),
    JSON.stringify(parsed, null, 2),
  );
}

export async function createCampaign(
  slug: string,
  settings: Settings,
): Promise<void> {
  assertValidSlug(slug);
  const dir = campaignDir(slug);
  try {
    await fs.access(dir);
    throw new Error(`Campaign already exists: ${slug}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  await fs.mkdir(path.join(dir, "images"), { recursive: true });
  await saveSettings(slug, settings);
  await savePrizes(slug, []);
  await atomicWrite(
    path.join(dir, "draws.json"),
    JSON.stringify({ draws: [] }, null, 2),
  );
}

export async function deleteCampaign(slug: string): Promise<void> {
  assertValidSlug(slug);
  await fs.rm(campaignDir(slug), { recursive: true, force: true });
}

export async function resetDraws(slug: string): Promise<void> {
  assertValidSlug(slug);
  await withCampaignLock(slug, async () => {
    await atomicWrite(
      path.join(campaignDir(slug), "draws.json"),
      JSON.stringify({ draws: [] }, null, 2),
    );
  });
}

const ALLOWED_IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function saveImage(
  slug: string,
  originalName: string,
  bytes: Buffer,
): Promise<string> {
  assertValidSlug(slug);
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("Image too large (max 5MB)");
  }
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_IMAGE_EXT.has(ext)) {
    throw new Error(`Unsupported image type: ${ext}`);
  }
  const base = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
  const filename = `${base}${ext}`;
  await fs.mkdir(path.join(campaignDir(slug), "images"), { recursive: true });
  await atomicWrite(
    path.join(campaignDir(slug), "images", filename),
    // atomicWrite expects string; write buffer directly instead:
    "",
  );
  await fs.writeFile(path.join(campaignDir(slug), "images", filename), bytes);
  return filename;
}
```

> Fix the `saveImage` body: do NOT call `atomicWrite("")` (that truncates). Replace those two lines with a single atomic buffer write:
```ts
  const dest = path.join(campaignDir(slug), "images", filename);
  const tmp = `${dest}.tmp`;
  await fs.writeFile(tmp, bytes);
  await fs.rename(tmp, dest);
  return filename;
```
Use this corrected version (remove the `atomicWrite("")` + trailing `writeFile`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage`
Expected: PASS (4 tests). Confirm no `__test-campaign` dir remains: `ls data/campaigns/ | grep __test` → empty.

- [ ] **Step 5: Commit**

```bash
npm run check
git add src/features/campaign/lib/storage.ts src/features/campaign/lib/storage.test.ts
git commit -m "feat(campaign): campaign write helpers (settings/prizes/create/delete/reset/image)"
```

---

## Task 10: proxy.ts guard

**Files:**
- Create: `proxy.ts`
- Create: `src/features/admin/lib/proxy-config.test.ts` (matcher assertion)

**Interfaces:**
- Consumes: `verifySessionToken`, `SESSION_COOKIE`.
- Produces: root `proxy` guarding `/admin/:path*`.

- [ ] **Step 1: Read the proxy docs (required)**

Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (matcher + cookies sections). Confirms: file at repo root, exported `proxy` fn, `config.matcher`, cookies via `request.cookies.get`.

- [ ] **Step 2: Write `proxy.ts`**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/features/admin/lib/session";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (isLogin) {
    if (session) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}
```

> `session.ts` imports `server-only` and `next/headers`; proxy runs in the Node runtime (Next 16 default) so these resolve, but importing `next/headers` cookies into proxy is fine because proxy only calls `verifySessionToken` (pure). If bundling complains about `server-only` in proxy, split the pure token helpers (`signSession`/`verifySessionToken` + `SESSION_COOKIE`) into `src/features/admin/lib/session-token.ts` (no `server-only`, no `next/headers`) and re-export them from `session.ts`; import proxy + tests from `session-token.ts`. Prefer the direct import first; apply the split only if the build errors.

- [ ] **Step 3: Write the matcher test**

`src/features/admin/lib/proxy-config.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { config } from "../../../../proxy";

describe("proxy matcher", () => {
  it("guards /admin paths only", () => {
    expect(config.matcher).toContain("/admin/:path*");
  });
});
```

> If importing `proxy.ts` pulls `next/server` and fails in vitest, instead assert the matcher by importing a small constant: move `export const config = { matcher: ["/admin/:path*"] }` is already static — if the import fails, change the test to read the file text: `import { readFileSync } from "node:fs"; expect(readFileSync("proxy.ts","utf8")).toContain('/admin/:path*')`. Prefer the direct import first.

- [ ] **Step 4: Run test**

Run: `npm test -- proxy-config`
Expected: PASS.

- [ ] **Step 5: Verify build wires proxy**

Run: `npm run build`
Expected: build succeeds and output mentions a Proxy/Middleware entry (Next logs it). No runtime errors.

- [ ] **Step 6: Commit**

```bash
npm run check
git add proxy.ts src/features/admin/lib/proxy-config.test.ts
git commit -m "feat(admin): proxy.ts guarding /admin routes"
```

---

## Task 11: Admin schemas + login/logout actions + login page

**Files:**
- Create: `src/features/admin/schemas/admin.schema.ts`
- Create: `src/features/admin/actions/login.action.ts`, `src/features/admin/actions/logout.action.ts`
- Create: `app/admin/login/page.tsx`
- Create: `src/features/admin/components/login-form.tsx`

**Interfaces:**
- Consumes: `verifyPassword`, `createSession`, `deleteSession`, base `action`.
- Produces: `loginAction`, `logoutAction`; login page at `/admin/login`.

- [ ] **Step 1: Write `admin.schema.ts`**

```ts
import { z } from "zod";
import {
  prizeSchema,
  settingsSchema,
} from "@/features/campaign/schemas/campaign.schema";

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and hyphens only");

export const createCampaignSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
});

export const saveSettingsSchema = z.object({
  slug: slugSchema,
  settings: settingsSchema,
});

export const savePrizesSchema = z.object({
  slug: slugSchema,
  prizes: z.array(prizeSchema),
});

export const slugOnlySchema = z.object({ slug: slugSchema });
```

- [ ] **Step 2: Write `login.action.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { action } from "@/lib/actions";
import { verifyPassword } from "../lib/auth";
import { createSession } from "../lib/session";
import { loginSchema } from "../schemas/admin.schema";

export const loginAction = action
  .inputSchema(loginSchema)
  .action(async ({ parsedInput: { password } }) => {
    const ok = await verifyPassword(password);
    if (!ok) throw new Error("Invalid password");
    await createSession();
    redirect("/admin");
  });
```

- [ ] **Step 3: Write `logout.action.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { action } from "@/lib/actions";
import { deleteSession } from "../lib/session";

export const logoutAction = action.action(async () => {
  await deleteSession();
  redirect("/admin/login");
});
```

- [ ] **Step 4: Write `login-form.tsx`**

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction } from "../actions/login.action";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const { execute, isPending, result } = useAction(loginAction);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        execute({ password });
      }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 p-8"
    >
      <h1 className="font-bold text-2xl">Admin</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="rounded-md border border-border px-3 py-2"
        autoFocus
      />
      {result?.serverError && (
        <p className="text-destructive text-sm">{result.serverError}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "…" : "Log in"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Write `app/admin/login/page.tsx`**

```tsx
import { LoginForm } from "@/features/admin/components/login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center">
      <LoginForm />
    </main>
  );
}
```

- [ ] **Step 6: Manual verify (login flow)**

Run: `npm run dev`, open `http://localhost:3000/admin` → redirected to `/admin/login`. Enter the dev password (from Task 5). Expected: redirect to `/admin` (will 404 until Task 12 — that's fine; confirm the URL changes to `/admin` and the session cookie `admin_session` is set in devtools). Wrong password shows "Invalid password".

- [ ] **Step 7: Commit**

```bash
npm run check
git add src/features/admin/schemas/admin.schema.ts src/features/admin/actions/login.action.ts src/features/admin/actions/logout.action.ts src/features/admin/components/login-form.tsx app/admin/login/page.tsx
git commit -m "feat(admin): login/logout actions + login page"
```

---

## Task 12: Admin dashboard (layout + list + stats + row actions)

**Files:**
- Create: `app/admin/(dashboard)/layout.tsx`
- Create: `app/admin/(dashboard)/page.tsx`
- Create: `src/features/admin/actions/campaign.action.ts`
- Create: `src/features/admin/actions/draws.action.ts`
- Create: `src/features/admin/components/logout-button.tsx`
- Create: `src/features/admin/components/campaign-row-actions.tsx`
- Create: `src/features/admin/lib/stats.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `adminAction`, `listCampaigns`, `loadCampaign`, `computeStock`, `deleteCampaign`, `resetDraws`, `logoutAction`.
- Produces: `deleteCampaignAction`, `resetDrawsAction`, `createCampaignAction`, `saveSettingsAction`; `campaignStats(slug)`.

- [ ] **Step 1: Write `src/features/admin/lib/stats.ts`**

```ts
import { computeStock } from "@/features/campaign/lib/stock";
import { loadCampaign } from "@/features/campaign/lib/storage";

export type PrizeStat = {
  id: string;
  name: string;
  initialStock: number;
  drawn: number;
  remaining: number;
};

export type CampaignStats = {
  totalDraws: number;
  prizes: PrizeStat[];
};

export async function campaignStats(slug: string): Promise<CampaignStats> {
  const { prizes, draws } = await loadCampaign(slug);
  const stock = computeStock(prizes, draws);
  return {
    totalDraws: draws.length,
    prizes: prizes.map((p) => {
      const drawn = draws.filter((d) => d.prizeId === p.id).length;
      const s = stock.find((x) => x.id === p.id);
      return {
        id: p.id,
        name: p.name,
        initialStock: p.initialStock,
        drawn,
        remaining: s ? p.initialStock - drawn : p.initialStock - drawn,
      };
    }),
  };
}
```

> `computeStock` returns entries with `id` and `effectiveWeight`; remaining is derived from `initialStock - drawn` (matches `drawAndCommit`). Verify the field name by reading `src/features/campaign/lib/stock.ts` before writing; adjust `.id` if the property differs.

- [ ] **Step 2: Write `campaign.action.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCampaign,
  deleteCampaign,
  saveSettings,
} from "@/features/campaign/lib/storage";
import { adminAction } from "../lib/safe-action";
import {
  createCampaignSchema,
  saveSettingsSchema,
  slugOnlySchema,
} from "../schemas/admin.schema";

export const createCampaignAction = adminAction
  .inputSchema(createCampaignSchema)
  .action(async ({ parsedInput: { slug, name } }) => {
    await createCampaign(slug, { name });
    redirect(`/admin/campaigns/${slug}`);
  });

export const saveSettingsAction = adminAction
  .inputSchema(saveSettingsSchema)
  .action(async ({ parsedInput: { slug, settings } }) => {
    await saveSettings(slug, settings);
    revalidatePath(`/admin/campaigns/${slug}`);
    revalidatePath(`/campaign/${slug}`);
    return { ok: true };
  });

export const deleteCampaignAction = adminAction
  .inputSchema(slugOnlySchema)
  .action(async ({ parsedInput: { slug } }) => {
    await deleteCampaign(slug);
    revalidatePath("/admin");
    redirect("/admin");
  });
```

- [ ] **Step 3: Write `draws.action.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { resetDraws } from "@/features/campaign/lib/storage";
import { adminAction } from "../lib/safe-action";
import { slugOnlySchema } from "../schemas/admin.schema";

export const resetDrawsAction = adminAction
  .inputSchema(slugOnlySchema)
  .action(async ({ parsedInput: { slug } }) => {
    await resetDraws(slug);
    revalidatePath(`/admin/campaigns/${slug}`);
    revalidatePath("/admin");
    revalidatePath(`/campaign/${slug}`);
    return { ok: true };
  });
```

- [ ] **Step 4: Write `logout-button.tsx`**

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { logoutAction } from "../actions/logout.action";

export function LogoutButton() {
  const { execute, isPending } = useAction(logoutAction);
  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => execute()}
    >
      Log out
    </Button>
  );
}
```

- [ ] **Step 5: Write `campaign-row-actions.tsx`**

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { deleteCampaignAction } from "../actions/campaign.action";
import { resetDrawsAction } from "../actions/draws.action";

export function CampaignRowActions({ slug }: { slug: string }) {
  const del = useAction(deleteCampaignAction);
  const reset = useAction(resetDrawsAction);
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={reset.isPending}
        onClick={() => {
          if (confirm(`Reset draws for "${slug}"?`)) reset.execute({ slug });
        }}
      >
        Reset draws
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={del.isPending}
        onClick={() => {
          if (confirm(`Delete campaign "${slug}"? This cannot be undone.`))
            del.execute({ slug });
        }}
      >
        Delete
      </Button>
    </div>
  );
}
```

> `Button` variants: confirm `variant="destructive"` and `variant="outline"` exist in `src/components/ui/button.tsx` before writing; if not, use the available variants (read the file) or omit the prop.

- [ ] **Step 6: Write `app/admin/(dashboard)/layout.tsx`**

```tsx
import Link from "next/link";
import { requireAdmin } from "@/features/admin/lib/dal";
import { LogoutButton } from "@/features/admin/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-border border-b px-6 py-4">
        <Link href="/admin" className="font-bold text-lg">
          Garoulette Admin
        </Link>
        <LogoutButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 7: Write `app/admin/(dashboard)/page.tsx`**

```tsx
import Link from "next/link";
import { CampaignRowActions } from "@/features/admin/components/campaign-row-actions";
import { campaignStats } from "@/features/admin/lib/stats";
import { listCampaigns } from "@/features/campaign/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const campaigns = await listCampaigns();
  const withStats = await Promise.all(
    campaigns.map(async (c) => ({
      ...c,
      stats: await campaignStats(c.slug),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Campaigns</h1>
        <Link
          href="/admin/campaigns/new"
          className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          New campaign
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {withStats.map((c) => (
          <li
            key={c.slug}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div>
              <Link
                href={`/admin/campaigns/${c.slug}`}
                className="font-semibold text-lg underline"
              >
                {c.name}
              </Link>
              <p className="text-muted-foreground text-sm">
                {c.slug} · {c.prizeCount} prizes · {c.stats.totalDraws} draws ·{" "}
                {c.availability}
              </p>
            </div>
            <CampaignRowActions slug={c.slug} />
          </li>
        ))}
        {withStats.length === 0 && (
          <li className="text-muted-foreground">No campaigns yet.</li>
        )}
      </ul>
    </div>
  );
}
```

- [ ] **Step 8: Manual verify**

Run: `npm run dev`, log in, land on `/admin`. Expected: campaign list shows the `demo` campaign with prize/draw counts; New campaign button visible; Log out returns to `/admin/login`.

- [ ] **Step 9: Commit**

```bash
npm run check
git add "app/admin/(dashboard)/layout.tsx" "app/admin/(dashboard)/page.tsx" src/features/admin/actions/campaign.action.ts src/features/admin/actions/draws.action.ts src/features/admin/components/logout-button.tsx src/features/admin/components/campaign-row-actions.tsx src/features/admin/lib/stats.ts
git commit -m "feat(admin): dashboard with list, stats, delete/reset actions"
```

---

## Task 13: New-campaign page

**Files:**
- Create: `app/admin/(dashboard)/campaigns/new/page.tsx`
- Create: `src/features/admin/components/new-campaign-form.tsx`

**Interfaces:**
- Consumes: `createCampaignAction`.

- [ ] **Step 1: Write `new-campaign-form.tsx`**

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createCampaignAction } from "../actions/campaign.action";

export function NewCampaignForm() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const { execute, isPending, result } = useAction(createCampaignAction);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        execute({ slug, name });
      }}
      className="flex max-w-md flex-col gap-4"
    >
      <label className="flex flex-col gap-1">
        <span className="font-medium text-sm">Slug</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-campaign"
          className="rounded-md border border-border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-medium text-sm">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Campaign"
          className="rounded-md border border-border px-3 py-2"
        />
      </label>
      {result?.serverError && (
        <p className="text-destructive text-sm">{result.serverError}</p>
      )}
      {result?.validationErrors && (
        <p className="text-destructive text-sm">Check slug/name format.</p>
      )}
      <Button type="submit" disabled={isPending}>
        Create
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Write `app/admin/(dashboard)/campaigns/new/page.tsx`**

```tsx
import { NewCampaignForm } from "@/features/admin/components/new-campaign-form";

export const dynamic = "force-dynamic";

export default function NewCampaignPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl">New campaign</h1>
      <NewCampaignForm />
    </div>
  );
}
```

- [ ] **Step 3: Manual verify**

Run dev, `/admin/campaigns/new`, create `test-camp` / "Test Camp". Expected: redirect to `/admin/campaigns/test-camp`; `data/campaigns/test-camp/` created with settings/prizes/draws + images dir. Delete it afterward via dashboard.

- [ ] **Step 4: Commit**

```bash
npm run check
git add "app/admin/(dashboard)/campaigns/new/page.tsx" src/features/admin/components/new-campaign-form.tsx
git commit -m "feat(admin): create-campaign page"
```

---

## Task 14: Image upload action + field

**Files:**
- Create: `src/features/admin/actions/image.action.ts`
- Create: `src/features/admin/components/image-field.tsx`

**Interfaces:**
- Consumes: `saveImage`, `adminAction`.
- Produces: `uploadImageAction` (FormData → `{ filename }`); `<ImageField slug value onChange />`.

- [ ] **Step 1: Write `image.action.ts`**

```ts
"use server";

import { z } from "zod";
import { saveImage } from "@/features/campaign/lib/storage";
import { adminAction } from "../lib/safe-action";
import { slugSchema } from "../schemas/admin.schema";

const uploadSchema = z.object({
  slug: slugSchema,
  file: z.instanceof(File),
});

export const uploadImageAction = adminAction
  .inputSchema(uploadSchema)
  .action(async ({ parsedInput: { slug, file } }) => {
    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = await saveImage(slug, file.name, bytes);
    return { filename };
  });
```

> next-safe-action v8 supports `File`/FormData inputs when the action is called with a `FormData` or plain object containing a `File`. Read `node_modules/next-safe-action` README if the `z.instanceof(File)` input rejects; the fallback is a plain Route Handler `app/admin/api/upload/route.ts` doing `requireAdmin()` + `saveImage`. Prefer the action first.

- [ ] **Step 2: Write `image-field.tsx`**

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { uploadImageAction } from "../actions/image.action";

type Props = {
  slug: string;
  value?: string;
  onChange: (filename: string) => void;
  label: string;
};

export function ImageField({ slug, value, onChange, label }: Props) {
  const { execute, isPending } = useAction(uploadImageAction, {
    onSuccess: ({ data }) => {
      if (data?.filename) onChange(data.filename);
    },
  });

  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium text-sm">{label}</span>
      {value && <span className="text-muted-foreground text-xs">{value}</span>}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) execute({ slug, file });
        }}
      />
      {isPending && <span className="text-xs">Uploading…</span>}
    </label>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
npm run check
git add src/features/admin/actions/image.action.ts src/features/admin/components/image-field.tsx
git commit -m "feat(admin): image upload action + field"
```

---

## Task 15: Prizes editor + save action

**Files:**
- Create: `src/features/admin/actions/prizes.action.ts`
- Create: `src/features/admin/components/prizes-editor.tsx`

**Interfaces:**
- Consumes: `savePrizes`, `adminAction`, `ImageField`, `Prize` type.
- Produces: `savePrizesAction`; `<PrizesEditor slug prizes />`.

- [ ] **Step 1: Write `prizes.action.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { savePrizes } from "@/features/campaign/lib/storage";
import { adminAction } from "../lib/safe-action";
import { savePrizesSchema } from "../schemas/admin.schema";

export const savePrizesAction = adminAction
  .inputSchema(savePrizesSchema)
  .action(async ({ parsedInput: { slug, prizes } }) => {
    await savePrizes(slug, prizes);
    revalidatePath(`/admin/campaigns/${slug}`);
    revalidatePath(`/campaign/${slug}`);
    return { ok: true };
  });
```

- [ ] **Step 2: Write `prizes-editor.tsx`**

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Prize } from "@/features/campaign/schemas/campaign.schema";
import { savePrizesAction } from "../actions/prizes.action";
import { ImageField } from "./image-field";

function emptyPrize(): Prize {
  return {
    id: crypto.randomUUID(),
    name: "",
    image: "",
    initialStock: 0,
    weight: 1,
  };
}

export function PrizesEditor({
  slug,
  prizes: initial,
}: {
  slug: string;
  prizes: Prize[];
}) {
  const [prizes, setPrizes] = useState<Prize[]>(initial);
  const { execute, isPending, result } = useAction(savePrizesAction);

  const update = (i: number, patch: Partial<Prize>) =>
    setPrizes((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-xl">Prizes</h2>
      <div className="flex flex-col gap-4">
        {prizes.map((p, i) => (
          <div
            key={p.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
          >
            <label className="flex flex-col gap-1">
              <span className="text-sm">Name</span>
              <input
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Colour</span>
              <input
                type="color"
                value={p.color ?? "#888888"}
                onChange={(e) => update(i, { color: e.target.value })}
                className="h-10 w-20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Initial stock</span>
              <input
                type="number"
                min={0}
                value={p.initialStock}
                onChange={(e) =>
                  update(i, { initialStock: Number(e.target.value) })
                }
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Weight</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={p.weight}
                onChange={(e) => update(i, { weight: Number(e.target.value) })}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <ImageField
              slug={slug}
              value={p.image}
              label="Image"
              onChange={(filename) => update(i, { image: filename })}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setPrizes((ps) => ps.filter((_, idx) => idx !== i))
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPrizes((ps) => [...ps, emptyPrize()])}
        >
          Add prize
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => execute({ slug, prizes })}
        >
          Save prizes
        </Button>
      </div>
      {result?.serverError && (
        <p className="text-destructive text-sm">{result.serverError}</p>
      )}
      {result?.data?.ok && <p className="text-sm">Saved.</p>}
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
npm run check
git add src/features/admin/actions/prizes.action.ts src/features/admin/components/prizes-editor.tsx
git commit -m "feat(admin): prizes editor + save action"
```

---

## Task 16: Settings form + stats table + danger zone + edit page

**Files:**
- Create: `src/features/admin/components/settings-form.tsx`
- Create: `src/features/admin/components/stats-table.tsx`
- Create: `src/features/admin/components/danger-zone.tsx`
- Create: `app/admin/(dashboard)/campaigns/[slug]/page.tsx`

**Interfaces:**
- Consumes: `saveSettingsAction`, `deleteCampaignAction`, `resetDrawsAction`, `ImageField`, `PrizesEditor`, `FONT_OPTIONS`, `campaignStats`, `loadCampaign`, `Settings` type.

- [ ] **Step 1: Write `settings-form.tsx`**

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FONT_OPTIONS } from "@/features/campaign/lib/fonts";
import type { Settings } from "@/features/campaign/schemas/campaign.schema";
import { saveSettingsAction } from "../actions/campaign.action";
import { ImageField } from "./image-field";

export function SettingsForm({
  slug,
  settings: initial,
}: {
  slug: string;
  settings: Settings;
}) {
  const [s, setS] = useState<Settings>(initial);
  const theme = s.theme ?? {};
  const { execute, isPending, result } = useAction(saveSettingsAction);
  const setTheme = (patch: Partial<NonNullable<Settings["theme"]>>) =>
    setS((prev) => ({ ...prev, theme: { ...prev.theme, ...patch } }));

  const text = (v?: string) => v ?? "";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-xl">Settings</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Name</span>
          <input
            value={s.name}
            onChange={(e) => setS({ ...s, name: e.target.value })}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Welcome message</span>
          <input
            value={text(s.welcomeMessage)}
            onChange={(e) => setS({ ...s, welcomeMessage: e.target.value })}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Primary colour</span>
          <input
            type="color"
            value={text(theme.primaryColor) || "#ff6b35"}
            onChange={(e) => setTheme({ primaryColor: e.target.value })}
            className="h-10 w-20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Secondary colour</span>
          <input
            type="color"
            value={text(theme.secondaryColor) || "#1a1a2e"}
            onChange={(e) => setTheme({ secondaryColor: e.target.value })}
            className="h-10 w-20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Background colour</span>
          <input
            type="color"
            value={text(theme.backgroundColor) || "#ffffff"}
            onChange={(e) => setTheme({ backgroundColor: e.target.value })}
            className="h-10 w-20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Font</span>
          <select
            value={text(theme.font)}
            onChange={(e) => setTheme({ font: e.target.value })}
            className="rounded-md border border-border px-3 py-2"
          >
            <option value="">Default</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <ImageField
          slug={slug}
          value={theme.logo}
          label="Logo"
          onChange={(filename) => setTheme({ logo: filename })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={s.enabled ?? true}
            onChange={(e) => setS({ ...s, enabled: e.target.checked })}
          />
          <span className="text-sm">Enabled</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Start at (ISO, optional)</span>
          <input
            value={text(s.startAt)}
            onChange={(e) =>
              setS({ ...s, startAt: e.target.value || undefined })
            }
            placeholder="2026-07-10T09:00:00Z"
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Expires at (ISO, optional)</span>
          <input
            value={text(s.expiresAt)}
            onChange={(e) =>
              setS({ ...s, expiresAt: e.target.value || undefined })
            }
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Reset delay (s)</span>
          <input
            type="number"
            min={1}
            value={s.resetDelaySeconds ?? 6}
            onChange={(e) =>
              setS({ ...s, resetDelaySeconds: Number(e.target.value) })
            }
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Spin duration (s)</span>
          <input
            type="number"
            min={1}
            step="0.5"
            value={s.spinDurationSeconds ?? 4.5}
            onChange={(e) =>
              setS({ ...s, spinDurationSeconds: Number(e.target.value) })
            }
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
      </div>
      <div>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => execute({ slug, settings: s })}
        >
          Save settings
        </Button>
      </div>
      {result?.serverError && (
        <p className="text-destructive text-sm">{result.serverError}</p>
      )}
      {result?.data?.ok && <p className="text-sm">Saved.</p>}
    </section>
  );
}
```

- [ ] **Step 2: Write `stats-table.tsx`**

```tsx
import type { CampaignStats } from "@/features/admin/lib/stats";

export function StatsTable({ stats }: { stats: CampaignStats }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold text-xl">Stats</h2>
      <p className="text-muted-foreground text-sm">
        Total draws: {stats.totalDraws}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-border border-b text-left">
              <th className="py-2 pr-4">Prize</th>
              <th className="py-2 pr-4">Initial</th>
              <th className="py-2 pr-4">Drawn</th>
              <th className="py-2 pr-4">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {stats.prizes.map((p) => (
              <tr key={p.id} className="border-border/60 border-b">
                <td className="py-2 pr-4">{p.name}</td>
                <td className="py-2 pr-4">{p.initialStock}</td>
                <td className="py-2 pr-4">{p.drawn}</td>
                <td className="py-2 pr-4">{p.remaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write `danger-zone.tsx`**

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { deleteCampaignAction } from "../actions/campaign.action";
import { resetDrawsAction } from "../actions/draws.action";

export function DangerZone({ slug }: { slug: string }) {
  const reset = useAction(resetDrawsAction);
  const del = useAction(deleteCampaignAction);
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-destructive/40 p-4">
      <h2 className="font-bold text-destructive text-xl">Danger zone</h2>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={reset.isPending}
          onClick={() => {
            if (confirm("Reset all draws (restore full stock)?"))
              reset.execute({ slug });
          }}
        >
          Reset draws
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={del.isPending}
          onClick={() => {
            if (confirm(`Delete "${slug}"? This cannot be undone.`))
              del.execute({ slug });
          }}
        >
          Delete campaign
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write `app/admin/(dashboard)/campaigns/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { DangerZone } from "@/features/admin/components/danger-zone";
import { PrizesEditor } from "@/features/admin/components/prizes-editor";
import { SettingsForm } from "@/features/admin/components/settings-form";
import { StatsTable } from "@/features/admin/components/stats-table";
import { campaignStats } from "@/features/admin/lib/stats";
import { loadCampaign } from "@/features/campaign/lib/storage";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
}: PageProps<"/admin/campaigns/[slug]">) {
  const { slug } = await params;
  let campaign: Awaited<ReturnType<typeof loadCampaign>>;
  try {
    campaign = await loadCampaign(slug);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw err;
  }
  const stats = await campaignStats(slug);

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <h1 className="font-bold text-2xl">{campaign.settings.name}</h1>
      <SettingsForm slug={slug} settings={campaign.settings} />
      <PrizesEditor slug={slug} prizes={campaign.prizes} />
      <StatsTable stats={stats} />
      <DangerZone slug={slug} />
    </div>
  );
}
```

> `PageProps<"/admin/campaigns/[slug]">` is the Next 16 typed-routes helper (same pattern as `app/campaign/[slug]/page.tsx`). If typegen hasn't produced it yet, run `npm run build` once to generate `.next/types`, or type params inline as `{ params: Promise<{ slug: string }> }`.

- [ ] **Step 5: Manual verify (full CRUD)**

Run dev, log in. On `/admin/campaigns/demo`: change background colour + font + a prize name, upload an image, Save. Open `/campaign/demo` → font/background/prize reflect changes; wheel pointer on left lands the winning wedge under the left arrow. Reset draws → stock restored. Create + delete a throwaway campaign.

- [ ] **Step 6: Commit**

```bash
npm run check
git add src/features/admin/components/settings-form.tsx src/features/admin/components/stats-table.tsx src/features/admin/components/danger-zone.tsx "app/admin/(dashboard)/campaigns/[slug]/page.tsx"
git commit -m "feat(admin): campaign edit page (settings, prizes, stats, danger zone)"
```

---

## Task 17: Full regression pass

**Files:** none (verification).

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all tests pass (fonts, theme, landing, storage, auth, session, proxy-config).

- [ ] **Step 2: Lint + build**

Run: `npm run check && npm run build`
Expected: no lint errors; production build succeeds, Proxy entry present.

- [ ] **Step 3: Smoke the kiosk + admin end-to-end**

Run: `npm run dev`. Verify: `/` landing; `/campaign/demo` spins and lands under left pointer with custom font + background; `/admin` requires login, CRUD works, logout clears session.

- [ ] **Step 4: Final commit (if any lint fixups)**

```bash
git add -A
git commit -m "chore: regression fixups" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage:** Font (T1–T2), background (T3), pointer (T4), admin deps/env (T5), auth (T6), session (T7), DAL+adminAction (T8), storage writes+images (T9), proxy (T10), login (T11), dashboard+stats+delete/reset (T12), create (T13), image upload (T14), prizes (T15), settings+edit page (T16), regression (T17). All spec sections mapped.
- **adminAction:** defined once (T8), consumed by every mutating action (T12–T16); login/logout use base `action` (T11).
- **Type consistency:** `saveImage(slug, originalName, bytes)`, `savePrizes(slug, prizes)`, `saveSettings(slug, settings)`, `SESSION_COOKIE`, `verifySessionToken` names are used identically across tasks.
- **Fallbacks flagged** where a library/runtime edge could bite (next/font in vitest, server-only/next-headers in vitest, next-safe-action File input, typed routes) — each with a concrete first-choice + fallback.
```
