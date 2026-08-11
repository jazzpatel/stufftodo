import React, { useState } from "react";
import { parseNL, formatNLDate } from "../utils/nlp";

interface Props {
  placeholder: string;
  defaultDate?: string | null; // pre-fill date context (e.g. current day view date)
  onAdd: (text: string, dueDate: string | null) => void;
  onNewTask: (dueDate?: string | null) => void;
}

export function QuickAdd({
  placeholder,
  defaultDate,
  onAdd,
  onNewTask,
}: Props) {
  const [v, setV] = useState("");

  const nlp = v.trim() ? parseNL(v) : { text: v, dueDate: null };
  // If NLP found a date use it, else fall back to the context date (e.g. current day)
  const resolvedDate = nlp.dueDate ?? defaultDate ?? null;

  const submit = () => {
    const text = nlp.text.trim() || v.trim();
    if (!text) return;
    onAdd(text, resolvedDate);
    setV("");
  };

  return (
    <div className="quick-add-wrap">
      <div className="quick-add">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
        />
        <button className="qa-submit" title="Add (Enter)" onClick={submit}>
          ↵
        </button>
        <button
          className="qa-detail"
          title="Add with details"
          onClick={() => onNewTask(resolvedDate)}
        >
          ⋯
        </button>
      </div>
      {v.trim() && nlp.dueDate && (
        <p className="nlp-hint">📅 {formatNLDate(nlp.dueDate)}</p>
      )}
    </div>
  );
}
