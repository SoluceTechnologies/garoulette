import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { listCampaigns } from "@/features/campaign/lib/storage";
import { readableInk } from "@/features/campaign/utils/color";
import Image from "next/image";

export const dynamic = "force-dynamic";

const ACCENTS = [
  "#E21B3C",
  "#1368CE",
  "#26890C",
  "#9C27B0",
  "#0FB9B1",
  "#EA6C1B",
];

const STATUS_LABEL = {
  disabled: "Disabled",
  notStarted: "Soon",
  expired: "Ended",
} as const;

export default async function Home() {
  const campaigns = await listCampaigns();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-6 py-14 sm:py-20">
      <header className="flex flex-col items-center gap-4 text-center">
        <Image
          src={"/logo@2x.png"}
          alt="Garoulette logo"
          width={256}
          height={256}
        />
        <h1 className="text-balance font-black text-4xl text-foreground leading-[1.05] tracking-tight sm:text-5xl">
          Pick a campaign to spin
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Choose an event, then hand the screen to your guests and let them spin
          the wheel.
        </p>
      </header>

      <section className="mt-12">
        {campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
            {campaigns.map((campaign, i) => {
              const color =
                campaign.primaryColor ?? ACCENTS[i % ACCENTS.length];
              const ink = readableInk(color);
              const chipBg =
                ink === "#ffffff"
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(0,0,0,0.1)";
              const inactive = campaign.availability !== "active";
              return (
                <li key={campaign.slug}>
                  <Link
                    href={`/campaign/${campaign.slug}`}
                    style={{
                      backgroundColor: color,
                      color: ink,
                      outlineColor: color,
                    }}
                    className={`group flex min-h-40 flex-col justify-between rounded-2xl p-6 shadow-(--shadow-card) transition duration-200 ease-out hover:-translate-y-1 hover:shadow-(--shadow-pop) focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      inactive ? "opacity-65 saturate-[0.8]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span aria-hidden className="text-3xl">
                        🎡
                      </span>
                      <span
                        className="rounded-full px-3 py-1 font-bold text-sm"
                        style={{ backgroundColor: chipBg }}
                      >
                        {campaign.availability === "active"
                          ? `${campaign.prizeCount} ${campaign.prizeCount === 1 ? "prize" : "prizes"}`
                          : STATUS_LABEL[campaign.availability]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <h2 className="text-balance font-black text-2xl leading-tight tracking-tight">
                        {campaign.name}
                      </h2>
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
        Add a campaign folder under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          data/campaigns/
        </code>{" "}
        to get started.
      </p>
    </div>
  );
}
