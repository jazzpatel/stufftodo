import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "../types";
import { TaskItem } from "../components/TaskItem";
import { sortTasks } from "../utils/taskUtils";
import { weekDays, isToday, formatDayShort, getDayColor } from "../utils/dates";

interface Props {
  tasks: Task[];
  baseDate: string;
  onToggleDone: (id: string) => void;
  onOpen: (t: Task) => void;
  onNewTask: (dueDate?: string | null) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (date: string | null) => void;
}

export function WeekView({
  tasks,
  baseDate,
  onToggleDone,
  onOpen,
  onNewTask,
  onDragStart,
  onDrop,
}: Props) {
  const [dropOver, setDropOver] = useState<string | null>(null);
  const [fabVisible, setFabVisible] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Map from ISO date string → row DOM element
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const days = weekDays(baseDate);
  console.log("WeekView> days: ", days);
  const todayStr = days.find((d) => isToday(d)) ?? null;

  // Show FAB only when the today row is scrolled out of view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !todayStr) {
      setFabVisible(false);
      return;
    }

    const check = () => {
      const todayEl = rowRefs.current.get(todayStr);
      if (!todayEl) return;
      const { top, bottom } = todayEl.getBoundingClientRect();
      const inView = top < window.innerHeight && bottom > 0;
      setFabVisible(!inView);
    };

    check();
    container.addEventListener("scroll", check, { passive: true });
    return () => container.removeEventListener("scroll", check);
  }, [todayStr, baseDate]);

  const scrollToToday = useCallback(() => {
    const todayEl = todayStr && rowRefs.current.get(todayStr);
    if (todayEl) todayEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [todayStr]);

  // Scroll to today automatically when the week changes and today is in it
  useEffect(() => {
    if (!todayStr) return;
    const id = requestAnimationFrame(() => {
      rowRefs.current
        .get(todayStr)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [baseDate, todayStr]);

  return (
    <div className="week-view-v" ref={scrollRef}>
      {days.map((day) => {
        const dayTasks = sortTasks(tasks.filter((t) => t.dueDate === day));
        const color = getDayColor(day);
        const todayRow = isToday(day);
        const d = new Date(day + "T00:00:00");
        const dowLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          d.getDay()
        ];
        const dateNum = d.getDate();
        console.log("WeekView> date: ", dateNum);
        console.log("WeekView> dowLabel: ", dowLabel);
        return (
          <div
            key={day}
            ref={(el) => {
              if (el) rowRefs.current.set(day, el);
              else rowRefs.current.delete(day);
            }}
            className={[
              "week-row",
              todayRow ? "today" : "",
              dropOver === day ? "drop-target" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ "--day-color": color } as React.CSSProperties}
            onDragOver={(e) => {
              e.preventDefault();
              setDropOver(day);
            }}
            onDragLeave={() => setDropOver(null)}
            onDrop={() => {
              onDrop(day);
              setDropOver(null);
            }}
          >
            {/* ── Day header ── */}
            <div className="week-row-header">
              <div className="week-row-badge" style={{ background: color }}>
                <span className="week-row-dow">{dowLabel}</span>
                <span className="week-row-num">{dateNum}</span>
              </div>
              <span className="week-row-title">{formatDayShort(day)}</span>
              {todayRow && <span className="week-row-today-pill">Today</span>}
              <span style={{ flex: 1 }} />
              <span className="week-row-count">
                {dayTasks.filter((t) => !t.done).length > 0 &&
                  `${dayTasks.filter((t) => !t.done).length} task${dayTasks.filter((t) => !t.done).length === 1 ? "" : "s"}`}
              </span>
              <button
                className="week-add"
                onClick={() => onNewTask(day)}
                aria-label="Add task"
              >
                ＋
              </button>
            </div>

            {/* ── Tasks ── */}
            <ul className="tasks week-row-tasks">
              {dayTasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggleDone={() => onToggleDone(t.id)}
                  onOpen={() => onOpen(t)}
                  draggable
                  onDragStart={(e) => onDragStart(e, t.id)}
                />
              ))}
              {dayTasks.length === 0 && (
                <li className="week-row-empty">
                  No tasks — drop one here or tap ＋
                </li>
              )}
            </ul>
          </div>
        );
      })}

      {/* ── Floating "scroll to today" button ── */}
      {todayStr && fabVisible && (
        <button
          className="week-today-fab"
          onClick={scrollToToday}
          aria-label="Scroll to today"
        >
          <span className="week-today-fab-icon">☀</span>
          <span className="week-today-fab-label">Today</span>
        </button>
      )}
    </div>
  );
}
