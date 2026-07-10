import type * as React from "react";

import { cn } from "@/lib/utils";

function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page"
      className={cn("flex w-full flex-col gap-6", className)}
      {...props}
    />
  );
}

function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-content"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn("font-bold text-2xl tracking-tight", className)}
      {...props}
    />
  );
}

function PageDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function PageActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function PageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-content"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  );
}

function PageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-footer"
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-border border-t pt-6",
        className,
      )}
      {...props}
    />
  );
}

export {
  Page,
  PageHeader,
  PageHeaderContent,
  PageTitle,
  PageDescription,
  PageActions,
  PageContent,
  PageFooter,
};
