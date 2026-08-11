import React, { useState } from "react";
import type { Task } from "../types";
import { TaskItem } from "../components/TaskItem";
import { QuickAdd } from "../components/QuickAdd";
import { sortTasks } from "../utils/taskUtils";
import { weekDays, isToday, formatDayShort, getDayColor } from "../utils/dates";

// ─── Horizontal week-strip ────────────────────────────────────────────────────
function DayStrip({
  selectedDate,
  tasks,
  onSelectDay,
}: {
  selectedDate: string;
  tasks: Task[];
  onSelectDay: (d: string) => void;
}) {
  const days = weekDays(selectedDate);
  return (
    <div className="day-strip">
      {days.map((day) => {
        const count = tasks.filter((t) => t.dueDate === day && !t.done).length;
        const color = getDayColor(day);
        const label = formatDayShort(day).split(" ");
        return (
          <button
            key={day}
            className={[
              "day-chip",
              day === selectedDate ? "active" : "",
              isToday(day) ? "today" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ "--day-color": color } as React.CSSProperties}
            onClick={() => onSelectDay(day)}
          >
            <span className="day-chip-dow">{label[0]}</span>
            <span className="day-chip-num">{label[1]}</span>
            {count > 0 && <span className="day-chip-badge">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

interface Props {
  tasks: Task[];
  date: string;
  query: string;
  onToggleDone: (id: string) => void;
  onOpen: (t: Task) => void;
  onQuickAdd: (text: string, dueDate: string | null) => void;
  onNewTask: (dueDate?: string | null) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (date: string | null) => void;
  onSelectDay: (d: string) => void;
}

export function DayView({
  tasks,
  date,
  query,
  onToggleDone,
  onOpen,
  onQuickAdd,
  onNewTask,
  onDragStart,
  onDrop,
  onSelectDay,
}: Props) {
  const [dropOver, setDropOver] = useState(false);
  const q = query.toLowerCase();
  const dayTasks = sortTasks(
    tasks.filter(
      (t) =>
        t.dueDate === date &&
        (t.text.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)),
    ),
  );
  const inbox = sortTasks(
    tasks.filter(
      (t) =>
        !t.dueDate &&
        (t.text.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)),
    ),
  );

  return (
    <div className="day-view">
      <DayStrip selectedDate={date} tasks={tasks} onSelectDay={onSelectDay} />

      <div
        className={`day-tasks${dropOver ? " drop-target" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDropOver(true);
        }}
        onDragLeave={() => setDropOver(false)}
        onDrop={() => {
          onDrop(date);
          setDropOver(false);
        }}
      >
        <ul className="tasks">
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
            <li className="empty">No tasks for this day.</li>
          )}
        </ul>
      </div>

      <QuickAdd
        placeholder={`Add for ${formatDayShort(date)}… try 'call Sam tomorrow'`}
        defaultDate={date}
        onAdd={onQuickAdd}
        onNewTask={onNewTask}
      />

      {inbox.length > 0 && (
        <details className="inbox-section">
          <summary>📋 Inbox — unscheduled ({inbox.length})</summary>
          <ul className="tasks">
            {inbox.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggleDone={() => onToggleDone(t.id)}
                onOpen={() => onOpen(t)}
                draggable
                onDragStart={(e) => onDragStart(e, t.id)}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
