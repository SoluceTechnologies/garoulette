<p align="center">
  <img src=".github/assets/logo.png" alt="Garoulette" width="200" />
</p>

# Garoulette

**Garoulette** is an open-source, self-hosted **prize wheel** for events. Build a campaign, add your prizes, share a link — then hand a screen to your guests and let them spin to win. Each prize has its own odds and stock, so you stay in control of exactly what gets given out and how often.

> _La roue qui t'espante et qui te régale !_

---

## What it does

1. **Create** — spin up a campaign from the admin dashboard (name, colours, logo, font)
2. **Configure** — add prizes, each with a weight (odds) and a stock (how many exist)
3. **Share** — copy the campaign's public link and open it on any screen or tablet
4. **Spin** — guests tap to spin; a prize is drawn according to your weights and remaining stock
5. **Track** — watch draws and remaining stock per prize from the dashboard

Everything runs on your own server and stores data as plain files on disk — no database, no external services.

### See it in action

| Spin & win | Manage a campaign |
|:---:|:---:|
| <img src=".github/assets/spin-mobile.gif" width="260" alt="Spinning the wheel and winning a prize" /> | <img src=".github/assets/admin-campaign.gif" width="260" alt="Editing a campaign in the dashboard" /> |

---

## Features

- **Weighted prize draws** — each prize has a `weight` (relative odds) and an `initialStock`; once a prize runs out, it stops being drawn automatically
- **Per-campaign theming** — primary / secondary / background colours, a logo, and a display font, applied live to the guest wheel
- **Kiosk mode** — full-screen spin surface with confetti, sounds, and a mute toggle; tap anywhere to spin, or lock it to a single button
- **Scheduling** — set a start and end date; the wheel shows "coming soon" or "ended" outside the window
- **Admin dashboard** — manage every campaign: settings, prizes, live stats, and a danger zone (reset draws / delete)
- **Public links** — one shareable URL per campaign, ready for a tablet or a big screen
- **Image uploads** — attach an image to any prize or a logo to any campaign
- **File-based storage** — every campaign is just a folder on disk; no database to run or back up
- **Password-protected admin** — a single admin password, session cookies signed with your own secret
- **Self-hosted** — a standard Next.js app; runs anywhere Node.js runs

---

## Screenshots

| | Desktop | Mobile |
|---|:---:|:---:|
| **Home** | <img src=".github/assets/home-desktop.png" width="420" alt="Campaign picker (desktop)" /> | <img src=".github/assets/home-mobile.png" width="200" alt="Campaign picker (mobile)" /> |
| **The wheel** | <img src=".github/assets/wheel-desktop.png" width="420" alt="Guest wheel (desktop)" /> | <img src=".github/assets/wheel-mobile.png" width="200" alt="Guest wheel (mobile)" /> |
| **Sign in** | <img src=".github/assets/login-desktop.png" width="420" alt="Admin sign in (desktop)" /> | <img src=".github/assets/login-mobile.png" width="200" alt="Admin sign in (mobile)" /> |
| **Dashboard** | <img src=".github/assets/dashboard-desktop.png" width="420" alt="Campaigns dashboard (desktop)" /> | <img src=".github/assets/dashboard-mobile.png" width="200" alt="Campaigns dashboard (mobile)" /> |
| **Campaign settings** | <img src=".github/assets/settings-desktop.png" width="420" alt="Campaign settings (desktop)" /> | <img src=".github/assets/settings-mobile.png" width="200" alt="Campaign settings (mobile)" /> |
| **Prizes** | <img src=".github/assets/prizes-desktop.png" width="420" alt="Prizes editor (desktop)" /> | <img src=".github/assets/prizes-mobile.png" width="200" alt="Prizes editor (mobile)" /> |

---

## Requirements

Before installing, make sure you have:

- **A Linux server** (or any machine that runs Node.js)
- **Node.js 20+** and **pnpm**
- **Writable disk** for the `data/` directory, where campaigns live
- **A reverse proxy** *(recommended for production)* — to serve the app over HTTPS

Garoulette has no database and no external dependencies. Prizes, settings, draws, and uploaded images are all stored on disk.

---

## Quick start with Docker Compose

The fastest way to run Garoulette — a single container, no Node.js or pnpm required.

### 1. Create a `docker-compose.yml`

```yaml
services:
  garoulette:
    image: soluce-technologies/garoulette:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      APP_URL: http://localhost:3000
      APP_PASSWORD: changeme   # bcrypt hash — see note below
      APP_SECRET: changeme     # replace with: openssl rand -base64 32
    volumes:
      - garoulette_data:/app/data   # campaigns, prizes, draws, and uploads

volumes:
  garoulette_data:
```

> `APP_PASSWORD` is a bcrypt hash. Generate one and use the Compose line it prints (with `$$`):
> ```bash
> docker run --rm soluce-technologies/garoulette:latest node scripts/hash-password.mjs "your-password"
> ```

### 2. Start the stack

```bash
docker compose up -d
```

### 3. Open the app

Go to [http://localhost:3000](http://localhost:3000) for the public home page, and [http://localhost:3000/admin](http://localhost:3000/admin) to sign in.

The `data/` volume keeps your campaigns and uploads across restarts and upgrades.

---

## Run with Docker

If you'd rather not use Compose:

```bash
docker run -d \
  --name garoulette \
  -p 3000:3000 \
  -v garoulette_data:/app/data \
  -e APP_URL=http://localhost:3000 \
  -e APP_PASSWORD='<bcrypt-hash>' \
  -e APP_SECRET='<random-32+-chars>' \
  soluce-technologies/garoulette:latest
```

---

## Installation (from source)

### 1. Clone the repository

```bash
git clone https://github.com/soluce-technologies/garoulette
cd garoulette
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file at the project root:

```bash
APP_URL=http://localhost:3000
APP_PASSWORD=<bcrypt-hash>        # see below
APP_SECRET=<random-32+-chars>     # openssl rand -base64 32
```

Generate the admin password hash with the bundled script — it prints a ready-to-paste, single-quoted `.env` line (bcrypt hashes contain `$`, so quoting matters):

```bash
node scripts/hash-password.mjs "your-admin-password"
# → APP_PASSWORD='$2b$12$...'   (copy this line into .env)
```

### 4. Build and start

```bash
pnpm build
pnpm start
```

Or, for development with hot reload:

```bash
pnpm dev
```

### 5. Open the app

Go to [http://localhost:3000](http://localhost:3000) for the public home page, and [http://localhost:3000/admin](http://localhost:3000/admin) to sign in with your admin password.

A `demo` campaign ships in `data/campaigns/` so you have something to spin right away.

---

## Configuration

All configuration is done through environment variables.

| Variable | Description |
|---|---|
| `APP_URL` | The URL where the app is reachable (e.g. `https://spin.example.com`). Used for metadata and public links. |
| `APP_PASSWORD` | The admin password, stored as a **bcrypt hash**. Generate it with `node scripts/hash-password.mjs <password>`. |
| `APP_SECRET` | Random secret (**32+ characters**) used to sign admin session cookies. Generate with `openssl rand -base64 32`. |

Set `SKIP_ENV_VALIDATION=true` to bypass env validation (useful during CI builds).

---

## How campaigns work

Each campaign is a folder under `data/campaigns/<slug>/`:

```
data/campaigns/
  my-event/
    settings.json    Name, theme, schedule, spin behaviour
    prizes.json      Prizes with weights, stock, colours, images
    draws.json       Log of every draw (drives remaining stock)
    images/          Uploaded prize / logo images
    sound/           Optional custom sounds
```

You can create and edit campaigns entirely from the **admin dashboard**, or edit these JSON files by hand.

### Prizes: weight vs. stock

- **`weight`** — relative odds. A prize with `weight: 40` is drawn twice as often as one with `weight: 20`.
- **`initialStock`** — how many of that prize exist. Once its stock is used up, the prize is removed from the draw. When every prize is out, the wheel shows a "sold out" screen.

### Campaign settings

| Setting | What it does |
|---|---|
| `name` | Display name of the campaign |
| `welcomeMessage` | Headline shown above the wheel |
| `theme` | `primaryColor`, `secondaryColor`, `backgroundColor`, `logo`, `font` |
| `enabled` | Turn the campaign on or off |
| `spinOnTapAnywhere` | Tap anywhere to spin (`true`) or require the button (`false`) |
| `startAt` / `expiresAt` | Optional schedule window (ISO dates) |
| `resetDelaySeconds` | How long the result stays before the wheel resets |
| `spinDurationSeconds` | How long the wheel spins |

### Fonts

The guest wheel can use any of these display fonts: **Comfortaa, Outfit, Poppins, Montserrat, Nunito, Fredoka, Baloo 2, Quicksand**.

---

## HTTPS and self-hosting

For production, put Garoulette behind a reverse proxy that terminates TLS. [Traefik](https://traefik.io) with automatic Let's Encrypt certificates is a common choice:

```yaml
# docker-compose.yml (reverse proxy in front of `pnpm start`)
services:
  traefik:
    image: traefik:v3
    command:
      - --providers.docker=true
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.le.acme.tlschallenge=true
      - --certificatesresolvers.le.acme.email=you@example.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
    ports:
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt:/letsencrypt
```

> Remember to persist the `data/` directory so campaigns and uploads survive restarts.

---

## Useful commands

```bash
pnpm dev      # Development server (hot reload)
pnpm build    # Production build
pnpm start    # Start the production server
pnpm lint     # Lint (Biome)
pnpm format   # Format (Biome)
pnpm check    # Lint + format + autofix (Biome)
```

---

## Contributing

Contributions are welcome. Follow the [Installation](#installation-from-source) steps, then:

### Stack

- **Framework** — Next.js (App Router) · React 19
- **UI** — Tailwind CSS v4 · Base UI · shadcn components
- **Forms / mutations** — react-hook-form + Zod · next-safe-action
- **Auth** — password + signed session cookies (`jose`, `bcryptjs`)
- **Storage** — plain JSON files on disk (no database)
- **Tooling** — Biome (lint + format) · pnpm

> Note: this project tracks a fast-moving Next.js. Read the guides in `node_modules/next/dist/docs/` before touching framework APIs — conventions may differ from older versions.

### Project structure

```
app/                Next.js routes
  (guest)/          Public home + campaign wheel
  (auth)/           Admin sign in
  (admin)/          Admin dashboard (protected)
  (api)/            Route handlers (image upload…)
config/             App-wide configuration
data/campaigns/     Campaign folders (settings, prizes, draws, assets)
src/
  features/
    admin/          Dashboard: forms, tables, actions, auth
    campaign/       Wheel, spin logic, theming, storage
  components/ui/    shadcn UI primitives
  lib/              Shared utilities
proxy.ts            Route protection for /admin and uploads
env.ts              Typed environment variables
```

### Guidelines

- Run `pnpm check` before submitting — the project uses [Biome](https://biomejs.dev) for linting and formatting
- Keep pull requests focused; one feature or fix per PR
- Server actions go through the helpers in `src/lib/actions.ts` — use the right one

### Reporting issues

Open an issue with a clear description, steps to reproduce, and your environment (OS, Node version).

---

## License

MIT © Soluce Technologies
