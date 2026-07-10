"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { deleteCampaignAction } from "../../actions/campaign.action";
import { resetDrawsAction } from "../../actions/draws.action";
import { ConfirmDialog } from "../dialogs/confirm.dialog";

export function CampaignRowActions({ slug }: { slug: string }) {
  const del = useAction(deleteCampaignAction);
  const reset = useAction(resetDrawsAction);
  return (
    <div className="flex justify-end gap-2">
      <ConfirmDialog
        trigger={
          <Button type="button" variant="outline" size="sm" disabled={reset.isPending}>
            Reset draws
          </Button>
        }
        title={`Reset draws for "${slug}"?`}
        description="This restores full stock and clears every recorded draw for this campaign."
        confirmLabel="Reset draws"
        pending={reset.isPending}
        onConfirm={() => reset.execute({ slug })}
      />
      <ConfirmDialog
        trigger={
          <Button type="button" variant="destructive" size="sm" disabled={del.isPending}>
            Delete
          </Button>
        }
        title={`Delete campaign "${slug}"?`}
        description="This permanently deletes the campaign and cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        pending={del.isPending}
        onConfirm={() => del.execute({ slug })}
      />
    </div>
  );
}
