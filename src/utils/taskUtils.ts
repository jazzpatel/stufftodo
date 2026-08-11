import type { Task, Priority, Recurrence } from "../types";

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export function newTask(dueDate: string | null = null): Task {
  return {
    id: uid(),
    text: "",
    done: false,
    pinned: false,
    important: false,
    priority: "none",
    dueDate,
    recurrence: "none",
    notes: "",
    photos: [],
    reminder: null,
    createdAt: new Date().toISOString(),
  };
}

/** Normalise a raw object from JSON into a valid Task, filling missing fields from older saves */
export function normalizeTask(raw: unknown): Task {
  const t = raw as Record<string, unknown>;
  const imp = Boolean(t.important);
  const prio = (t.priority as Priority | undefined) ?? (imp ? "high" : "none");
  return {
    id: String(t.id ?? uid()),
    text: String(t.text ?? ""),
    done: Boolean(t.done),
    pinned: Boolean(t.pinned),
    important: imp,
    priority: prio,
    dueDate: (t.dueDate as string | null) ?? null,
    recurrence: (t.recurrence as Recurrence | undefined) ?? "none",
    notes: String(t.notes ?? ""),
    photos: Array.isArray(t.photos) ? (t.photos as string[]) : [],
    reminder: (t.reminder as string | null) ?? null,
    createdAt: String(t.createdAt ?? new Date().toISOString()),
  };
}

const P_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const pa = P_ORDER[a.priority ?? "none"];
    const pb = P_ORDER[b.priority ?? "none"];
    if (pa !== pb) return pa - pb;
    if (a.done !== b.done) return a.done ? 1 : -1;
    return 0;
  });
}
