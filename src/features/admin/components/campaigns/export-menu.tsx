"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExportMenu({ slug }: { slug: string }) {
  const download = (type: "theme" | "stats" | "campaign") =>
    window.location.assign(`/api/admin/campaigns/${slug}/export?type=${type}`);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="outline">
            Export
            <ChevronDown className="ml-1 size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => download("theme")}>Theme</DropdownMenuItem>
        <DropdownMenuItem onClick={() => download("stats")}>Stats</DropdownMenuItem>
        <DropdownMenuItem onClick={() => download("campaign")}>Campaign</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
