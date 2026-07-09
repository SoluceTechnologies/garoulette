"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createCampaignAction } from "../actions/campaign.action";

export function NewCampaignForm() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const { execute, isPending, result } = useAction(createCampaignAction);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        execute({ slug, name });
      }}
      className="flex max-w-md flex-col gap-4"
    >
      <label className="flex flex-col gap-1">
        <span className="font-medium text-sm">Slug</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-campaign"
          className="rounded-md border border-border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-medium text-sm">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Campaign"
          className="rounded-md border border-border px-3 py-2"
        />
      </label>
      {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}
      {result?.validationErrors && <p className="text-destructive text-sm">Check slug/name format.</p>}
      <Button type="submit" disabled={isPending}>
        Create
      </Button>
    </form>
  );
}
