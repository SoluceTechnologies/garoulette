"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { prizeImageUrl } from "@/features/campaign/lib/images";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  value?: string;
  onChange: (filename: string) => void;
  label?: string;
};

type UploadResponse = { filename?: string; error?: string };

export function ImageField({ slug, value, onChange, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
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
      const data = (await res
        .json()
        .catch(() => null)) as UploadResponse | null;
      if (!res.ok || !data?.filename) {
        throw new Error(data?.error ?? "Upload failed");
      }
      onChange(data.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="font-medium text-sm">{label}</span>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {value ? (
        <div className="relative w-fit">
          <button
            type="button"
            disabled={isPending}
            aria-label="Replace image"
            onClick={() => inputRef.current?.click()}
            className="group relative block size-20 overflow-hidden rounded-2xl border border-border bg-card outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none"
          >
            {/* biome-ignore lint/performance/noImgElement: runtime volume file, not a build-time asset */}
            <img
              src={prizeImageUrl(slug, value)}
              alt=""
              className="size-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              {isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Upload className="size-5" />
              )}
            </span>
          </button>
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            disabled={isPending}
            aria-label="Remove image"
            onClick={() => onChange("")}
            className="-right-2 -top-2 absolute rounded-full"
          >
            <X />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isPending}
          title="Upload image (PNG, JPEG or WebP · max 5MB)"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex size-20 flex-col items-center justify-center gap-1 rounded-2xl border border-border border-dashed bg-input/30 text-muted-foreground text-xs transition-colors",
            "hover:border-ring hover:bg-input/50 disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImageIcon className="size-5" />
          )}
          {isPending ? "Uploading…" : "Upload"}
        </button>
      )}

      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
