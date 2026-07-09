"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { logoutAction } from "../actions/logout.action";

export function LogoutButton() {
  const { execute, isPending } = useAction(logoutAction);
  return (
    <Button type="button" variant="outline" disabled={isPending} onClick={() => execute()}>
      Log out
    </Button>
  );
}
