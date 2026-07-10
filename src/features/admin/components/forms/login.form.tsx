"use client";

import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { loginAction } from "../../actions/login.action";
import { loginSchema } from "../../schemas/admin.schema";
import { useZodForm } from "@/hooks/use-zod-form";

export function LoginForm() {
  const form = useZodForm({
    schema: loginSchema,
    defaultValues: { password: "" },
  });

  const { execute, isPending, result } = useAction(loginAction);

  return (
    <form
      {...form}
      onSubmit={form.handleSubmit((values) => execute(values))}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 p-8"
    >
      <FieldGroup>
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Input
                {...field}
                id="login-password"
                type="password"
                placeholder="Password"
                autoFocus
                aria-invalid={fieldState.invalid}
              />
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
        Login
      </Button>
    </form>
  );
}
