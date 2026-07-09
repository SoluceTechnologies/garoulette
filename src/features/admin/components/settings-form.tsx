"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FONT_OPTIONS } from "@/features/campaign/lib/fonts";
import { type Settings, settingsSchema } from "@/features/campaign/schemas/campaign.schema";
import { useZodForm } from "@/hooks/use-zod-form";
import { saveSettingsAction } from "../actions/campaign.action";
import { ImageField } from "./image-field";

export function SettingsForm({ slug, settings: initial }: { slug: string; settings: Settings }) {
  const form = useZodForm({
    schema: settingsSchema,
    defaultValues: {
      name: initial.name,
      welcomeMessage: initial.welcomeMessage ?? "",
      theme: {
        primaryColor: initial.theme?.primaryColor ?? "#ff6b35",
        secondaryColor: initial.theme?.secondaryColor ?? "#1a1a2e",
        backgroundColor: initial.theme?.backgroundColor ?? "#ffffff",
        font: initial.theme?.font ?? "",
        logo: initial.theme?.logo ?? "",
      },
      enabled: initial.enabled ?? true,
      startAt: initial.startAt ?? "",
      expiresAt: initial.expiresAt ?? "",
      resetDelaySeconds: initial.resetDelaySeconds ?? 6,
      spinDurationSeconds: initial.spinDurationSeconds ?? 4.5,
    },
  });
  const { execute, isPending, result } = useAction(saveSettingsAction);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-xl">Settings</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => execute({ slug, settings: data }))} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome message</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme.primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary colour</FormLabel>
                  <FormControl>
                    <Input type="color" className="h-10 w-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme.secondaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary colour</FormLabel>
                  <FormControl>
                    <Input type="color" className="h-10 w-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme.backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background colour</FormLabel>
                  <FormControl>
                    <Input type="color" className="h-10 w-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme.font"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      {...field}
                    >
                      <option value="">Default</option>
                      {FONT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme.logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <ImageField slug={slug} value={field.value} label="" onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>Enabled</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start at (ISO, optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="2026-07-10T09:00:00Z" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires at (ISO, optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resetDelaySeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reset delay (s)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spinDurationSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spin duration (s)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step="0.5"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <Button type="submit" disabled={isPending}>
              Save settings
            </Button>
          </div>
          {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}
          {result?.data?.ok && <p className="text-sm">Saved.</p>}
        </form>
      </Form>
    </section>
  );
}
