import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { listCampaigns } from "@/features/campaign";

export const dynamic = "force-dynamic";

// Fallback accents (wheel palette) for campaigns that don't set a theme colour.
const ACCENTS = ["#E21B3C", "#1368CE", "#26890C", "#9C27B0", "#0FB9B1", "#EA6C1B"];

/** Pick black or white ink for legible text on an arbitrary background colour,
 *  choosing whichever yields the higher WCAG contrast ratio (not just luminance). */
function readableInk(hex: string): "#211e1a" | "#ffffff" {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [0, 2, 4].map((o) => toLinear(Number.parseInt(full.slice(o, o + 2), 16) / 255));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithBlack >= contrastWithWhite ? "#211e1a" : "#ffffff";
}

export default async function Home() {
  const campaigns = await listCampaigns();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-6 py-14 sm:py-20">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-primary px-4 py-1.5 font-black text-primary-foreground text-xs uppercase tracking-[0.2em]">
          Garoulette
        </span>
        <h1 className="text-balance font-black text-4xl text-foreground leading-[1.05] tracking-tight sm:text-5xl">
          Pick a campaign to spin
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Choose an event, then hand the screen to your guests and let them spin the wheel.
        </p>
      </header>

      <section className="mt-12">
        {campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
            {campaigns.map((campaign, i) => {
              const color = campaign.primaryColor ?? ACCENTS[i % ACCENTS.length];
              const ink = readableInk(color);
              const chipBg = ink === "#ffffff" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
              return (
                <li key={campaign.slug}>
                  <Link
                    href={`/campaign/${campaign.slug}`}
                    style={{
                      backgroundColor: color,
                      color: ink,
                      outlineColor: color,
                    }}
                    className="group flex min-h-40 flex-col justify-between rounded-2xl p-6 shadow-[var(--shadow-card)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-pop)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <div className="flex items-center justify-between">
                      <span aria-hidden className="text-3xl">
                        🎡
                      </span>
                      <span className="rounded-full px-3 py-1 font-bold text-sm" style={{ backgroundColor: chipBg }}>
                        {campaign.prizeCount} {campaign.prizeCount === 1 ? "prize" : "prizes"}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <h2 className="text-balance font-black text-2xl leading-tight tracking-tight">{campaign.name}</h2>
                      <ArrowRightIcon className="shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-8 py-16 text-center shadow-[var(--shadow-card)]">
      <p className="font-black text-foreground text-xl">No campaigns yet</p>
      <p className="max-w-sm text-balance text-muted-foreground text-sm">
        Add a campaign folder under <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/campaigns/</code> to
        get started.
      </p>
    </div>
  );
}
