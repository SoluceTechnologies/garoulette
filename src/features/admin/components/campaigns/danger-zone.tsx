"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { deleteCampaignAction } from "../../actions/campaign.action";
import { resetDrawsAction } from "../../actions/draws.action";
import { ConfirmDialog } from "../dialogs/confirm.dialog";

export function DangerZone({ slug }: { slug: string }) {
  const reset = useAction(resetDrawsAction);
  const del = useAction(deleteCampaignAction);
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-destructive/40 p-4">
      <h2 className="font-bold text-destructive text-xl">Danger zone</h2>
      <div className="flex gap-2">
        <ConfirmDialog
          trigger={
            <Button type="button" variant="outline" disabled={reset.isPending}>
              Reset draws
            </Button>
          }
          title="Reset all draws?"
          description="This restores full stock and clears every recorded draw for this campaign."
          confirmLabel="Reset draws"
          pending={reset.isPending}
          onConfirm={() => reset.execute({ slug })}
        />
        <ConfirmDialog
          trigger={
            <Button type="button" variant="destructive" disabled={del.isPending}>
              Delete campaign
            </Button>
          }
          title={`Delete "${slug}"?`}
          description="This permanently deletes the campaign and cannot be undone."
          confirmLabel="Delete campaign"
          variant="destructive"
          pending={del.isPending}
          onConfirm={() => del.execute({ slug })}
        />
      </div>
    </section>
  );
}
