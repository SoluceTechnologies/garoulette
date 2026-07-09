"use client";

import { useState } from "react";

type Props = {
  slug: string;
  value?: string;
  onChange: (filename: string) => void;
  label: string;
};

type UploadResponse = { filename?: string; error?: string };

/**
 * Uploads via a plain Route Handler (`/api/upload`) rather than a next-safe-action
 * Server Action: Server Actions cap request bodies at 1MB by default, below the 5MB image
 * cap enforced by `saveImage`. The public contract (`slug`/`value`/`onChange`/`label`) is
 * transport-agnostic so consumers don't need to care.
 */
export function ImageField({ slug, value, onChange, label }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium text-sm">{label}</span>
      {value && <span className="text-muted-foreground text-xs">{value}</span>}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={isPending}
        onChange={async (e) => {
          const input = e.target;
          const file = input.files?.[0];
          if (!file) return;

          setError(null);
          setIsPending(true);
          try {
            const formData = new FormData();
            formData.append("slug", slug);
            formData.append("file", file);
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            const data = (await res.json().catch(() => null)) as UploadResponse | null;
            if (!res.ok || !data?.filename) {
              throw new Error(data?.error ?? "Upload failed");
            }
            onChange(data.filename);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setIsPending(false);
            input.value = "";
          }
        }}
      />
      {isPending && <span className="text-xs">Uploading…</span>}
      {error && <span className="text-destructive text-xs">{error}</span>}
    </label>
  );
}
