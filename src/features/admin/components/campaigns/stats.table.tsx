import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignStats } from "@/features/admin/lib/stats";

export function StatsTable({ stats }: { stats: CampaignStats }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold text-xl">Stats</h2>
      <p className="text-muted-foreground text-sm">Total draws: {stats.totalDraws}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prize</TableHead>
            <TableHead className="text-right">Initial</TableHead>
            <TableHead className="text-right">Drawn</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.prizes.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell className="text-right">{p.initialStock}</TableCell>
              <TableCell className="text-right">{p.drawn}</TableCell>
              <TableCell className="text-right">{p.remaining}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
