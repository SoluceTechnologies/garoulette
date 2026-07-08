# Garoulette — Public Wheel (Spec 1)

**Date:** 2026-07-08
**Scope:** Public, kiosk-facing prize wheel. Admin UI is a separate, later spec.
**Status:** Approved design, ready for implementation planning.

## Goal

A fun, Kahoot-style prize wheel for physical events. An operator opens a campaign
full-screen on a kiosk; visitors do a single interaction (tap/click to spin), win a
prize, and the screen auto-returns to a ready state for the next visitor. Minimal
interaction, maximum attractiveness. File-based, no database, no auth. Deployed as a
Docker image; campaign data lives in a mounted volume so branding and prizes change
without a rebuild.

## Stack

- Next.js 16.2.10 (App Router). **This is a newer Next than training data — read
  `node_modules/next/dist/docs/` before writing framework code.**
- React 19, TypeScript, Tailwind v4, `cn()` (clsx + tailwind-merge).
- shadcn/base-ui for standard components; the wheel and confetti are custom.
- `next-safe-action` for the server action, Zod for validation.
- `canvas-confetti` for the win animation.
- No database, no auth, no tests in this spec.

All code, identifiers, and JSON keys are in English.

## Routes

- `/` — operator home. Lists campaigns found under `data/campaigns/*`; clicking one
  redirects to `/campaign/<slug>`.
- `/campaign/[slug]` — the kiosk page. Server Component reads the campaign's three
  JSON files, computes remaining stock, and renders the full-screen wheel. Unknown
  slug or unreadable files → `notFound()` (404) / clear error screen, never a raw crash.

`slug` = the campaign folder name (e.g. `afterwork-juillet`). Human-readable, one
folder = one slug. No UUIDs.

## Data layout (mounted volume, outside `public/`)

```
data/
  campaigns/
    afterwork-juillet/
      settings.json
      prizes.json
      draws.json
      images/
        headphones.png
        voucher.png
```

The `data/` directory is a Docker volume, editable without rebuild. Prize images are
served through a route handler (`/campaign/[slug]/images/[file]`), not from `public/`,
because the folder is an external volume. Missing image → placeholder, never a broken
image.

### `settings.json`

```json
{
  "name": "Afterwork July",
  "theme": {
    "primaryColor": "#FF6B35",
    "secondaryColor": "#1A1A2E",
    "logo": "/images/logo.png",
    "font": "Poppins"
  },
  "expiresAt": "2026-07-31T23:59:59Z",
  "welcomeMessage": "Welcome to the afterwork! Spin the wheel 🎉",
  "resetDelaySeconds": 6
}
```

All fields optional except `name`; missing `theme` fields fall back to the base theme.
`resetDelaySeconds` controls the auto-return delay after a result.

### `prizes.json` (fixed catalogue — never mutated after creation)

```json
{
  "prizes": [
    { "id": "prize-001", "name": "Headphones", "image": "/images/headphones.png", "initialStock": 3, "weight": 10 },
    { "id": "prize-002", "name": "20€ Voucher", "image": "/images/voucher.png", "initialStock": 10, "weight": 30 }
  ]
}
```

- `id` — unique prize id.
- `name` — displayed label.
- `image` — path relative to the campaign's `images/` folder.
- `initialStock` — starting quantity, fixed forever after creation.
- `weight` — base weighting for the draw.

### `draws.json` (append-only journal — the only mutable file)

```json
{
  "draws": [
    { "id": "draw-001", "prizeId": "prize-001", "date": "2026-07-08T14:32:00Z" }
  ]
}
```

Every spin appends one entry. No modification or deletion, ever.

## Derived stock & weight

Stock is never stored; it is computed from the draw journal:

```
remaining(prize)       = prize.initialStock - count(draws where prizeId === prize.id)
effectiveWeight(prize) = remaining(prize) > 0 ? prize.weight : 0
```

`prizes.json` stays a frozen catalogue (no concurrent-write risk); `draws.json` is the
single mutable source of truth. Stock and probabilities are always consistent with the
real history, no double bookkeeping.

## Data layer — `src/lib/campaigns/`

Pure logic is separated from I/O so the draw math is testable/reasoned without disk.

- `loadCampaign(slug)` — reads and Zod-validates the three files; returns a typed
  `Campaign`. Invalid/missing → thrown error naming the offending file.
- `computeStock(prizes, draws)` — pure. Returns each prize's `remaining` and
  `effectiveWeight`.
- `drawPrize(prizes, draws)` — pure weighted pick over available prizes (below).
  Returns the chosen prize, or `null` when every `effectiveWeight === 0` (sold out).
- `appendDraw(slug, prizeId)` — the only mutation. Per-campaign lock (in-process mutex
  + on-disk `draws.json.lock`); read-modify-write; atomic commit via
  `draws.json.tmp` → `rename()`. Re-reads draws and re-checks stock **inside the lock**
  before committing, so concurrent kiosks on the same campaign can never oversell.

### Draw algorithm

```typescript
function drawPrize(prizes: Prize[], draws: Draw[]): Prize | null {
  const available = prizes
    .map((prize) => ({
      ...prize,
      remaining: prize.initialStock - draws.filter((d) => d.prizeId === prize.id).length,
    }))
    .filter((prize) => prize.remaining > 0);

  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return null;

  let threshold = Math.random() * totalWeight;
  for (const prize of available) {
    if (threshold < prize.weight) return prize;
    threshold -= prize.weight;
  }
  return available[available.length - 1];
}
```

## Draw flow

Server-authoritative: the disk write is the source of truth. No client-side draw, no
cheating, stock never goes negative.

`spinAction(slug)` — `next-safe-action`, no auth:

1. Lock the campaign → re-read `draws.json` → `computeStock` → `drawPrize`.
2. Campaign expired (`expiresAt` in the past) → return `{ expired: true }`, no write.
3. Sold out (`drawPrize` returns `null`) → return `{ soldOut: true }`, no write.
4. Otherwise `appendDraw` (atomic) → return `{ prizeId, prizeIndex, remaining }`.
   `prizeIndex` = the prize's position in the static `prizes` list, so the client knows
   which segment to stop on. The list order is stable, so the animation target is
   unambiguous even if another kiosk draws meanwhile.

## Wheel component (client)

One segment per prize. The server decides the winner (weighted by `weight`); the wheel
just animates to that segment, so **segment size need not reflect probability** —
equal, colorful, Kahoot-style slices.

- **Segment content:** prize name + small image. The big image is shown in the result
  overlay.
- **Out-of-stock prizes:** the segment stays visually normal; it is simply never drawn
  (the server excludes it). The wheel does not recompose mid-event.

State machine:

1. **Idle** — wheel ready, Spin enabled, `welcomeMessage` shown.
2. **Spinning** — on tap/click: disable input, start a free rotation immediately (masks
   network latency), await `spinAction`.
3. **Result** — on response, ease-out the wheel to land on `prizeIndex`'s segment
   (final angle = `n * 360 + segmentAngle + jitter`). On stop: fire confetti and show
   the result overlay (prize name + big image).
4. **Reset** — after `resetDelaySeconds` **or** a tap (whichever comes first), return to
   Idle.

## Edge cases & error states

- **Unknown slug / unreadable files** → `notFound()` or a clear error screen.
- **Total sold out** (`soldOut`) → dedicated screen ("All prizes have been given out 🎉"),
  Spin disabled. Detected server-side before any animation.
- **Expired campaign** (`expiresAt` past) → "Campaign ended" screen, spin blocked.
  Enforced in `spinAction`, not only at render.
- **Invalid JSON** (Zod fails) → explicit error naming the offending file; never a
  silent wrong draw.
- **Missing prize image** → placeholder, never a broken image.
- **Double-tap / spam** during animation → input disabled until back to Idle; the server
  lock prevents any double write regardless.

## Theme injection (runtime, no `NEXT_PUBLIC_*`)

`NEXT_PUBLIC_*` is baked in at build time and incompatible with changing branding in a
Docker deployment without a rebuild. Instead:

- The `/campaign/[slug]` Server Component reads `settings.json.theme` and injects it as
  inline CSS custom properties on a wrapper (`style={{ '--color-primary': primaryColor, ... }}`).
- Tailwind utility classes are generated at **build time** from scanned source, so a
  dynamic color from JSON can never be a generated class. Static classes stay via
  `cn()`; the dynamic value flows through a CSS variable. In Tailwind v4, map
  `--color-primary` once so the static `bg-primary` class reads the runtime var.
  `<div className={cn("rounded-full p-4 bg-primary")}>` → static class, runtime value.
- **Font:** `theme.font` is a family name. A fun default font is bundled and self-hosted
  in the image. A custom font name is applied only if the browser already has it; no
  dynamic Google Fonts fetch (Docker may be offline). Fonts beyond the bundled one must
  be added to the image. Colors and logo are the real runtime knobs.
- Missing/partial `theme` → base default theme, so a campaign works with minimal config.

## Cleanup

`src/lib/actions.ts` currently has a broken auth stub referencing undefined `session` /
`authServer`. Replace it with a plain `next-safe-action` client, no auth layer (no DB in
this spec).

## Verification

No automated tests in this spec. Manual verification: seed a sample campaign under
`data/campaigns/`, run the app, spin through to sold-out, confirm confetti, auto-reset,
expired-campaign and error screens, and that editing `settings.json` colors changes the
branding after a reload with no rebuild.

## Out of scope (later specs)

Admin UI (create campaigns, edit prizes/theme, view draw history/inventory grouped by
prize), authentication, any "losing" segment (every spin wins until sold out).
