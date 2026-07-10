"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  variant = "default",
  pending = false,
  onConfirm,
}: {
  trigger: React.ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "default" | "destructive";
  pending?: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            disabled={pending}
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
