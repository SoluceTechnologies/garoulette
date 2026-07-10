"use client";

import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FONT_OPTIONS } from "@/features/campaign/lib/fonts";
import { type Settings, settingsSchema } from "@/features/campaign/schemas/campaign.schema";
import { useZodForm } from "@/hooks/use-zod-form";
import { saveSettingsAction } from "../../actions/campaign.action";
import { DatetimeField } from "../fields/datetime.field";
import { ImageField } from "../fields/image.field";

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
      spinOnTapAnywhere: initial.spinOnTapAnywhere ?? true,
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
      <form
        {...form}
        onSubmit={form.handleSubmit((data) => execute({ slug, settings: data }))}
        className="flex flex-col gap-4"
      >
        <FieldGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settings-name">Name</FieldLabel>
                <Input {...field} id="settings-name" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="welcomeMessage"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settings-welcome">Welcome message</FieldLabel>
                <Input {...field} id="settings-welcome" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="theme.primaryColor"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="theme-primary">Primary colour</FieldLabel>
                <Input
                  {...field}
                  id="theme-primary"
                  type="color"
                  className="h-10 w-20"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="theme.secondaryColor"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="theme-secondary">Secondary colour</FieldLabel>
                <Input
                  {...field}
                  id="theme-secondary"
                  type="color"
                  className="h-10 w-20"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="theme.backgroundColor"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="theme-background">Background colour</FieldLabel>
                <Input
                  {...field}
                  id="theme-background"
                  type="color"
                  className="h-10 w-20"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="theme.font"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="theme-font">Font</FieldLabel>
                <select
                  {...field}
                  id="theme-font"
                  className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-invalid={fieldState.invalid}
                >
                  <option value="">Default</option>
                  {FONT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="theme.logo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="theme-logo">Logo</FieldLabel>
                <ImageField slug={slug} value={field.value} label="" onChange={field.onChange} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="startAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settings-start">Start at (optional)</FieldLabel>
                <DatetimeField id="settings-start" value={field.value} onChange={field.onChange} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="expiresAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settings-expires">Expires at (optional)</FieldLabel>
                <DatetimeField id="settings-expires" value={field.value} onChange={field.onChange} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="resetDelaySeconds"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settings-reset">Reset delay (s)</FieldLabel>
                <Input
                  {...field}
                  id="settings-reset"
                  type="number"
                  min={1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="spinDurationSeconds"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settings-spin">Spin duration (s)</FieldLabel>
                <Input
                  {...field}
                  id="settings-spin"
                  type="number"
                  min={1}
                  step="0.5"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup className="gap-3">
          <Controller
            name="enabled"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="settings-enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="settings-enabled">Enabled</FieldLabel>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="spinOnTapAnywhere"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="settings-tap-anywhere"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="settings-tap-anywhere">
                  Spin on tap anywhere
                </FieldLabel>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <div>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Save settings
          </Button>
        </div>

        {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}
        {result?.data?.ok && <p className="text-sm">Saved.</p>}
      </form>
    </section>
  );
}
