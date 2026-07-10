import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center">
      <Loader2 className="size-10 animate-spin text-muted-foreground" />
    </main>
  );
}
