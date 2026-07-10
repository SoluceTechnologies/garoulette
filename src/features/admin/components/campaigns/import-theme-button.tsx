"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { importThemeAction } from "@/features/admin/actions/transfer.action";

export function ImportThemeButton({ slug }: { slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { execute, isPending, result } = useAction(importThemeAction, {
    onSuccess: () => router.refresh(),
  });

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) execute({ slug, file });
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" accept=".zip" hidden onChange={onChange} />
      <Button type="button" variant="outline" disabled={isPending} onClick={() => inputRef.current?.click()}>
        {isPending ? "Importing…" : "Import theme"}
      </Button>
      {result.serverError && <span className="text-destructive text-sm">{result.serverError}</span>}
    </div>
  );
}
