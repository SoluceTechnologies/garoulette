"use client";

import { CalendarIcon, Clock2Icon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseIso(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function timeValue(date: Date | undefined): string {
  if (!date) return "00:00:00";
  return date.toTimeString().slice(0, 8);
}

const dateLabelFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DatetimeField({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  id?: string;
  value: string | undefined;
  onChange: (iso: string) => void;
  placeholder?: string;
}) {
  const date = parseIso(value ?? "");

  function handleDay(day: Date | undefined) {
    if (!day) {
      onChange("");
      return;
    }
    const base = date ?? new Date();
    day.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), 0);
    onChange(day.toISOString());
  }

  function handleTime(e: React.ChangeEvent<HTMLInputElement>) {
    const [h, m, s] = e.target.value.split(":").map(Number);
    const next = date ? new Date(date) : new Date();
    next.setHours(h || 0, m || 0, s || 0, 0);
    onChange(next.toISOString());
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            className={cn(
              "justify-start font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {date ? dateLabelFmt.format(date) : placeholder}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto">
        <Calendar mode="single" selected={date} onSelect={handleDay} />
        <InputGroup>
          <InputGroupInput
            type="time"
            step="1"
            value={timeValue(date)}
            onChange={handleTime}
            className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <InputGroupAddon>
            <Clock2Icon />
          </InputGroupAddon>
        </InputGroup>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!date}
          onClick={() => onChange("")}
        >
          <X data-icon="inline-start" />
          Clear
        </Button>
      </PopoverContent>
    </Popover>
  );
}
