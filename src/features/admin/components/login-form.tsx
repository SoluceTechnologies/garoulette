"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useZodForm } from "@/hooks/use-zod-form";
import { loginAction } from "../actions/login.action";
import { loginSchema } from "../schemas/admin.schema";

export function LoginForm() {
  const form = useZodForm({
    schema: loginSchema,
    defaultValues: { password: "" },
  });

  const { execute, isPending, result } = useAction(loginAction);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => execute(values))}
        className="mx-auto flex w-full max-w-sm flex-col gap-4 p-8"
      >
        <h1 className="font-bold text-2xl">Admin</h1>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}

        <Button type="submit" disabled={isPending}>
          {isPending ? "…" : "Log in"}
        </Button>
      </form>
    </Form>
  );
}
