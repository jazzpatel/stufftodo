/**
 * useTasks.ts
 *
 * React hook wrapper around taskDb (see taskDb.ts). Manages in-memory task
 * state backed by IndexedDB, with loading/error state and CRUD operations.
 *
 * Usage:
 *   const { tasks, loading, error, addTask, updateTask, deleteTask, refresh } = useTasks();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   await addTask({ text: 'Buy milk' });
 *   await updateTask(id, { done: true });
 *   await updateTask(id, { priority: 'high' }); // 'important' syncs automatically
 *   await deleteTask(id);
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  taskDb,
  Task,
  NewTask,
  TaskUpdate,
  Priority,
  TaskDatabaseError,
} from "./taskDb";

export interface UseTasksOptions {
  /**
   * Filter tasks by one field. Omit to load all tasks.
   * - { done: boolean }        -> getTasksByDone
   * - { priority: Priority }   -> getTasksByPriority
   * - { pinned: true }         -> getPinnedTasks
   * - { dueDate: string }      -> getTasksByDueDate ('YYYY-MM-DD', exact match)
   */
  filter?:
    | { done: boolean }
    | { priority: Priority }
    | { pinned: true }
    | { dueDate: string };
  /** Request persistent storage on mount (navigator.storage.persist()). Default: true. */
  requestPersistence?: boolean;
}

export interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: TaskDatabaseError | null;
  addTask: (input: NewTask) => Promise<Task | null>;
  updateTask: (id: string, patch: TaskUpdate) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/** Serializes the filter into a stable dependency-array-safe key. */
function filterKey(filter: UseTasksOptions["filter"]): string {
  if (!filter) return "all";
  if ("done" in filter) return `done:${filter.done}`;
  if ("priority" in filter) return `priority:${filter.priority}`;
  if ("pinned" in filter) return `pinned:${filter.pinned}`;
  if ("dueDate" in filter) return `dueDate:${filter.dueDate}`;
  return "all";
}

async function fetchByFilter(
  filter: UseTasksOptions["filter"],
): Promise<Task[]> {
  if (!filter) return taskDb.getAllTasks();
  if ("done" in filter) return taskDb.getTasksByDone(filter.done);
  if ("priority" in filter) return taskDb.getTasksByPriority(filter.priority);
  if ("pinned" in filter) return taskDb.getPinnedTasks();
  if ("dueDate" in filter) return taskDb.getTasksByDueDate(filter.dueDate);
  return taskDb.getAllTasks();
}

export function useTasks(options: UseTasksOptions = {}): UseTasksResult {
  const { filter, requestPersistence = true } = options;
  const filterDepKey = filterKey(filter);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<TaskDatabaseError | null>(null);

  // Guards against setting state after unmount (e.g. slow IndexedDB call
  // resolving after the component using the hook has gone away).
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchByFilter(filter);
      if (mountedRef.current) setTasks(result);
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof TaskDatabaseError
            ? err
            : new TaskDatabaseError("Failed to load tasks", err),
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // filterDepKey mirrors `filter` for the dependency array below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDepKey]);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        await taskDb.init();
        if (requestPersistence) {
          await taskDb.requestPersistence();
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof TaskDatabaseError
              ? err
              : new TaskDatabaseError("Failed to initialize database", err),
          );
          setLoading(false);
          return;
        }
      }
      await load();
    })();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, requestPersistence]);

  const addTask = useCallback(
    async (input: NewTask): Promise<Task | null> => {
      setError(null);
      try {
        const id = await taskDb.addTask(input);
        const created = await taskDb.getTask(id);
        await load(); // refresh so filtered views stay correct
        return created;
      } catch (err) {
        const dbError =
          err instanceof TaskDatabaseError
            ? err
            : new TaskDatabaseError("Failed to add task", err);
        if (mountedRef.current) setError(dbError);
        return null;
      }
    },
    [load],
  );

  const updateTask = useCallback(
    async (id: string, patch: TaskUpdate): Promise<Task | null> => {
      setError(null);
      try {
        const updated = await taskDb.updateTask(id, patch);
        await load();
        return updated;
      } catch (err) {
        const dbError =
          err instanceof TaskDatabaseError
            ? err
            : new TaskDatabaseError(`Failed to update task ${id}`, err);
        if (mountedRef.current) setError(dbError);
        return null;
      }
    },
    [load],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await taskDb.deleteTask(id);
        await load();
        return true;
      } catch (err) {
        const dbError =
          err instanceof TaskDatabaseError
            ? err
            : new TaskDatabaseError(`Failed to delete task ${id}`, err);
        if (mountedRef.current) setError(dbError);
        return false;
      }
    },
    [load],
  );

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refresh: load,
  };
}
