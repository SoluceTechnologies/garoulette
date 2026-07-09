"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { deleteCampaignAction } from "../actions/campaign.action";
import { resetDrawsAction } from "../actions/draws.action";

export function CampaignRowActions({ slug }: { slug: string }) {
  const del = useAction(deleteCampaignAction);
  const reset = useAction(resetDrawsAction);
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={reset.isPending}
        onClick={() => {
          if (confirm(`Reset draws for "${slug}"?`)) reset.execute({ slug });
        }}
      >
        Reset draws
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={del.isPending}
        onClick={() => {
          if (confirm(`Delete campaign "${slug}"? This cannot be undone.`)) del.execute({ slug });
        }}
      >
        Delete
      </Button>
    </div>
  );
}
