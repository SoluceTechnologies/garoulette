"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction } from "../actions/login.action";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const { execute, isPending, result } = useAction(loginAction);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        execute({ password });
      }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 p-8"
    >
      <h1 className="font-bold text-2xl">Admin</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="rounded-md border border-border px-3 py-2"
        // biome-ignore lint/a11y/noAutofocus: single-field login form, intentional UX
        autoFocus
      />
      {result?.serverError && <p className="text-destructive text-sm">{result.serverError}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "…" : "Log in"}
      </Button>
    </form>
  );
}
