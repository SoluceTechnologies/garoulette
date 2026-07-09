import type { CampaignStats } from "@/features/admin/lib/stats";

export function StatsTable({ stats }: { stats: CampaignStats }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold text-xl">Stats</h2>
      <p className="text-muted-foreground text-sm">Total draws: {stats.totalDraws}</p>
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
