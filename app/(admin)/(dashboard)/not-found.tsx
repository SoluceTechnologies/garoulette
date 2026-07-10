import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-bold text-6xl text-primary tracking-tight">404</p>
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl tracking-tight">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          This campaign doesn&apos;t exist or has been deleted.
        </p>
      </div>
      <Button
        variant="outline"
        render={
          <Link href="/admin/campaigns">
            <ArrowLeft data-icon="inline-start" />
            Back to campaigns
          </Link>
        }
      />
    </div>
  );
}
