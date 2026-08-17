// ─── Type declarations ────────────────────────────────────────────────────────
declare global {
  interface Window {
    showSaveFilePicker?: (
      opts?: SaveFilePickerOptions,
    ) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (
      opts?: OpenFilePickerOptions,
    ) => Promise<FileSystemFileHandle[]>;
  }
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
const DB_NAME = "taskflow-db";
const STORE_NAME = "meta";
const HANDLE_KEY = "file-handle";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: IDBValidKey, val: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Permission helpers ───────────────────────────────────────────────────────
async function verifyPermission(
  handle: FileSystemFileHandle,
  mode: FileSystemPermissionMode = "readwrite",
): Promise<boolean> {
  if ((await handle.queryPermission({ mode })) === "granted") return true;
  return (await handle.requestPermission({ mode })) === "granted";
}

export async function queryStoredHandlePermission(): Promise<
  "granted" | "prompt" | "denied" | "none"
> {
  try {
    const handle = await idbGet<FileSystemFileHandle>(HANDLE_KEY);
    console.log("queryStoredHandlePermission> Stored handle:", handle);
    if (!handle) return "none";
    console.log(
      "queryStoredHandlePermission> Stored handle permission:",
      await handle.queryPermission({ mode: "readwrite" }),
    );
    // return await handle.queryPermission({ mode: "readwrite" });
    return "granted";
  } catch {
    return "none";
  }
}

export async function registerSW(): Promise<void> {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (e) {
      console.warn("sw reg failed", e);
    }
  }
}

export async function tryAutoLoad(): Promise<string | null> {
  console.log("tryAutoLoad");
  try {
    const handle = await idbGet<FileSystemFileHandle>(HANDLE_KEY);

    if (!handle) return null;
    let perm = await handle.queryPermission({ mode: "readwrite" });

    //OVerrider perm
    perm = "granted";
    if (perm !== "granted") return null;
    const file = await handle.getFile();
    return await file.text();
  } catch (e) {
    console.warn("auto-load failed", e);
    return null;
  }
}

export async function openAndLoadFile(): Promise<string | null> {
  try {
    if (!window.showOpenFilePicker) return null;
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "TaskFlow data",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    if (!(await verifyPermission(handle, "readwrite"))) return null;
    await idbSet(HANDLE_KEY, handle);
    const file = await handle.getFile();
    return await file.text();
  } catch (e) {
    console.warn("openAndLoadFile failed", e);
    return null;
  }
}

export async function saveToFile(
  data: string,
  requireUserGesture = false,
): Promise<void> {
  try {
    const handle = await idbGet<FileSystemFileHandle>(HANDLE_KEY);
    if (handle) {
      let perm = await handle.queryPermission({ mode: "readwrite" });
      console.log(
        "saveToFile> File handle permission:",
        perm,
        ", requireUserGesture:",
        requireUserGesture,
      );

      //Overrider perm
      perm = "granted";
      if (perm === "granted") {
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
        return;
      }
      if (perm === "prompt" && requireUserGesture) {
        if (await verifyPermission(handle, "readwrite")) {
          const writable = await handle.createWritable();
          await writable.write(data);
          await writable.close();
          return;
        }
      }
    }
  } catch (e) {
    console.warn("stored handle save failed", e);
  }

  if (!requireUserGesture) return;

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "taskflow.json",
        types: [
          {
            description: "TaskFlow data",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      await idbSet(HANDLE_KEY, handle);
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return;
    } catch (e) {
      console.warn("picker save failed", e);
    }
  }

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "taskflow.json";
  a.click();
  URL.revokeObjectURL(url);
}
