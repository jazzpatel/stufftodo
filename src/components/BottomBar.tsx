import React from "react";
import type { ViewMode } from "../types";

interface Props {
  view: ViewMode;
  onView: (v: ViewMode) => void;
  onSearch: () => void;
  onMenu: () => void;
  onAddCredential: () => void;
}

const TABS: { v: ViewMode; icon: string; label: string }[] = [
  { v: "list", icon: "☰", label: "All" },
  { v: "week", icon: "▦", label: "Week" },
  { v: "month", icon: "🗓", label: "Month" },
];

export function BottomBar({
  view,
  onView,
  onSearch,
  onMenu,
  onAddCredential,
}: Props) {
  return (
    <nav className="bottombar" aria-label="Navigation">
      {/* All */}
      <button
        className={`btb-tab${view === "detail" || view === "welcome" ? " btb-tab--active" : ""}`}
        onClick={() => onView("list")}
        aria-label="All"
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
        <span className="btb-label">Home</span>
      </button>

      {/* Week */}
      <button
        className={`btb-tab${view === "detail" || view === "welcome" ? " btb-tab--active" : ""}`}
        onClick={() => onView("week")}
        aria-label="All"
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Calendar outline */}
          <rect x="3" y="4" width="18" height="17" rx="2" />
          {/* Hanger tabs */}
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
          {/* Header divider */}
          <line x1="3" y1="9" x2="21" y2="9" />
          {/* Highlighted week row */}
          <line x1="3" y1="14" x2="21" y2="14" strokeWidth="4" />
        </svg>
        <span className="btb-label">Week</span>
      </button>

      {/* Add (primary CTA) */}
      <button
        className="btb-tab btb-tab--primary"
        onClick={onAddCredential}
        aria-label="Add Task"
      >
        <span className="btb-primary-circle">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>

      {/* Month */}
      <button
        className={`btb-tab${view === "detail" || view === "welcome" ? " btb-tab--active" : ""}`}
        onClick={() => onView("month")}
        aria-label="All"
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Calendar outline */}
          <rect x="3" y="4" width="18" height="17" rx="2" />
          {/* Hanger tabs */}
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
          {/* Header divider */}
          <line x1="3" y1="9" x2="21" y2="9" />
          {/* Day grid: dots representing multiple weeks of days */}
          <circle cx="7" cy="13" r="0.5" fill="currentColor" />
          <circle cx="12" cy="13" r="0.5" fill="currentColor" />
          <circle cx="17" cy="13" r="0.5" fill="currentColor" />
          <circle cx="7" cy="17" r="0.5" fill="currentColor" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          <circle cx="17" cy="17" r="0.5" fill="currentColor" />
        </svg>
        <span className="btb-label">Month</span>
      </button>

      {/* Menu */}
      <button className="btb-tab" onClick={onMenu} aria-label="Menu">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <rect y="4" width="24" height="2" rx="1" />
          <rect y="11" width="24" height="2" rx="1" />
          <rect y="18" width="24" height="2" rx="1" />
        </svg>
        <span className="btb-label">Menu</span>
      </button>
    </nav>
  );
}
