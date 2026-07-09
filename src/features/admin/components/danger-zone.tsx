"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { deleteCampaignAction } from "../actions/campaign.action";
import { resetDrawsAction } from "../actions/draws.action";

export function DangerZone({ slug }: { slug: string }) {
  const reset = useAction(resetDrawsAction);
  const del = useAction(deleteCampaignAction);
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-destructive/40 p-4">
      <h2 className="font-bold text-destructive text-xl">Danger zone</h2>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={reset.isPending}
          onClick={() => {
            if (confirm("Reset all draws (restore full stock)?")) reset.execute({ slug });
          }}
        >
          Reset draws
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={del.isPending}
          onClick={() => {
            if (confirm(`Delete "${slug}"? This cannot be undone.`)) del.execute({ slug });
          }}
        >
          Delete campaign
        </Button>
      </div>
    </section>
  );
}
