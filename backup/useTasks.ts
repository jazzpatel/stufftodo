import { useCallback, useState } from "react";
import type { Task } from "../types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = useCallback(
    (task: Task) => setTasks((s) => [task, ...s]),
    [],
  );

  const updateTask = useCallback(
    (updated: Task) =>
      setTasks((s) => s.map((t) => (t.id === updated.id ? updated : t))),
    [],
  );

  const deleteTask = useCallback(
    (id: string) => setTasks((s) => s.filter((t) => t.id !== id)),
    [],
  );

  const toggleDone = useCallback(
    (id: string) =>
      setTasks((s) =>
        s.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      ),
    [],
  );

  const reschedule = useCallback(
    (id: string, dueDate: string | null) =>
      setTasks((s) => s.map((t) => (t.id === id ? { ...t, dueDate } : t))),
    [],
  );

  return {
    tasks,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleDone,
    reschedule,
  };
}
