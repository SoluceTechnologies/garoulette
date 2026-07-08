import Image from "next/image";
import Link from "next/link";
import { listCampaigns } from "@/features/campaign";

export const dynamic = "force-dynamic";

// Playful accents, reused from the wheel palette, to tag each campaign card.
const ACCENTS = ["#E21B3C", "#1368CE", "#26890C", "#FFA602", "#9C27B0", "#0FB9B1"];

export default async function Home() {
  const campaigns = await listCampaigns();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-6 py-12 sm:py-16">
      <header className="flex flex-col items-center gap-5 text-center">
        <Image src="/logo.png" alt="Garoulette" width={220} height={72} priority className="h-14 w-auto sm:h-16" />
        <h1 className="text-balance font-black text-3xl text-foreground leading-tight tracking-tight sm:text-4xl">
          Pick a campaign to spin
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Choose an event, then hand the screen to your guests and let them spin the wheel.
        </p>
      </header>

      <section className="mt-10 sm:mt-12">
        {campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {campaigns.map((campaign, i) => (
              <li key={campaign.slug}>
                <Link
                  href={`/campaign/${campaign.slug}`}
                  className="group flex items-center gap-4 rounded-[1.25rem] bg-card px-5 py-6 shadow-[var(--shadow-card)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  <span
                    aria-hidden
                    className="h-11 w-11 shrink-0 rounded-xl"
                    style={{ backgroundColor: ACCENTS[i % ACCENTS.length] }}
                  />
                  <span className="flex-1 font-black text-foreground text-lg leading-tight">{campaign.name}</span>
                  <span className="font-black text-2xl text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-8 py-14 text-center shadow-[var(--shadow-card)]">
      <p className="font-black text-foreground text-xl">No campaigns yet</p>
      <p className="max-w-sm text-muted-foreground text-sm">
        Add a campaign folder under <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/campaigns/</code> to
        get started.
      </p>
    </div>
  );
}
