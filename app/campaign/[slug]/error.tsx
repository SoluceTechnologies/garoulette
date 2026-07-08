"use client";

export default function CampaignError({ error }: { error: Error }) {
	return (
		<div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 bg-zinc-900 p-8 text-center">
			<h1 className="font-black text-3xl text-white">Campaign unavailable</h1>
			<p className="max-w-xl text-sm text-white/70">{error.message}</p>
		</div>
	);
}
