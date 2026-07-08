# Garoulette Public Wheel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public, kiosk-facing prize wheel: pick a campaign, spin, win a weighted prize (server-authoritative), confetti, auto-reset. File-based, no DB, no auth.

**Architecture:** A Server Component reads a campaign's JSON files from a mounted `data/` volume and renders a full-screen client wheel. Spinning calls a `next-safe-action` server action that draws + journals the win **under a per-campaign lock with an atomic file write**, then returns the winning segment index; the client animates the wheel to that segment. Pure draw/stock logic is isolated from I/O.

**Tech Stack:** Next.js 16.2.10 (App Router, React 19), TypeScript, Tailwind v4 + `cn()`, `next-safe-action` v8, Zod v4, `canvas-confetti`.

## Global Constraints

- **This is a newer Next.js (16.2.10) than training data.** Read `node_modules/next/dist/docs/` before writing framework code. `params` in pages and route handlers is a **Promise** — always `await` it. `PageProps<'/route'>` and `RouteContext<'/route'>` are global helpers (generated during dev/build).
- All code, identifiers, JSON keys, and UI copy are in **English**.
- No database, no auth, **no automated tests** in this spec (verify manually).
- Branding must be **runtime**, never `NEXT_PUBLIC_*`. Dynamic colors flow through CSS variables (`--primary`, `--secondary`), not build-time Tailwind classes.
- Data lives under `data/campaigns/<slug>/` (a Docker volume), **outside** `public/`.
- `next-safe-action` v8 API: `action.inputSchema(zodSchema).action(async ({ parsedInput }) => …)`.
- Draw is **server-authoritative**: draw + journal happen together inside the campaign lock. Never draw on the client.
- Path aliases (from `tsconfig.json`): `@/*` → `src/*`, `@/env`, `@/config/*`.
- **Feature-based architecture.** All campaign-domain code lives under `src/features/campaign/` (`types.ts`, `lib/`, `components/`, `actions/`, `index.ts`). Shared-only code stays outside: `src/lib/utils.ts` (`cn`), `src/lib/actions.ts` (safe-action client), `src/components/ui/` (shadcn). Inside the feature, use **relative** imports (`../types`, `./wheel`). App code (`app/**`) imports domain via the `@/features/campaign` barrel.
- **Barrel is server/domain only.** `@/features/campaign/index.ts` re-exports `types` + `lib/*` (including `storage`, which imports `node:fs`). A `"use client"` file must therefore NEVER import from the barrel — client components import sibling feature files by relative path (`./wheel`, `../actions/spin`). Server Components may use the barrel freely; they import the client `CampaignScreen` by its direct path.

## Per-task verification (no test framework)

Every task ends with:
- `pnpm exec tsc --noEmit` → Expected: no errors.
- `pnpm exec biome check --write .` → Expected: no remaining errors.
- Then `git add` + `git commit`.

Tasks with runtime UI additionally give explicit manual `pnpm dev` checks.

## File Structure

**Created:**
- `.env` — local dev env (`APP_URL`, `APP_PASSWORD`); gitignored.
- `src/features/campaign/types.ts` — Zod schemas + inferred types.
- `src/features/campaign/lib/stock.ts` — `computeStock` (pure).
- `src/features/campaign/lib/draw.ts` — `drawPrize` (pure weighted pick).
- `src/features/campaign/lib/images.ts` — `prizeImageUrl` (pure path helper).
- `src/features/campaign/lib/theme.ts` — `themeStyle` + default theme.
- `src/features/campaign/lib/storage.ts` — I/O: paths, `listCampaigns`, `loadCampaign`, `drawAndCommit` (lock + atomic write).
- `src/features/campaign/index.ts` — barrel: server/domain public API (types + lib). NOT the components.
- `src/features/campaign/actions/spin.ts` — `spinAction` server action.
- `src/features/campaign/components/confetti.ts` — `fireConfetti`.
- `src/features/campaign/components/wheel.tsx` — presentational rotating wheel (client).
- `src/features/campaign/components/campaign-screen.tsx` — state machine + spin orchestration (client).
- `app/campaign/[slug]/page.tsx` — kiosk RSC.
- `app/campaign/[slug]/error.tsx` — error screen (client).
- `app/campaign/[slug]/images/[...file]/route.ts` — serve campaign images from the volume.
- `data/campaigns/demo/{settings,prizes,draws}.json` + `images/` — seed campaign for manual verification.
- `public/logo.png` (+ `@2x`, `@3x`) — app logos.

**Modified:**
- `package.json` — add `dev` script; add deps.
- `src/lib/actions.ts` — replace broken auth stub with a plain action client.
- `app/page.tsx` — replace default template with the operator home (campaign list).
- `app/layout.tsx` — fix metadata (title/description).

---

### Task 1: Project bootstrap (dev script, env, deps, action client, metadata)

**Files:**
- Modify: `package.json`
- Create: `.env`
- Modify: `src/lib/actions.ts`
- Modify: `app/layout.tsx:18-21` (metadata)

**Interfaces:**
- Produces: `action` (a `next-safe-action` client with no auth) exported from `@/lib/actions`.

- [ ] **Step 1: Add the `dev` script**

In `package.json`, add `"dev": "next dev"` to `scripts` (keep the others):

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write ."
  },
```

- [ ] **Step 2: Install runtime deps**

```bash
pnpm add canvas-confetti
pnpm add -D @types/canvas-confetti
```

- [ ] **Step 3: Create `.env` for local dev**

`env.ts` requires `APP_URL` and `APP_PASSWORD` (min 8 chars) at runtime, or the app won't boot.

```bash
cat > .env <<'EOF'
APP_URL=http://localhost:3000
APP_PASSWORD=changeme123
EOF
```

- [ ] **Step 4: Replace the broken auth stub in `src/lib/actions.ts`**

The current file references undefined `session` / `authServer`. Replace the **entire file** with a plain client (no auth — no DB in this spec):

```ts
import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }
    return "An unknown error occurred";
  },
});
```

- [ ] **Step 5: Fix app metadata in `app/layout.tsx`**

Replace the `metadata` object:

```ts
export const metadata: Metadata = {
  title: "Garoulette",
  description: "La roue qui t'espante et qui te régale !",
};
```

- [ ] **Step 6: Verify**

```bash
pnpm exec tsc --noEmit
pnpm exec biome check --write .
pnpm dev
```
Expected: dev server boots on `http://localhost:3000` with no env error (stop it after confirming). `tsc` and Biome clean.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/actions.ts app/layout.tsx
git commit -m "chore: add dev script, deps, plain action client, app metadata"
```

---

### Task 2: Domain types & Zod schemas

**Files:**
- Create: `src/lib/campaigns/types.ts`

**Interfaces:**
- Produces:
  - `prizeSchema`, `prizesFileSchema`, `drawSchema`, `drawsFileSchema`, `settingsSchema`
  - types `Prize`, `Draw`, `Settings`, `Campaign`
  - `Prize = { id: string; name: string; image: string; initialStock: number; weight: number }`
  - `Draw = { id: string; prizeId: string; date: string }`
  - `Settings = { name: string; theme?: {...}; expiresAt?: string; welcomeMessage?: string; resetDelaySeconds?: number }`
  - `Campaign = { slug: string; settings: Settings; prizes: Prize[]; draws: Draw[] }`

- [ ] **Step 1: Write `src/lib/campaigns/types.ts`**

```ts
import { z } from "zod";

export const prizeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  image: z.string().min(1),
  initialStock: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
});
export type Prize = z.infer<typeof prizeSchema>;

export const prizesFileSchema = z.object({
  prizes: z.array(prizeSchema),
});

export const drawSchema = z.object({
  id: z.string(),
  prizeId: z.string(),
  date: z.string(),
});
export type Draw = z.infer<typeof drawSchema>;

export const drawsFileSchema = z.object({
  draws: z.array(drawSchema),
});

export const themeSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logo: z.string().optional(),
  font: z.string().optional(),
});

export const settingsSchema = z.object({
  name: z.string().min(1),
  theme: themeSchema.optional(),
  expiresAt: z.string().optional(),
  welcomeMessage: z.string().optional(),
  resetDelaySeconds: z.number().positive().optional(),
});
export type Settings = z.infer<typeof settingsSchema>;

export type Campaign = {
  slug: string;
  settings: Settings;
  prizes: Prize[];
  draws: Draw[];
};
```

- [ ] **Step 2: Verify & commit**

```bash
pnpm exec tsc --noEmit
pnpm exec biome check --write .
git add src/lib/campaigns/types.ts
git commit -m "feat: add campaign domain types and zod schemas"
```

---

### Task 3: Pure logic — stock & draw

**Files:**
- Create: `src/lib/campaigns/stock.ts`
- Create: `src/lib/campaigns/draw.ts`

**Interfaces:**
- Consumes: `Prize`, `Draw` from `@/lib/campaigns/types`.
- Produces:
  - `computeStock(prizes: Prize[], draws: Draw[]): PrizeStock[]` where `PrizeStock = Prize & { remaining: number; effectiveWeight: number }`
  - `drawPrize(prizes: Prize[], draws: Draw[]): DrawResult | null` where `DrawResult = { prize: Prize; prizeIndex: number }`; returns `null` when every `effectiveWeight === 0`.

- [ ] **Step 1: Write `src/lib/campaigns/stock.ts`**

```ts
import type { Draw, Prize } from "./types";

export type PrizeStock = Prize & {
  remaining: number;
  effectiveWeight: number;
};

export function computeStock(prizes: Prize[], draws: Draw[]): PrizeStock[] {
  return prizes.map((prize) => {
    const used = draws.filter((d) => d.prizeId === prize.id).length;
    const remaining = prize.initialStock - used;
    return {
      ...prize,
      remaining,
      effectiveWeight: remaining > 0 ? prize.weight : 0,
    };
  });
}
```

- [ ] **Step 2: Write `src/lib/campaigns/draw.ts`**

```ts
import { computeStock } from "./stock";
import type { Draw, Prize } from "./types";

export type DrawResult = {
  prize: Prize;
  prizeIndex: number;
};

export function drawPrize(prizes: Prize[], draws: Draw[]): DrawResult | null {
  const stock = computeStock(prizes, draws);
  const totalWeight = stock.reduce((sum, p) => sum + p.effectiveWeight, 0);
  if (totalWeight === 0) return null;

  let threshold = Math.random() * totalWeight;
  for (const p of stock) {
    if (p.effectiveWeight === 0) continue;
    if (threshold < p.effectiveWeight) {
      return toResult(prizes, p.id);
    }
    threshold -= p.effectiveWeight;
  }

  // Floating-point fallback: last prize that still has stock.
  const last = [...stock].reverse().find((p) => p.effectiveWeight > 0);
  if (!last) return null;
  return toResult(prizes, last.id);
}

function toResult(prizes: Prize[], prizeId: string): DrawResult {
  const prizeIndex = prizes.findIndex((p) => p.id === prizeId);
  return { prize: prizes[prizeIndex], prizeIndex };
}
```

- [ ] **Step 3: Sanity-check the draw logic manually**

Run a quick throwaway script to confirm the weighting and sold-out behavior:

```bash
pnpm exec tsx -e "
import { drawPrize } from './src/lib/campaigns/draw.ts';
const prizes = [
  { id: 'a', name: 'A', image: 'a', initialStock: 1, weight: 10 },
  { id: 'b', name: 'B', image: 'b', initialStock: 100, weight: 30 },
];
const counts = { a: 0, b: 0 };
for (let i = 0; i < 10000; i++) counts[drawPrize(prizes, []).prize.id]++;
console.log('distribution ~25/75:', counts);
const soldOut = drawPrize(prizes, [{ id:'1', prizeId:'a', date:'' }, { id:'2', prizeId:'b', date:'' }]);
console.log('one left (b only):', soldOut?.prize.id);
console.log('all gone:', drawPrize([{ id:'a', name:'A', image:'a', initialStock:0, weight:10 }], []));
"
```
Expected: distribution roughly 25% `a` / 75% `b`; "one left" prints `b`; "all gone" prints `null`. (If `tsx` is unavailable, run `pnpm dlx tsx -e "..."`.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/campaigns/stock.ts src/lib/campaigns/draw.ts
git commit -m "feat: add pure stock and weighted-draw logic"
```

---

### Task 4: Storage layer — load, list, draw+commit under lock

**Files:**
- Create: `src/lib/campaigns/storage.ts`

**Interfaces:**
- Consumes: schemas/types from `./types`, `drawPrize` from `./draw`.
- Produces:
  - `campaignDir(slug: string): string`
  - `listCampaigns(): Promise<{ slug: string; name: string }[]>`
  - `loadCampaign(slug: string): Promise<Campaign>` (throws on missing/invalid; ENOENT propagates as a `NodeJS.ErrnoException` with `code === "ENOENT"`)
  - `drawAndCommit(slug: string): Promise<{ status: "win"; prizeId: string; prizeIndex: number; remaining: number } | { status: "soldOut" }>` — the **only** mutation; draws + appends atomically under a per-campaign lock.

- [ ] **Step 1: Write `src/lib/campaigns/storage.ts`**

```ts
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { drawPrize } from "./draw";
import {
  type Campaign,
  type Draw,
  drawsFileSchema,
  prizesFileSchema,
  settingsSchema,
} from "./types";

const DATA_ROOT = path.join(process.cwd(), "data", "campaigns");

export function campaignDir(slug: string): string {
  return path.join(DATA_ROOT, slug);
}

async function readJson(file: string): Promise<unknown> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function readDraws(slug: string): Promise<Draw[]> {
  const file = path.join(campaignDir(slug), "draws.json");
  try {
    return drawsFileSchema.parse(await readJson(file)).draws;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function listCampaigns(): Promise<{ slug: string; name: string }[]> {
  let entries: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }
  const result: { slug: string; name: string }[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const settings = settingsSchema.parse(
        await readJson(path.join(DATA_ROOT, entry.name, "settings.json")),
      );
      result.push({ slug: entry.name, name: settings.name });
    } catch {
      // Skip folders that are not valid campaigns.
    }
  }
  return result;
}

export async function loadCampaign(slug: string): Promise<Campaign> {
  const dir = campaignDir(slug);
  const settings = settingsSchema.parse(
    await readJson(path.join(dir, "settings.json")),
  );
  const { prizes } = prizesFileSchema.parse(
    await readJson(path.join(dir, "prizes.json")),
  );
  const draws = await readDraws(slug);
  return { slug, settings, prizes, draws };
}

// --- Mutation: draw + append, serialized per campaign ---

const locks = new Map<string, Promise<unknown>>();

async function acquireFileLock(lockFile: string, retries = 100): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const fh = await fs.open(lockFile, "wx");
      await fh.close();
      return;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  throw new Error(`Could not acquire lock: ${lockFile}`);
}

async function withCampaignLock<T>(
  slug: string,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = locks.get(slug) ?? Promise.resolve();
  const run = (async () => {
    await prev.catch(() => {});
    const lockFile = path.join(campaignDir(slug), "draws.json.lock");
    await acquireFileLock(lockFile);
    try {
      return await fn();
    } finally {
      await fs.rm(lockFile, { force: true });
    }
  })();
  locks.set(slug, run.catch(() => {}));
  return run;
}

export type CommitResult =
  | { status: "win"; prizeId: string; prizeIndex: number; remaining: number }
  | { status: "soldOut" };

export async function drawAndCommit(slug: string): Promise<CommitResult> {
  return withCampaignLock(slug, async () => {
    // Fresh read inside the lock so concurrent spins can never oversell.
    const { prizes } = prizesFileSchema.parse(
      await readJson(path.join(campaignDir(slug), "prizes.json")),
    );
    const draws = await readDraws(slug);

    const result = drawPrize(prizes, draws);
    if (!result) return { status: "soldOut" };

    const draw: Draw = {
      id: randomUUID(),
      prizeId: result.prize.id,
      date: new Date().toISOString(),
    };
    const nextDraws = [...draws, draw];

    const file = path.join(campaignDir(slug), "draws.json");
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ draws: nextDraws }, null, 2), "utf8");
    await fs.rename(tmp, file);

    const usedAfter = nextDraws.filter((d) => d.prizeId === result.prize.id).length;
    const remaining = result.prize.initialStock - usedAfter;

    return {
      status: "win",
      prizeId: result.prize.id,
      prizeIndex: result.prizeIndex,
      remaining,
    };
  });
}
```

- [ ] **Step 2: Verify & commit**

```bash
pnpm exec tsc --noEmit
pnpm exec biome check --write .
git add src/lib/campaigns/storage.ts
git commit -m "feat: add campaign storage with locked atomic draw+commit"
```

---

### Task 5: Seed demo campaign + image route handler

**Files:**
- Create: `data/campaigns/demo/settings.json`
- Create: `data/campaigns/demo/prizes.json`
- Create: `data/campaigns/demo/draws.json`
- Create: `data/campaigns/demo/images/.gitkeep`
- Create: `app/campaign/[slug]/images/[...file]/route.ts`
- Modify: `.gitignore` (allow committing the demo campaign)

**Interfaces:**
- Consumes: `campaignDir` from `@/features/campaign`.
- Produces: `GET /campaign/<slug>/images/<file>` serving a file from `data/campaigns/<slug>/images/`, with path-traversal protection and a 404 fallback.

- [ ] **Step 1: Seed the demo campaign JSON**

`data/campaigns/demo/settings.json`:

```json
{
  "name": "Demo Campaign",
  "theme": {
    "primaryColor": "#FF6B35",
    "secondaryColor": "#1A1A2E"
  },
  "welcomeMessage": "Spin the wheel and win! 🎉",
  "resetDelaySeconds": 6
}
```

`data/campaigns/demo/prizes.json`:

```json
{
  "prizes": [
    { "id": "prize-001", "name": "Headphones", "image": "/images/headphones.png", "initialStock": 3, "weight": 10 },
    { "id": "prize-002", "name": "20€ Voucher", "image": "/images/voucher.png", "initialStock": 10, "weight": 30 },
    { "id": "prize-003", "name": "Sticker Pack", "image": "/images/stickers.png", "initialStock": 50, "weight": 40 },
    { "id": "prize-004", "name": "Mug", "image": "/images/mug.png", "initialStock": 5, "weight": 20 }
  ]
}
```

`data/campaigns/demo/draws.json`:

```json
{ "draws": [] }
```

Create the images folder placeholder:

```bash
mkdir -p data/campaigns/demo/images
touch data/campaigns/demo/images/.gitkeep
```

(Prize images are optional — the UI shows a placeholder when a file is missing, per Task 8. Drop real PNGs into `data/campaigns/demo/images/` later if desired.)

- [ ] **Step 2: Allow the demo campaign past `.gitignore`**

`data/` is not currently ignored, but confirm nothing blocks it. Append an explicit allow to `.gitignore` for clarity (no-op if already committable):

```gitignore

# Keep the seed demo campaign; real event data is mounted at runtime.
!data/campaigns/demo/
```

- [ ] **Step 3: Write the image route handler**

`app/campaign/[slug]/images/[...file]/route.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { campaignDir } from "@/features/campaign";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: Request,
  ctx: RouteContext<"/campaign/[slug]/images/[...file]">,
) {
  const { slug, file } = await ctx.params;
  const rel = Array.isArray(file) ? file.join("/") : file;
  const dir = path.join(campaignDir(slug), "images");
  const target = path.join(dir, rel);

  // Reject path traversal: resolved target must stay inside the images dir.
  if (target !== dir && !target.startsWith(dir + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(target);
    const type = MIME[path.extname(target).toLowerCase()] ?? "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
```

- [ ] **Step 4: Verify & commit**

```bash
pnpm exec tsc --noEmit
pnpm exec biome check --write .
git add data/campaigns/demo app/campaign/[slug]/images .gitignore
git commit -m "feat: add demo campaign seed and image route handler"
```

Note: `tsc` may not know `RouteContext` until types are generated. If it errors, run `pnpm exec next typegen` first, then re-run `tsc --noEmit`.

---

### Task 6: Theme resolver & image URL helper

**Files:**
- Create: `src/features/campaign/lib/theme.ts`
- Create: `src/features/campaign/lib/images.ts`
- Modify: `src/features/campaign/index.ts` (add `theme` + `images` to the barrel)

**Interfaces:**
- Consumes: `Settings` from `../types`.
- Produces:
  - `DEFAULT_THEME = { primaryColor: "#FF6B35"; secondaryColor: "#1A1A2E" }`
  - `themeStyle(settings: Settings): React.CSSProperties` — returns `{ "--primary": ..., "--secondary": ... }` for a wrapper element.
  - `prizeImageUrl(slug: string, image: string): string` — maps a campaign-relative image path to its route URL.

- [ ] **Step 1: Write `src/features/campaign/lib/theme.ts`**

```ts
import type { CSSProperties } from "react";
import type { Settings } from "../types";

export const DEFAULT_THEME = {
  primaryColor: "#FF6B35",
  secondaryColor: "#1A1A2E",
} as const;

export function themeStyle(settings: Settings): CSSProperties {
  const theme = settings.theme ?? {};
  return {
    "--primary": theme.primaryColor ?? DEFAULT_THEME.primaryColor,
    "--secondary": theme.secondaryColor ?? DEFAULT_THEME.secondaryColor,
  } as CSSProperties;
}
```

(`globals.css` already maps `--color-primary: var(--primary)` via `@theme inline`, so overriding `--primary` on a wrapper re-themes `bg-primary`/`text-primary` inside it at runtime.)

- [ ] **Step 2: Write `src/features/campaign/lib/images.ts`**

```ts
export function prizeImageUrl(slug: string, image: string): string {
  const file = image.replace(/^\/?images\//, "").replace(/^\/+/, "");
  return `/campaign/${encodeURIComponent(slug)}/images/${file}`;
}
```

- [ ] **Step 3: Add `theme` and `images` to the feature barrel**

Append to `src/features/campaign/index.ts`:

```ts
export * from "./lib/theme";
export * from "./lib/images";
```

- [ ] **Step 4: Verify & commit**

```bash
pnpm exec tsc --noEmit
pnpm exec biome check --write .
git add src/features/campaign/lib/theme.ts src/features/campaign/lib/images.ts src/features/campaign/index.ts
git commit -m "feat: add theme resolver and prize image URL helper"
```

---

### Task 7: Spin server action

**Files:**
- Create: `src/features/campaign/actions/spin.ts`

**Interfaces:**
- Consumes: `action` from `@/lib/actions` (shared client); `loadCampaign`, `drawAndCommit` from `../lib/storage` (relative — this file is inside the feature).
- Produces: `spinAction` — call as `await spinAction({ slug })`; returns `{ data?, serverError? }` where `data` is one of:
  - `{ status: "win"; prizeId: string; prizeIndex: number; remaining: number }`
  - `{ status: "soldOut" }`
  - `{ status: "expired" }`

- [ ] **Step 1: Write `src/features/campaign/actions/spin.ts`**

```ts
"use server";

import { z } from "zod";
import { action } from "@/lib/actions";
import { drawAndCommit, loadCampaign } from "../lib/storage";

export const spinAction = action
  .inputSchema(z.object({ slug: z.string().min(1) }))
  .action(async ({ parsedInput: { slug } }) => {
    const campaign = await loadCampaign(slug);

    const { expiresAt } = campaign.settings;
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      return { status: "expired" as const };
    }

    return drawAndCommit(slug);
  });
```

- [ ] **Step 2: Verify & commit**

```bash
pnpm exec tsc --noEmit
pnpm exec biome check --write .
git add src/features/campaign/actions/spin.ts
git commit -m "feat: add server-authoritative spin action"
```

---

### Task 8: Wheel component + confetti

**Files:**
- Create: `src/features/campaign/components/confetti.ts`
- Create: `src/features/campaign/components/wheel.tsx`

**Interfaces:**
- Produces:
  - `fireConfetti(): void`
  - `WheelPrize = { id: string; name: string; imageUrl: string }`
  - `<Wheel prizes={WheelPrize[]} rotation={number} spinDurationMs={number} onSpinEnd={() => void} />` — a presentational, controlled component. The parent sets `rotation` (absolute degrees, monotonically increasing); the wheel eases to it over `spinDurationMs` and calls `onSpinEnd` when the transition finishes. It renders one equal-sized colored segment per prize with the prize name + small image, and a fixed pointer at the top (12 o'clock).
  - Segment geometry contract: prize `i` is centered at angle `i * seg + seg/2` measured clockwise from the top, where `seg = 360 / prizes.length`. The parent computes the landing rotation from this contract (Task 9).

- [ ] **Step 1: Write `src/features/campaign/components/confetti.ts`**

```ts
import confetti from "canvas-confetti";

export function fireConfetti(): void {
  confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
  setTimeout(
    () => confetti({ particleCount: 80, spread: 120, startVelocity: 45 }),
    200,
  );
}
```

- [ ] **Step 2: Write `src/features/campaign/components/wheel.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";

export type WheelPrize = {
  id: string;
  name: string;
  imageUrl: string;
};

const PALETTE = [
  "#E21B3C",
  "#1368CE",
  "#26890C",
  "#FFA602",
  "#9C27B0",
  "#0FB9B1",
];

type WheelProps = {
  prizes: WheelPrize[];
  rotation: number;
  spinDurationMs: number;
  onSpinEnd: () => void;
};

export function Wheel({ prizes, rotation, spinDurationMs, onSpinEnd }: WheelProps) {
  const seg = 360 / prizes.length;

  // Hard-stop conic gradient: one solid wedge per prize, first wedge centered at top.
  const stops = prizes
    .map((_, i) => {
      const color = PALETTE[i % PALETTE.length];
      return `${color} ${i * seg}deg ${(i + 1) * seg}deg`;
    })
    .join(", ");

  return (
    <div className="relative aspect-square w-full max-w-[80vmin]">
      {/* Pointer at 12 o'clock */}
      <div className="-translate-x-1/2 absolute top-0 left-1/2 z-20 h-0 w-0 border-transparent border-t-[36px] border-r-[22px] border-l-[22px] border-t-black" />

      {/* Rotating wheel */}
      <div
        className="absolute inset-0 rounded-full border-8 border-black shadow-2xl"
        style={{
          background: `conic-gradient(from ${-seg / 2}deg, ${stops})`,
          transform: `rotate(${rotation}deg)`,
          transition: `transform ${spinDurationMs}ms cubic-bezier(0.12, 0.8, 0.16, 1)`,
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") onSpinEnd();
        }}
      >
        {prizes.map((prize, i) => (
          <div
            key={prize.id}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              transform: `rotate(${i * seg + seg / 2}deg) translateX(6%)`,
            }}
          >
            <div
              className="flex w-[42%] max-w-[42%] items-center gap-2 font-bold text-white text-sm drop-shadow"
              style={{ transform: "translateY(-50%)" }}
            >
              {/* biome-ignore lint/performance/noImgElement: prize images are runtime volume files, not build-time assets */}
              <img
                src={prize.imageUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
              <span className="truncate">{prize.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Hub */}
      <div className={cn(
        "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10",
        "h-16 w-16 rounded-full border-4 border-black bg-white shadow-lg",
      )} />
    </div>
  );
}
```

- [ ] **Step 3: Verify & commit**

```bash
pnpm exec tsc --noEmit
pnpm exec biome check --write .
git add src/features/campaign/components/confetti.ts src/features/campaign/components/wheel.tsx
git commit -m "feat: add presentational wheel and confetti helper"
```

---

### Task 9: Campaign screen (state machine + spin orchestration)

**Files:**
- Create: `src/features/campaign/components/campaign-screen.tsx`

**Interfaces:**
- Consumes (relative — this is a `"use client"` file inside the feature): `Wheel`, `WheelPrize` from `./wheel`; `fireConfetti` from `./confetti`; `spinAction` from `../actions/spin`. Do NOT import from the `@/features/campaign` barrel here.
- Produces: `<CampaignScreen slug welcomeMessage? resetDelaySeconds prizes initialStatus />` where
  - `prizes: WheelPrize[]`
  - `initialStatus: "ready" | "soldOut" | "expired"`
  - `resetDelaySeconds: number`

- [ ] **Step 1: Write `src/features/campaign/components/campaign-screen.tsx`**

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { spinAction } from "../actions/spin";
import { fireConfetti } from "./confetti";
import { Wheel, type WheelPrize } from "./wheel";
import { cn } from "@/lib/utils";

const SPIN_DURATION_MS = 4500;

type Status = "ready" | "spinning" | "result" | "soldOut" | "expired";

type CampaignScreenProps = {
  slug: string;
  welcomeMessage?: string;
  resetDelaySeconds: number;
  prizes: WheelPrize[];
  initialStatus: "ready" | "soldOut" | "expired";
};

export function CampaignScreen({
  slug,
  welcomeMessage,
  resetDelaySeconds,
  prizes,
  initialStatus,
}: CampaignScreenProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const pendingPrize = useRef<WheelPrize | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const seg = prizes.length > 0 ? 360 / prizes.length : 0;

  const landingRotation = useCallback(
    (prizeIndex: number) => {
      // Wheel segment i is centered at (i*seg + seg/2) clockwise from top.
      // Rotating the wheel by R moves that center to (i*seg + seg/2 + R).
      // We want it at the top (≡ 0 mod 360). Spin forward several full turns.
      const center = prizeIndex * seg + seg / 2;
      const jitter = (Math.random() - 0.5) * seg * 0.6;
      const currentTurns = Math.floor(rotation / 360) + 6;
      return currentTurns * 360 - center + jitter;
    },
    [rotation, seg],
  );

  const spin = useCallback(async () => {
    if (status !== "ready") return;
    setStatus("spinning");
    // Kick off a visible spin immediately to mask network latency.
    setRotation((r) => r + 360 * 2);

    const res = await spinAction({ slug });
    const data = res?.data;

    if (!data || res?.serverError) {
      // Treat an unexpected failure as a soft reset back to ready.
      setStatus("ready");
      return;
    }
    if (data.status === "expired") {
      setStatus("expired");
      return;
    }
    if (data.status === "soldOut") {
      setStatus("soldOut");
      return;
    }

    pendingPrize.current = prizes[data.prizeIndex] ?? null;
    setRotation(landingRotation(data.prizeIndex));
  }, [status, slug, prizes, landingRotation]);

  const handleSpinEnd = useCallback(() => {
    if (status !== "spinning" || !pendingPrize.current) return;
    setWonPrize(pendingPrize.current);
    pendingPrize.current = null;
    setStatus("result");
    fireConfetti();
    resetTimer.current = setTimeout(reset, resetDelaySeconds * 1000);
  }, [status, resetDelaySeconds]);

  const reset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setWonPrize(null);
    setStatus("ready");
  }, []);

  const handleTap = useCallback(() => {
    if (status === "ready") void spin();
    else if (status === "result") reset();
  }, [status, spin, reset]);

  if (initialStatus === "expired" || status === "expired") {
    return <FullMessage title="Campaign ended" subtitle="Thanks for playing!" />;
  }
  if (initialStatus === "soldOut" || status === "soldOut") {
    return <FullMessage title="All prizes have been given out 🎉" subtitle="See you next time!" />;
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={status === "spinning"}
      className="flex min-h-full w-full flex-1 cursor-pointer flex-col items-center justify-center gap-8 bg-secondary p-8 text-center disabled:cursor-default"
    >
      {welcomeMessage && status === "ready" && (
        <h1 className="max-w-2xl font-black text-4xl text-white">{welcomeMessage}</h1>
      )}

      <Wheel
        prizes={prizes}
        rotation={rotation}
        spinDurationMs={SPIN_DURATION_MS}
        onSpinEnd={handleSpinEnd}
      />

      {status === "ready" && (
        <span className="rounded-full bg-primary px-10 py-4 font-black text-2xl text-white shadow-lg">
          TAP TO SPIN
        </span>
      )}

      {status === "result" && wonPrize && (
        <div className="flex flex-col items-center gap-4">
          <p className="font-bold text-2xl text-white">You won</p>
          {/* biome-ignore lint/performance/noImgElement: prize images are runtime volume files, not build-time assets */}
          <img
            src={wonPrize.imageUrl}
            alt=""
            className="h-40 w-40 rounded-2xl bg-white/10 object-contain p-2"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
          <p className="font-black text-4xl text-primary">{wonPrize.name}</p>
          <p className="text-sm text-white/70">Tap to continue</p>
        </div>
      )}
    </button>
  );
}

function FullMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={cn(
      "flex min-h-full w-full flex-1 flex-col items-center justify-center gap-4 bg-secondary p-8 text-center",
    )}>
      <h1 className="max-w-2xl font-black text-4xl text-white">{title}</h1>
      <p className="text-lg text-white/70">{subtitle}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify & commit**

```bash
pnpm exec tsc --noEmit
pnpm exec biome check --write .
git add src/features/campaign/components/campaign-screen.tsx
git commit -m "feat: add campaign screen state machine and spin orchestration"
```

---

### Task 10: Campaign page (RSC) + error screen

**Files:**
- Create: `app/campaign/[slug]/page.tsx`
- Create: `app/campaign/[slug]/error.tsx`

**Interfaces:**
- Consumes (Server Component): `loadCampaign`, `computeStock`, `themeStyle`, `prizeImageUrl` from the `@/features/campaign` barrel; `CampaignScreen` from `@/features/campaign/components/campaign-screen` (direct path — it's a client component); type `WheelPrize` from `@/features/campaign/components/wheel`.

- [ ] **Step 1: Write `app/campaign/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { computeStock, loadCampaign, prizeImageUrl, themeStyle } from "@/features/campaign";
import { CampaignScreen } from "@/features/campaign/components/campaign-screen";
import type { WheelPrize } from "@/features/campaign/components/wheel";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: PageProps<"/campaign/[slug]">) {
  const { slug } = await params;

  let campaign: Awaited<ReturnType<typeof loadCampaign>>;
  try {
    campaign = await loadCampaign(slug);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw err; // invalid JSON etc. -> error.tsx names the offending file
  }

  const { settings } = campaign;
  const expired = Boolean(
    settings.expiresAt && new Date(settings.expiresAt).getTime() < Date.now(),
  );
  const stock = computeStock(campaign.prizes, campaign.draws);
  const soldOut = stock.every((p) => p.effectiveWeight === 0);
  const initialStatus = expired ? "expired" : soldOut ? "soldOut" : "ready";

  const prizes: WheelPrize[] = campaign.prizes.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: prizeImageUrl(slug, p.image),
  }));

  return (
    <div className="flex min-h-full flex-1" style={themeStyle(settings)}>
      <CampaignScreen
        slug={slug}
        welcomeMessage={settings.welcomeMessage}
        resetDelaySeconds={settings.resetDelaySeconds ?? 6}
        prizes={prizes}
        initialStatus={initialStatus}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `app/campaign/[slug]/error.tsx`**

```tsx
"use client";

export default function CampaignError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 bg-zinc-900 p-8 text-center">
      <h1 className="font-black text-3xl text-white">Campaign unavailable</h1>
      <p className="max-w-xl text-sm text-white/70">{error.message}</p>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

```bash
pnpm dev
```
Open `http://localhost:3000/campaign/demo` and confirm:
- The wheel renders full-screen with the welcome message and "TAP TO SPIN".
- Tapping spins; after ~4.5s it lands on a segment, confetti fires, the prize overlay shows the name (image hidden if no PNG seeded).
- After `resetDelaySeconds` (6s) **or** a tap, it returns to ready.
- Editing `data/campaigns/demo/settings.json` `primaryColor` and reloading changes the button/prize color (no rebuild).
- `http://localhost:3000/campaign/does-not-exist` → 404.
- Set `draws.json` so every prize is exhausted (e.g. add enough entries) → the sold-out screen shows on reload.

- [ ] **Step 4: Commit**

```bash
git add app/campaign/[slug]/page.tsx app/campaign/[slug]/error.tsx
git commit -m "feat: add campaign kiosk page and error screen"
```

---

### Task 11: Operator home (campaign list) + app logos

**Files:**
- Modify: `app/page.tsx` (replace default template)
- Create: `public/logo.png`, `public/logo@2x.png`, `public/logo@3x.png`

**Interfaces:**
- Consumes: `listCampaigns` from `@/features/campaign`.

- [ ] **Step 1: Copy the app logos into `public/`**

```bash
cp logos-utiliser/Logo.png public/logo.png
cp logos-utiliser/Logo@2x.png public/logo@2x.png
cp logos-utiliser/Logo@3x.png public/logo@3x.png
```

- [ ] **Step 2: Replace `app/page.tsx` with the operator home**

```tsx
import Image from "next/image";
import Link from "next/link";
import { listCampaigns } from "@/features/campaign";

export const dynamic = "force-dynamic";

export default async function Home() {
  const campaigns = await listCampaigns();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col items-center gap-10 px-6 py-16">
      <Image
        src="/logo.png"
        alt="Garoulette"
        width={180}
        height={60}
        priority
        className="h-auto w-44"
      />
      <h1 className="text-center font-black text-3xl">Choose a campaign</h1>

      {campaigns.length === 0 ? (
        <p className="text-muted-foreground">
          No campaigns found under <code>data/campaigns/</code>.
        </p>
      ) : (
        <ul className="grid w-full gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/campaign/${c.slug}`}
                className="flex items-center justify-center rounded-2xl border-2 border-black bg-primary px-6 py-8 text-center font-black text-white text-xl shadow-lg transition-transform hover:scale-[1.02]"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Manual verification**

```bash
pnpm dev
```
Open `http://localhost:3000` and confirm the logo shows, "Demo Campaign" is listed, and clicking it navigates to `/campaign/demo`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx public/logo.png public/logo@2x.png public/logo@3x.png
git commit -m "feat: add operator home with campaign list and app logo"
```

---

## Self-Review

**Spec coverage:**
- Routes `/` and `/campaign/[slug]` → Tasks 11, 10. ✅
- Slug = folder name, unknown → 404 → Task 10. ✅
- Data layout / mounted volume / images outside `public/` → Tasks 5, 6. ✅
- `settings.json` / `prizes.json` / `draws.json` (English keys) + Zod → Tasks 2, 5. ✅
- Derived stock & effective weight → Task 3. ✅
- Data layer split (pure vs I/O), locked atomic write, no oversell → Tasks 3, 4. ✅
- Weighted draw algorithm + sold-out `null` → Task 3. ✅
- Server-authoritative spin action (win / soldOut / expired) → Task 7. ✅
- Wheel: one segment per prize, name + small image, server-decided landing → Tasks 8, 9. ✅
- Out-of-stock segment stays visually normal (never selected server-side) → Tasks 3, 8. ✅
- Confetti on win → Tasks 8, 9. ✅
- Reset: timer (`resetDelaySeconds`) OR tap → Task 9. ✅
- Runtime theme via CSS vars, no `NEXT_PUBLIC_*` → Tasks 6, 10. ✅
- Edge/error states: 404, sold-out, expired, invalid JSON, missing image, double-tap guard → Tasks 5, 8, 9, 10. ✅
- Cleanup of broken `actions.ts` stub → Task 1. ✅
- No tests (manual verification) → all tasks. ✅

**Placeholder scan:** No TBD/TODO; every code step contains complete code.

**Type consistency:** `drawPrize`→`DrawResult { prize, prizeIndex }`; `drawAndCommit`→`CommitResult` (win/soldOut) with `prizeIndex`/`remaining`; `spinAction` adds `{ status: "expired" }`; `WheelPrize { id, name, imageUrl }` consistent across Wheel, CampaignScreen, page. Segment geometry contract (`i*seg + seg/2` clockwise from top) is shared between `Wheel` (Task 8) and `landingRotation` (Task 9). ✅

## Out of scope (later specs)

Admin UI (create/edit campaigns, prizes, theme; draw-history inventory), authentication (note: `env.ts` already carries `APP_PASSWORD` for a future admin gate), any "losing" segment.
