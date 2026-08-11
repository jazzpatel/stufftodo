import React from "react";
import type { Task, Priority } from "../types";
import { renderLinkedText } from "../utils/detect";

const PRIORITY_BORDER: Record<Priority, string | undefined> = {
  none: undefined,
  low: "#3b82f6",
  medium: "#f59e0b",
  high: "#ef4444",
};

interface Props {
  task: Task;
  onToggleDone: () => void;
  onOpen: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  compact?: boolean;
  showDate?: boolean;
}

export function TaskItem({
  task,
  onToggleDone,
  onOpen,
  draggable: isDrag,
  onDragStart,
  compact,
  showDate,
}: Props) {
  const borderColor =
    PRIORITY_BORDER[task.priority ?? "none"] ??
    (task.pinned ? "#f59e0b" : undefined);

  const style: React.CSSProperties | undefined = borderColor
    ? { borderLeftColor: borderColor, borderLeftWidth: "3.5px" }
    : undefined;

  return (
    <li
      style={style}
      className={[
        "task-item",
        task.done ? "done" : "",
        task.pinned ? "pinned" : "",
        compact ? "compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={isDrag}
      onDragStart={onDragStart}
    >
      <label className="task-check" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={task.done} onChange={onToggleDone} />
      </label>
      <div
        className="task-body"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
      >
        <span className="task-text">{renderLinkedText(task.text)}</span>
        {!compact && (
          <span className="task-badges">
            {(task.priority === "high" || task.important) && (
              <span title="High priority">🔴</span>
            )}
            {task.priority === "medium" && (
              <span title="Medium priority">🟡</span>
            )}
            {task.priority === "low" && <span title="Low priority">🔵</span>}
            {task.pinned && <span title="Pinned">📌</span>}
            {task.notes && <span title="Has notes">📝</span>}
            {task.photos?.length > 0 && <span title="Has photos">📷</span>}
            {task.recurrence !== "none" && (
              <span title={`Repeats ${task.recurrence}`}>🔁</span>
            )}
            {task.reminder && <span title="Has reminder">🔔</span>}
            {showDate && task.dueDate && (
              <span className="badge-date">{task.dueDate}</span>
            )}
          </span>
        )}
      </div>
    </li>
  );
}
