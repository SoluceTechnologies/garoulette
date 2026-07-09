"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useZodForm } from "@/hooks/use-zod-form";
import { createCampaignAction } from "../actions/campaign.action";
import { createCampaignSchema } from "../schemas/admin.schema";

export function NewCampaignForm() {
  const form = useZodForm({
    schema: createCampaignSchema,
    defaultValues: { slug: "", name: "" },
  });

  const { execute, isPending, result } = useAction(createCampaignAction);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => execute(data))} className="flex max-w-md flex-col gap-4">
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="my-campaign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Campaign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}

        <Button type="submit" disabled={isPending}>
          Create
        </Button>
      </form>
    </Form>
  );
}
