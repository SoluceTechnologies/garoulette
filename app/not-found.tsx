import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-bold text-6xl text-primary tracking-tight">404</p>
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl tracking-tight">
          This page spun off the wheel
        </h1>
        <p className="text-muted-foreground text-sm">
          The campaign you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
      </div>
      <Button
        variant="outline"
        render={
          <Link href="/">
            <ArrowLeft data-icon="inline-start" />
            Back to campaigns
          </Link>
        }
      />
    </main>
  );
}
