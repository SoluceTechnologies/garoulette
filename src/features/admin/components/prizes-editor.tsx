"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Prize } from "@/features/campaign/schemas/campaign.schema";
import { savePrizesAction } from "../actions/prizes.action";
import { ImageField } from "./image-field";

function emptyPrize(): Prize {
  return {
    id: crypto.randomUUID(),
    name: "",
    image: "",
    initialStock: 0,
    weight: 1,
  };
}

export function PrizesEditor({ slug, prizes: initial }: { slug: string; prizes: Prize[] }) {
  const [prizes, setPrizes] = useState<Prize[]>(initial);
  const { execute, isPending, result } = useAction(savePrizesAction);

  const update = (i: number, patch: Partial<Prize>) =>
    setPrizes((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-xl">Prizes</h2>
      <div className="flex flex-col gap-4">
        {prizes.map((p, i) => (
          <div key={p.id} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Name</span>
              <input
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Colour</span>
              <input
                type="color"
                value={p.color ?? "#888888"}
                onChange={(e) => update(i, { color: e.target.value })}
                className="h-10 w-20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Initial stock</span>
              <input
                type="number"
                min={0}
                value={p.initialStock}
                onChange={(e) => update(i, { initialStock: Number(e.target.value) })}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Weight</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={p.weight}
                onChange={(e) => update(i, { weight: Number(e.target.value) })}
                className="rounded-md border border-border px-3 py-2"
              />
            </label>
            <ImageField
              slug={slug}
              value={p.image}
              label="Image"
              onChange={(filename) => update(i, { image: filename })}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrizes((ps) => ps.filter((_, idx) => idx !== i))}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setPrizes((ps) => [...ps, emptyPrize()])}>
          Add prize
        </Button>
        <Button type="button" disabled={isPending} onClick={() => execute({ slug, prizes })}>
          Save prizes
        </Button>
      </div>
      {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}
      {result?.data?.ok && <p className="text-sm">Saved.</p>}
    </section>
  );
}
