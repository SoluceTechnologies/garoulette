import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Availability } from "@/features/campaign/lib/availability";
import { CampaignRowActions } from "./row-actions";

export type CampaignRow = {
  slug: string;
  name: string;
  prizeCount: number;
  totalDraws: number;
  availability: Availability;
};

const availabilityBadge: Record<
  Availability,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  notStarted: { label: "Not started", variant: "secondary" },
  expired: { label: "Expired", variant: "destructive" },
  disabled: { label: "Disabled", variant: "outline" },
};

export function CampaignsTable({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead className="text-right">Prizes</TableHead>
          <TableHead className="text-right">Draws</TableHead>
          <TableHead>Availability</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((c) => {
          const badge = availabilityBadge[c.availability];
          return (
            <TableRow key={c.slug}>
              <TableCell>
                <Link
                  href={`/admin/campaigns/${c.slug}`}
                  className="font-semibold underline"
                >
                  {c.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{c.slug}</TableCell>
              <TableCell className="text-right">{c.prizeCount}</TableCell>
              <TableCell className="text-right">{c.totalDraws}</TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
              <TableCell>
                <CampaignRowActions slug={c.slug} />
              </TableCell>
            </TableRow>
          );
        })}
        {campaigns.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-muted-foreground">
              No campaigns yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
