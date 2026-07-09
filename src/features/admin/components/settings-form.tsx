"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FONT_OPTIONS } from "@/features/campaign/lib/fonts";
import type { Settings } from "@/features/campaign/schemas/campaign.schema";
import { saveSettingsAction } from "../actions/campaign.action";
import { ImageField } from "./image-field";

export function SettingsForm({ slug, settings: initial }: { slug: string; settings: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const theme = s.theme ?? {};
  const { execute, isPending, result } = useAction(saveSettingsAction);
  const setTheme = (patch: Partial<NonNullable<Settings["theme"]>>) =>
    setS((prev) => ({ ...prev, theme: { ...prev.theme, ...patch } }));

  const text = (v?: string) => v ?? "";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-xl">Settings</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Name</span>
          <input
            value={s.name}
            onChange={(e) => setS({ ...s, name: e.target.value })}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Welcome message</span>
          <input
            value={text(s.welcomeMessage)}
            onChange={(e) => setS({ ...s, welcomeMessage: e.target.value })}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Primary colour</span>
          <input
            type="color"
            value={text(theme.primaryColor) || "#ff6b35"}
            onChange={(e) => setTheme({ primaryColor: e.target.value })}
            className="h-10 w-20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Secondary colour</span>
          <input
            type="color"
            value={text(theme.secondaryColor) || "#1a1a2e"}
            onChange={(e) => setTheme({ secondaryColor: e.target.value })}
            className="h-10 w-20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Background colour</span>
          <input
            type="color"
            value={text(theme.backgroundColor) || "#ffffff"}
            onChange={(e) => setTheme({ backgroundColor: e.target.value })}
            className="h-10 w-20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Font</span>
          <select
            value={text(theme.font)}
            onChange={(e) => setTheme({ font: e.target.value })}
            className="rounded-md border border-border px-3 py-2"
          >
            <option value="">Default</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <ImageField slug={slug} value={theme.logo} label="Logo" onChange={(filename) => setTheme({ logo: filename })} />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={s.enabled ?? true}
            onChange={(e) => setS({ ...s, enabled: e.target.checked })}
          />
          <span className="text-sm">Enabled</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Start at (ISO, optional)</span>
          <input
            value={text(s.startAt)}
            onChange={(e) => setS({ ...s, startAt: e.target.value || undefined })}
            placeholder="2026-07-10T09:00:00Z"
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Expires at (ISO, optional)</span>
          <input
            value={text(s.expiresAt)}
            onChange={(e) => setS({ ...s, expiresAt: e.target.value || undefined })}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Reset delay (s)</span>
          <input
            type="number"
            min={1}
            value={s.resetDelaySeconds ?? 6}
            onChange={(e) => setS({ ...s, resetDelaySeconds: Number(e.target.value) })}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Spin duration (s)</span>
          <input
            type="number"
            min={1}
            step="0.5"
            value={s.spinDurationSeconds ?? 4.5}
            onChange={(e) => setS({ ...s, spinDurationSeconds: Number(e.target.value) })}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
      </div>
      <div>
        <Button type="button" disabled={isPending} onClick={() => execute({ slug, settings: s })}>
          Save settings
        </Button>
      </div>
      {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}
      {result?.data?.ok && <p className="text-sm">Saved.</p>}
    </section>
  );
}
