/**
 * taskDb.ts
 *
 * Lightweight IndexedDB handler for persisting Task items in a PWA.
 * No external dependencies. Works on Android Chrome and iOS Safari.
 *
 * Usage:
 *   import { taskDb } from './taskDb';
 *   await taskDb.init();
 *   const id = await taskDb.addTask({ text: 'Buy milk' });
 *   const task = await taskDb.getTask(id);
 *   await taskDb.updateTask(id, { done: true });
 *   const all = await taskDb.getAllTasks();
 *   await taskDb.deleteTask(id);
 */

export type Priority = "none" | "low" | "medium" | "high";
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type ViewMode = "list" | "day" | "week" | "month";
export type FileStatus = "none" | "connected" | "prompt";

export type Task = {
  id: string;
  text: string;
  done: boolean;
  pinned: boolean;
  important: boolean; // kept for backwards-compat; synced with priority === 'high'
  priority: Priority;
  dueDate: string | null; // 'YYYY-MM-DD' or null = unscheduled
  recurrence: Recurrence;
  notes: string;
  photos: string[]; // base64 data URLs
  reminder: string | null; // 'YYYY-MM-DDTHH:mm' for browser notification
  createdAt: string;
};

/**
 * Fields required to create a task. Everything else falls back to a default.
 * `important` is intentionally omitted — it's derived from `priority` on write,
 * never set directly, so the two can't drift out of sync.
 */
export type NewTask = Partial<Omit<Task, "id" | "createdAt" | "important">> & {
  text: string;
};

/**
 * Same rule applies to updates: pass `priority`, not `important`, to change
 * high-priority status. `id`/`createdAt` are immutable; `important` is derived.
 */
export type TaskUpdate = Partial<Omit<Task, "id" | "createdAt" | "important">>;

const DB_NAME = "app-task-db";
const DB_VERSION = 2;
const STORE_NAME = "tasks";

class TaskDatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "TaskDatabaseError";
  }
}

/** Keeps `important` in lockstep with `priority === 'high'`. */
function withDerivedImportant<T extends { priority: Priority }>(
  task: T,
): T & { important: boolean } {
  return { ...task, important: task.priority === "high" };
}

class TaskDb {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Opens (or creates) the database. Safe to call multiple times;
   * the connection is cached and reused.
   */
  init(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(
          new TaskDatabaseError(
            "IndexedDB is not available in this environment",
          ),
        );
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const oldVersion = event.oldVersion;

        let store: IDBObjectStore;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        } else {
          store = request.transaction!.objectStore(STORE_NAME);
        }

        // v1 -> v2: schema changed shape (completed -> done, title -> text,
        // dueDate is now nullable, etc). Old indexes on stale field names
        // are dropped and rebuilt against the current schema.
        if (oldVersion < 2) {
          for (const name of Array.from(store.indexNames)) {
            store.deleteIndex(name);
          }
          store.createIndex("done", "done", { unique: false });
          store.createIndex("pinned", "pinned", { unique: false });
          store.createIndex("important", "important", { unique: false });
          store.createIndex("priority", "priority", { unique: false });
          store.createIndex("dueDate", "dueDate", { unique: false });
          store.createIndex("recurrence", "recurrence", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new TaskDatabaseError("Failed to open database", request.error));
      request.onblocked = () =>
        reject(
          new TaskDatabaseError("Database open blocked by another connection"),
        );
    });

    return this.dbPromise;
  }

  /** Requests persistent storage to reduce risk of browser-initiated eviction. */
  async requestPersistence(): Promise<boolean> {
    if (navigator.storage?.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  }

  private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.init();
    const tx = db.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
  }

  private generateId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /** Creates a new task and returns its generated id. */
  async addTask(input: NewTask): Promise<string> {
    const now = new Date().toISOString();
    const task: Task = withDerivedImportant({
      id: this.generateId(),
      text: input.text,
      done: input.done ?? false,
      pinned: input.pinned ?? false,
      priority: input.priority ?? "none",
      dueDate: input.dueDate ?? null,
      recurrence: input.recurrence ?? "none",
      notes: input.notes ?? "",
      photos: input.photos ?? [],
      reminder: input.reminder ?? null,
      createdAt: now,
    });

    const store = await this.getStore("readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(task);
      request.onsuccess = () => resolve(task.id);
      request.onerror = () =>
        reject(
          new TaskDatabaseError(`Failed to add task ${task.id}`, request.error),
        );
    });
  }

  /** Fetches a single task by id, or null if it doesn't exist. */
  async getTask(id: string): Promise<Task | null> {
    const store = await this.getStore("readonly");
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () =>
        reject(
          new TaskDatabaseError(`Failed to get task ${id}`, request.error),
        );
    });
  }

  /** Fetches all tasks, sorted by createdAt ascending. */
  async getAllTasks(): Promise<Task[]> {
    const store = await this.getStore("readonly");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const tasks = (request.result as Task[]).sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        );
        resolve(tasks);
      };
      request.onerror = () =>
        reject(new TaskDatabaseError("Failed to get all tasks", request.error));
    });
  }

  /** Fetches tasks filtered by done status. */
  async getTasksByDone(done: boolean): Promise<Task[]> {
    const store = await this.getStore("readonly");
    return new Promise((resolve, reject) => {
      const index = store.index("done");
      const request = index.getAll(IDBKeyRange.only(done));
      request.onsuccess = () => resolve(request.result as Task[]);
      request.onerror = () =>
        reject(
          new TaskDatabaseError(
            "Failed to query tasks by done status",
            request.error,
          ),
        );
    });
  }

  /** Fetches tasks filtered by priority. */
  async getTasksByPriority(priority: Priority): Promise<Task[]> {
    const store = await this.getStore("readonly");
    return new Promise((resolve, reject) => {
      const index = store.index("priority");
      const request = index.getAll(IDBKeyRange.only(priority));
      request.onsuccess = () => resolve(request.result as Task[]);
      request.onerror = () =>
        reject(
          new TaskDatabaseError(
            "Failed to query tasks by priority",
            request.error,
          ),
        );
    });
  }

  /** Fetches pinned tasks. */
  async getPinnedTasks(): Promise<Task[]> {
    const store = await this.getStore("readonly");
    return new Promise((resolve, reject) => {
      const index = store.index("pinned");
      const request = index.getAll(IDBKeyRange.only(true));
      request.onsuccess = () => resolve(request.result as Task[]);
      request.onerror = () =>
        reject(
          new TaskDatabaseError("Failed to query pinned tasks", request.error),
        );
    });
  }

  /** Fetches tasks with a given exact dueDate ('YYYY-MM-DD'). Unscheduled tasks (dueDate: null) are excluded. */
  async getTasksByDueDate(dueDate: string): Promise<Task[]> {
    const store = await this.getStore("readonly");
    return new Promise((resolve, reject) => {
      const index = store.index("dueDate");
      const request = index.getAll(IDBKeyRange.only(dueDate));
      request.onsuccess = () => resolve(request.result as Task[]);
      request.onerror = () =>
        reject(
          new TaskDatabaseError(
            "Failed to query tasks by due date",
            request.error,
          ),
        );
    });
  }

  /**
   * Updates an existing task with a partial patch. Merges with the existing
   * record, re-derives `important` from the resulting `priority`, and
   * throws if the task does not exist.
   */
  async updateTask(id: string, patch: TaskUpdate): Promise<Task> {
    const store = await this.getStore("readwrite");

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result as Task | undefined;
        if (!existing) {
          reject(new TaskDatabaseError(`Task ${id} not found`));
          return;
        }

        const merged = {
          ...existing,
          ...patch,
          id: existing.id, // id and createdAt are immutable
          createdAt: existing.createdAt,
        };
        const updated: Task = withDerivedImportant(merged);

        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(updated);
        putRequest.onerror = () =>
          reject(
            new TaskDatabaseError(
              `Failed to update task ${id}`,
              putRequest.error,
            ),
          );
      };

      getRequest.onerror = () =>
        reject(
          new TaskDatabaseError(
            `Failed to read task ${id} before update`,
            getRequest.error,
          ),
        );
    });
  }

  /** Deletes a task by id. Resolves silently if it doesn't exist. */
  async deleteTask(id: string): Promise<void> {
    const store = await this.getStore("readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          new TaskDatabaseError(`Failed to delete task ${id}`, request.error),
        );
    });
  }

  /** Deletes all tasks. Use with care. */
  async clearAll(): Promise<void> {
    const store = await this.getStore("readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new TaskDatabaseError("Failed to clear tasks", request.error));
    });
  }

  /** Counts total tasks currently stored. */
  async count(): Promise<number> {
    const store = await this.getStore("readonly");
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new TaskDatabaseError("Failed to count tasks", request.error));
    });
  }
}

// Singleton instance — import this directly in most cases.
export const taskDb = new TaskDb();

// Class is also exported in case multiple independent instances are needed
// (e.g. for testing with a different DB name).
export { TaskDb, TaskDatabaseError };
