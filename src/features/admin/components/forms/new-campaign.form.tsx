"use client";

import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { createCampaignAction } from "../../actions/campaign.action";
import { createCampaignSchema } from "../../schemas/admin.schema";
import { useZodForm } from "@/hooks/use-zod-form";
import { slugify } from "@/lib/utils";

export function NewCampaignForm() {
  const form = useZodForm({
    schema: createCampaignSchema,
    defaultValues: { slug: "", name: "" },
  });
  const [slugEdited, setSlugEdited] = useState(false);

  const { execute, isPending, result } = useAction(createCampaignAction);

  return (
    <form
      {...form}
      onSubmit={form.handleSubmit((data) => execute(data))}
      className="flex max-w-md flex-col gap-4"
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="campaign-name">Name</FieldLabel>
              <Input
                {...field}
                id="campaign-name"
                placeholder="My Campaign"
                aria-invalid={fieldState.invalid}
                onChange={(e) => {
                  field.onChange(e);
                  if (!slugEdited) {
                    form.setValue("slug", slugify(e.target.value), {
                      shouldValidate: true,
                    });
                  }
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="campaign-slug">Slug</FieldLabel>
              <Input
                {...field}
                id="campaign-slug"
                placeholder="my-campaign"
                aria-invalid={fieldState.invalid}
                onChange={(e) => {
                  setSlugEdited(true);
                  field.onChange(e);
                }}
              />
              <FieldDescription>
                Auto-generated from the name. Used in the campaign URL.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {result?.serverError && (
        <p className="text-destructive text-sm">{result.serverError}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Create
      </Button>
    </form>
  );
}
