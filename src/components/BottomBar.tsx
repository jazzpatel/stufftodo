import React from "react";
import type { ViewMode } from "../types";

interface Props {
  view: ViewMode;
  onView: (v: ViewMode) => void;
  onSearch: () => void;
  onMenu: () => void;
}

const TABS: { v: ViewMode; icon: string; label: string }[] = [
  { v: "list", icon: "☰", label: "All" },
  { v: "day", icon: "☀", label: "Day" },
  { v: "week", icon: "▦", label: "Week" },
  { v: "month", icon: "🗓", label: "Month" },
];

export function BottomBar({ view, onView, onSearch, onMenu }: Props) {
  return (
    <nav className="bottombar" aria-label="Navigation">
      <div className="bottom-tabs">
        {TABS.map((t) => (
          <button
            key={t.v}
            className={`tab-btn${view === t.v ? " active" : ""}`}
            onClick={() => onView(t.v)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="bottom-right">
        <button
          className="icon-btn bottom-icon"
          onClick={onSearch}
          aria-label="Search"
        >
          🔍
        </button>
        <button
          className="icon-btn bottom-icon"
          onClick={onMenu}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>
    </nav>
  );
}
