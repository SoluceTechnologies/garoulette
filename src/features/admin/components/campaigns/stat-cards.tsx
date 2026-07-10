import { Gift, Megaphone, Radio, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-medium text-muted-foreground text-sm">
          {label}
          <Icon className="size-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-bold text-3xl tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export function StatCards({
  campaigns,
  active,
  prizes,
  draws,
}: {
  campaigns: number;
  active: number;
  prizes: number;
  draws: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Campaigns" value={campaigns} icon={Megaphone} />
      <StatCard label="Active" value={active} icon={Radio} />
      <StatCard label="Prizes" value={prizes} icon={Gift} />
      <StatCard label="Draws" value={draws} icon={Ticket} />
    </div>
  );
}
