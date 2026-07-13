"use client";

import { Heart, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useZodForm } from "@/hooks/use-zod-form";
import { loginAction } from "../../actions/login.action";
import { loginSchema } from "../../schemas/admin.schema";

export function LoginForm() {
  const form = useZodForm({
    schema: loginSchema,
    defaultValues: { password: "" },
  });

  const { execute, isPending, result } = useAction(loginAction);

  return (
    <>
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

        {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Login
        </Button>
      </form>
      <LoginFooter />
    </>
  );
}

function LoginFooter() {
  return (
    <footer className="-translate-x-1/2 fixed bottom-2 left-1/2 flex w-full items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[11px] text-muted-foreground sm:bottom-4 sm:text-xs">
      <span className="flex items-center gap-1">
        Made with <Heart className="size-3 shrink-0 fill-red-500 text-red-500 animate-pulse" /> by{" "}
        <span className="font-medium text-foreground">Soluce Technologies</span>
      </span>
      <a
        href="https://github.com/SoluceTechnologies/garoulette"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <span className="sr-only">GitHub repository</span>
        <svg className="size-3.5 sm:size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.24 2.76.12 3.05.73.8 1.17 1.83 1.17 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
      </a>
    </footer>
  );
}
