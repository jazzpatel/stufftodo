import React from "react";
import type { FileStatus } from "../types";

interface Props {
  open: boolean;
  fileStatus: FileStatus;
  dark: boolean;
  onClose: () => void;
  onImport: () => void;
  onExport: () => void;
  onToggleDark: () => void;
}

export function Drawer({
  open,
  fileStatus,
  dark,
  onClose,
  onImport,
  onExport,
  onToggleDark,
}: Props) {
  return (
    <>
      {open && <div className="overlay" onClick={onClose} />}
      <aside className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-header">
          <img src="/icons/icon.svg" alt="" width={32} />
          <span>TaskFlow</span>
        </div>
        <nav className="drawer-nav">
          <button onClick={onImport}>📂 Import data file…</button>
          <button onClick={onExport}>💾 Export / Save as…</button>
          <button onClick={onToggleDark}>
            {dark ? "☀ Light mode" : "🌙 Dark mode"}
          </button>
        </nav>
        <div className="drawer-footer">
          <p className={`file-status ${fileStatus}`}>
            {fileStatus === "connected" &&
              "✓ Data file connected — auto-saving"}
            {fileStatus === "prompt" && "⚠ File permission needed — use Import"}
            {fileStatus === "none" && "○ No data file connected"}
          </p>
        </div>
      </aside>
    </>
  );
}
