"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid, isAfter, startOfDay, startOfToday } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerProps = {
  value?: string;
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** When true, dates after today (local calendar) cannot be chosen. */
  disableFuture?: boolean;
};

const toDate = (str?: string): Date | undefined => {
  if (!str) return undefined;
  const d = parse(str, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
};

const DatePicker = ({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  disableFuture,
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);

  const disableFutureDays = React.useMemo(
    () => (disableFuture ? (date: Date) => isAfter(startOfDay(date), startOfToday()) : undefined),
    [disableFuture],
  );

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onChange?.(format(day, "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          {selected ? format(selected, "MMMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          autoFocus
          disabled={disableFutureDays}
        />
      </PopoverContent>
    </Popover>
  );
};

export { DatePicker };
