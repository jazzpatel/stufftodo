import React from "react";
import type { ViewMode } from "../types";
import {
  today,
  addDays,
  addMonths,
  formatDayShort,
  formatMonthYear,
  formatWeekRange,
} from "../utils/dates";

interface Props {
  view: ViewMode;
  date: string;
  onChange: (d: string) => void;
}

export function CalendarNav({ view, date, onChange }: Props) {
  const label =
    view === "day"
      ? formatDayShort(date)
      : view === "week"
        ? formatWeekRange(date)
        : formatMonthYear(date);

  const prev = () =>
    onChange(
      view === "day"
        ? addDays(date, -1)
        : view === "week"
          ? addDays(date, -7)
          : addMonths(date, -1),
    );
  const next = () =>
    onChange(
      view === "day"
        ? addDays(date, 1)
        : view === "week"
          ? addDays(date, 7)
          : addMonths(date, 1),
    );

  return (
    <div className="cal-nav">
      <button className="cal-nav-btn" onClick={prev} aria-label="Previous">
        ‹
      </button>
      <button className="cal-nav-today" onClick={() => onChange(today())}>
        Today
      </button>
      <span className="cal-nav-label">{label}</span>
      <button className="cal-nav-btn" onClick={next} aria-label="Next">
        ›
      </button>
    </div>
  );
}
