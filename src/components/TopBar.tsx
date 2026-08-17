import React from "react";

interface Props {
  onMenu: () => void;
  searchRef: React.RefObject<HTMLInputElement>;
  query: string;
  onSearch: (q: string) => void;
}

export function TopBar({ onMenu, searchRef, query, onSearch }: Props) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onMenu} aria-label="Open menu">
        ☰
      </button>
      <div className="title">
        <img src="/icons/icon.svg" alt="" width={28} height={28} />
        <h1>TaskFlow 2.0</h1>
      </div>
      <input
        ref={searchRef}
        className="top-search"
        type="search"
        placeholder="Search…"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search tasks"
      />
    </header>
  );
}
