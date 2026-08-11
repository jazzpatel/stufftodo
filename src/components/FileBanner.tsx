import React from "react";

interface Props {
  onImport: () => void;
  onExport: () => void;
}

export function FileBanner({ onImport, onExport }: Props) {
  return (
    <div className="file-banner">
      <span>
        📂 Connect a local file to auto-save tasks outside the browser sandbox
      </span>
      <button onClick={onImport}>Open file…</button>
      <button className="secondary" onClick={onExport}>
        Save as…
      </button>
    </div>
  );
}
