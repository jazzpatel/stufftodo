import React, { useRef, useState } from "react";
import type { Task, Recurrence, Priority } from "../types";
import { renderLinkedText } from "../utils/detect";

const PRIORITY_OPTS: { v: Priority; label: string; color: string }[] = [
  { v: "none", label: "None", color: "var(--muted)" },
  { v: "low", label: "Low", color: "#3b82f6" },
  { v: "medium", label: "Medium", color: "#f59e0b" },
  { v: "high", label: "High", color: "#ef4444" },
];

interface Props {
  task: Task;
  isNew: boolean;
  onSave: (t: Task) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TaskModal({ task, isNew, onSave, onDelete, onClose }: Props) {
  const [d, setD] = useState<Task>({ ...task });
  const photoRef = useRef<HTMLInputElement>(null);
  const u = (patch: Partial<Task>) => setD((x) => ({ ...x, ...patch }));

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((file) => {
      const r = new FileReader();
      r.onload = (ev) =>
        setD((x) => ({
          ...x,
          photos: [...x.photos, ev.target!.result as string],
        }));
      r.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const save = () => {
    if (!d.text.trim()) return;
    onSave({
      ...d,
      text: d.text.trim(),
      important: d.priority === "high" || d.important, // keep in sync
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? "New Task" : "Edit Task"}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <label className="field-label">Task</label>
          <input
            className="field-input"
            autoFocus
            value={d.text}
            onChange={(e) => u({ text: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="What needs to be done?"
          />

          <label className="field-label">Priority</label>
          <div className="priority-group">
            {PRIORITY_OPTS.map((p) => (
              <button
                key={p.v}
                type="button"
                className={`prio-btn${d.priority === p.v ? " active" : ""}`}
                style={{ "--prio-color": p.color } as React.CSSProperties}
                onClick={() => u({ priority: p.v })}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="toggle-group">
            <label className="toggle-row">
              <span>📌 Pin to top</span>
              <input
                type="checkbox"
                checked={d.pinned}
                onChange={(e) => u({ pinned: e.target.checked })}
              />
            </label>
          </div>

          <label className="field-label">
            Due date{" "}
            <span className="field-hint">
              (leave blank = unscheduled inbox)
            </span>
          </label>
          <div className="date-row">
            <input
              className="field-input"
              type="date"
              value={d.dueDate ?? ""}
              onChange={(e) => u({ dueDate: e.target.value || null })}
            />
            {d.dueDate && (
              <button
                className="clear-btn"
                onClick={() => u({ dueDate: null })}
              >
                Clear
              </button>
            )}
          </div>

          <label className="field-label">
            Reminder{" "}
            <span className="field-hint">
              (notification at this date &amp; time)
            </span>
          </label>
          <div className="date-row">
            <input
              className="field-input"
              type="datetime-local"
              value={d.reminder ?? ""}
              onChange={(e) => u({ reminder: e.target.value || null })}
            />
            {d.reminder && (
              <button
                className="clear-btn"
                onClick={() => u({ reminder: null })}
              >
                Clear
              </button>
            )}
          </div>

          <label className="field-label">Repeat</label>
          <select
            className="field-select"
            value={d.recurrence}
            onChange={(e) => u({ recurrence: e.target.value as Recurrence })}
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <label className="field-label">Notes</label>
          <textarea
            className="field-textarea"
            rows={4}
            value={d.notes}
            onChange={(e) => u({ notes: e.target.value })}
            placeholder="Add notes… phone numbers & addresses become tappable links"
          />
          {d.notes.trim() && (
            <div className="notes-preview">
              <span className="notes-preview-label">
                Tap to call / navigate
              </span>
              <p className="notes-preview-text">{renderLinkedText(d.notes)}</p>
            </div>
          )}

          <label className="field-label">Photos</label>
          <div className="photos-row">
            {d.photos.map((src, i) => (
              <div key={i} className="photo-thumb">
                <img src={src} alt={`Photo ${i + 1}`} />
                <button
                  className="photo-remove"
                  onClick={() =>
                    u({ photos: d.photos.filter((_, j) => j !== i) })
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className="photo-add"
              title="Add photo"
              onClick={() => photoRef.current?.click()}
            >
              📷
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: "none" }}
              onChange={handlePhotos}
            />
          </div>
        </div>

        <div className="modal-footer">
          {!isNew && onDelete && (
            <button className="btn-danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!d.text.trim()}
            onClick={save}
          >
            {isNew ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
