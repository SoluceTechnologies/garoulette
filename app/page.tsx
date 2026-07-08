import Image from "next/image";
import Link from "next/link";
import { listCampaigns } from "@/features/campaign";

export const dynamic = "force-dynamic";

export default async function Home() {
	const campaigns = await listCampaigns();

	return (
		<main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col items-center gap-10 px-6 py-16">
			<Image src="/logo.png" alt="Garoulette" width={180} height={60} priority className="h-auto w-44" />
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
