import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Dashboard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard"
      className={cn("flex min-h-full flex-1 flex-col bg-muted/30", className)}
      {...props}
    />
  );
}

function DashboardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <header
      data-slot="dashboard-header"
      className="sticky top-0 z-40 border-border border-b bg-background/80 backdrop-blur"
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-3",
          className,
        )}
        {...props}
      />
    </header>
  );
}

function DashboardBrand({
  href = "/admin/campaigns",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & {
  href?: React.ComponentProps<typeof Link>["href"];
}) {
  return (
    <Link
      href={href}
      data-slot="dashboard-brand"
      className={cn("font-bold text-lg tracking-tight", className)}
      {...props}
    />
  );
}

function DashboardNav({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="dashboard-nav"
      className={cn("flex items-center gap-1 text-sm", className)}
      {...props}
    />
  );
}

function DashboardNavLink({
  active,
  className,
  ...props
}: React.ComponentProps<typeof Link> & { active?: boolean }) {
  return (
    <Link
      data-slot="dashboard-nav-link"
      data-active={active}
      className={cn(
        "rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DashboardActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard-actions"
      className={cn("ml-auto flex items-center gap-2", className)}
      {...props}
    />
  );
}

function DashboardContent({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="dashboard-content"
      className={cn("mx-auto w-full max-w-6xl flex-1 px-6 py-8", className)}
      {...props}
    />
  );
}

export {
  Dashboard,
  DashboardHeader,
  DashboardBrand,
  DashboardNav,
  DashboardNavLink,
  DashboardActions,
  DashboardContent,
};
