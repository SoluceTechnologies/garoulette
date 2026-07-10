"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyPublicLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/campaign/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <Button type="button" variant="outline" onClick={copy}>
      {copied ? (
        <Check data-icon="inline-start" />
      ) : (
        <Link2 data-icon="inline-start" />
      )}
      {copied ? "Copied!" : "Copy public link"}
    </Button>
  );
}
