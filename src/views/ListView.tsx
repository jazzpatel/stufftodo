import React from "react";
import type { Task } from "../types";
import { TaskItem } from "../components/TaskItem";
import { QuickAdd } from "../components/QuickAdd";
import { sortTasks } from "../utils/taskUtils";

interface Props {
  tasks: Task[];
  query: string;
  onToggleDone: (id: string) => void;
  onOpen: (t: Task) => void;
  onQuickAdd: (text: string, dueDate: string | null) => void;
  onNewTask: (dueDate?: string | null) => void;
}

export function ListView({
  tasks,
  query,
  onToggleDone,
  onOpen,
  onQuickAdd,
  onNewTask,
}: Props) {
  const q = query.toLowerCase();
  const filtered = sortTasks(
    tasks.filter(
      (t) =>
        t.text.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q),
    ),
  );
  const pinned = filtered.filter((t) => t.pinned);
  const inbox = filtered.filter((t) => !t.pinned && !t.dueDate);
  const scheduled = filtered.filter((t) => !t.pinned && !!t.dueDate);

  const section = (items: Task[], heading: string) =>
    items.length === 0 ? null : (
      <>
        <li className="task-section-header">{heading}</li>
        {items.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            showDate
            onToggleDone={() => onToggleDone(t.id)}
            onOpen={() => onOpen(t)}
          />
        ))}
      </>
    );

  return (
    <div className="list-view">
      <QuickAdd
        placeholder="Add a task… try 'buy milk tomorrow' or 'call John on Friday'"
        onAdd={onQuickAdd}
        onNewTask={onNewTask}
      />
      <ul className="tasks">
        {section(pinned, "📌 Pinned")}
        {section(inbox, "📋 Inbox (unscheduled)")}
        {section(scheduled, "📅 Scheduled")}
        {filtered.length === 0 && (
          <li className="empty">
            {query
              ? "No tasks match your search."
              : "No tasks yet — add one above!"}
          </li>
        )}
      </ul>
    </div>
  );
}
