import React from "react";
import type { Task } from "../types";
import { monthCells, isToday, DAY_COLORS } from "../utils/dates";

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface Props {
  tasks: Task[];
  baseDate: string;
  onSelectDay: (date: string) => void;
}

export function MonthView({ tasks, baseDate, onSelectDay }: Props) {
  const cells = monthCells(baseDate);

  return (
    <div className="month-view">
      <div className="month-dow-row">
        {DOW_LABELS.map((d, i) => (
          <div key={d} className="month-dow" style={{ color: DAY_COLORS[i] }}>
            {d}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((cell, i) => {
          if (!cell)
            return <div key={`pad-${i}`} className="month-cell empty" />;
          const all = tasks.filter((t) => t.dueDate === cell);
          const undone = all.filter((t) => !t.done);
          const dow = new Date(cell + "T00:00:00").getDay();
          return (
            <div
              key={cell}
              className={[
                "month-cell",
                isToday(cell) ? "today" : "",
                all.length ? "has-tasks" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDay(cell)}
            >
              <span
                className="month-num"
                style={{ color: isToday(cell) ? undefined : DAY_COLORS[dow] }}
              >
                {new Date(cell + "T00:00:00").getDate()}
              </span>
              {undone.length > 0 && (
                <span className="month-dots">
                  {undone.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="month-dot"
                      style={{
                        background:
                          t.priority === "high" || t.important
                            ? "#ef4444"
                            : t.priority === "medium"
                              ? "#f59e0b"
                              : "#3b82f6",
                      }}
                    />
                  ))}
                  {undone.length > 3 && (
                    <span className="month-more">+{undone.length - 3}</span>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
