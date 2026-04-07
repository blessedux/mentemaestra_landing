"use client";

import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";

const CalendarDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div>
      <Calendar
        mode="single"
        defaultMonth={date}
        selected={date}
        onSelect={setDate}
        className="rounded-lg border"
      />
      <p
        className="mt-3 text-center text-xs text-muted-foreground"
        role="region"
      >
        Default Month
      </p>
    </div>
  );
};

export default CalendarDemo;
