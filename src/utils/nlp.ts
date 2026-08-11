import { today, addDays, toISO } from "./dates";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const WD_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function nextOccurrenceOf(targetDow: number): string {
  const d = new Date();
  const diff = (targetDow - d.getDay() + 7) % 7 || 7; // always push to future
  d.setDate(d.getDate() + diff);
  return toISO(d);
}

export type NLPResult = { text: string; dueDate: string | null };

/**
 * Extract a date hint from natural language.
 * e.g. "buy milk tomorrow" → { text: "buy milk", dueDate: "2026-08-11" }
 * Returns the original input if no date is found.
 */
export function parseNL(input: string): NLPResult {
  if (!input.trim()) return { text: input, dueDate: null };
  const s = input;

  const clean = (str: string, re: RegExp) =>
    str
      .replace(re, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  if (/\btoday\b/i.test(s))
    return { text: clean(s, /\btoday\b/i), dueDate: today() };

  if (/\btomorrow\b/i.test(s))
    return { text: clean(s, /\btomorrow\b/i), dueDate: addDays(today(), 1) };

  if (/\bthis weekend\b/i.test(s))
    return {
      text: clean(s, /\bthis weekend\b/i),
      dueDate: nextOccurrenceOf(6),
    };

  if (/\bnext week\b/i.test(s))
    return { text: clean(s, /\bnext week\b/i), dueDate: addDays(today(), 7) };

  if (/\bnext month\b/i.test(s)) {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return { text: clean(s, /\bnext month\b/i), dueDate: toISO(d) };
  }

  const inDays = s.match(/\bin (\d+) days?\b/i);
  if (inDays)
    return {
      text: clean(s, /\bin \d+ days?\b/i),
      dueDate: addDays(today(), parseInt(inDays[1])),
    };

  // "next <weekday>"
  for (let i = 0; i < WEEKDAYS.length; i++) {
    const re = new RegExp(`\\bnext (${WEEKDAYS[i]}|${WD_SHORT[i]})\\b`, "i");
    if (re.test(s)) {
      const d = new Date();
      d.setDate(d.getDate() + ((i - d.getDay() + 7) % 7) + 7);
      return { text: clean(s, re), dueDate: toISO(d) };
    }
  }

  // "on <weekday>" or just "<weekday>"
  for (let i = 0; i < WEEKDAYS.length; i++) {
    const re = new RegExp(`\\b(?:on )?(${WEEKDAYS[i]}|${WD_SHORT[i]})\\b`, "i");
    if (re.test(s)) return { text: clean(s, re), dueDate: nextOccurrenceOf(i) };
  }

  return { text: input, dueDate: null };
}

/** Format a parsed date for display in the NLP hint */
export function formatNLDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
