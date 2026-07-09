"use client";

import { useAction } from "next-safe-action/hooks";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type Prize, prizeSchema } from "@/features/campaign/schemas/campaign.schema";
import { useZodForm } from "@/hooks/use-zod-form";
import { savePrizesAction } from "../actions/prizes.action";
import { ImageField } from "./image-field";

const prizesFormSchema = z.object({ prizes: z.array(prizeSchema) });

export function PrizesEditor({ slug, prizes: initial }: { slug: string; prizes: Prize[] }) {
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
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-xl">Prizes</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => execute({ slug, prizes: data.prizes }))}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-4">
            {fields.map((item, i) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`prizes.${i}.name`}
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
                  name={`prizes.${i}.color`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colour</FormLabel>
                      <FormControl>
                        <Input type="color" className="h-10 w-20" {...field} value={field.value ?? "#888888"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`prizes.${i}.initialStock`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`prizes.${i}.weight`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`prizes.${i}.image`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <ImageField slug={slug} value={field.value} label="" onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={() => remove(i)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  id: crypto.randomUUID(),
                  name: "",
                  image: "",
                  initialStock: 0,
                  weight: 1,
                })
              }
            >
              Add prize
            </Button>
            <Button type="submit" disabled={isPending}>
              Save prizes
            </Button>
          </div>
          {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}
          {result?.data?.ok && <p className="text-sm">Saved.</p>}
        </form>
      </Form>
    </section>
  );
}
