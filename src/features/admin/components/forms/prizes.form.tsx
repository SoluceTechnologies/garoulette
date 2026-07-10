"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Controller, useFieldArray } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type Prize,
  prizeSchema,
} from "@/features/campaign/schemas/campaign.schema";
import { useZodForm } from "@/hooks/use-zod-form";
import { savePrizesAction } from "../../actions/prizes.action";
import { ImageField } from "../fields/image.field";

const prizesFormSchema = z.object({ prizes: z.array(prizeSchema) });

function emptyPrize(): Prize {
  return {
    id: crypto.randomUUID(),
    name: "",
    image: "",
    initialStock: 0,
    weight: 1,
  };
}

export function PrizesEditor({
  slug,
  prizes: initial,
}: {
  slug: string;
  prizes: Prize[];
}) {
  const form = useZodForm({
    schema: prizesFormSchema,
    defaultValues: { prizes: initial },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "prizes",
  });

  const { execute, isPending, result } = useAction(savePrizesAction);

  return (
    <form
      {...form}
      onSubmit={form.handleSubmit((data) =>
        execute({ slug, prizes: data.prizes }),
      )}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-xl">Prizes</h2>
          <p className="text-muted-foreground text-sm">
            {fields.length} {fields.length === 1 ? "prize" : "prizes"} · wheel
            segments and their odds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => append(emptyPrize())}
          >
            <Plus data-icon="inline-start" />
            Add prize
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Save prizes
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {fields.map((item, i) => (
          <Card key={item.id} className="bg-transparent">

            <CardHeader>
              <CardTitle>Prize {i + 1}</CardTitle>
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove prize"
                  onClick={() => remove(i)}
                >
                  <Trash2 />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row">
              <Controller
                name={`prizes.${i}.image`}
                control={form.control}
                render={({ field }) => (
                  <ImageField
                    slug={slug}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <FieldGroup className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                <Controller
                  name={`prizes.${i}.name`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                      <FieldLabel htmlFor={`prize-${i}-name`}>Name</FieldLabel>
                      <Input
                        {...field}
                        id={`prize-${i}-name`}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name={`prizes.${i}.initialStock`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`prize-${i}-stock`}>
                        Initial stock
                      </FieldLabel>
                      <Input
                        {...field}
                        id={`prize-${i}-stock`}
                        type="number"
                        min={0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name={`prizes.${i}.weight`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`prize-${i}-weight`}>Weight</FieldLabel>
                      <Input
                        {...field}
                        id={`prize-${i}-weight`}
                        type="number"
                        min={0}
                        step="0.1"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name={`prizes.${i}.color`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`prize-${i}-color`}>Colour</FieldLabel>
                      <Input
                        {...field}
                        id={`prize-${i}-color`}
                        type="color"
                        className="h-10 w-20"
                        value={field.value ?? "#888888"}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        ))}

        {fields.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border border-dashed py-10 text-center">
            <p className="text-muted-foreground text-sm">No prizes yet.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => append(emptyPrize())}
            >
              <Plus data-icon="inline-start" />
              Add prize
            </Button>
          </div>
        )}
      </div>

      {result?.serverError && (
        <p className="text-destructive text-sm">{result.serverError}</p>
      )}
      {result?.data?.ok && <p className="text-sm">Saved.</p>}
    </form>
  );
}
