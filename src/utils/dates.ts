const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_S = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const today = (): string => toISO(new Date());

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}
export function weekStart(iso: string): string {
  console.log("weekStart called> iso: ", iso);
  const d = new Date(iso + "T00:00:00");
  console.log("weekStart: d: ", d);
  // d.setDate(d.getDate() - d.getDay());         // Uncomment if week should start on sunday's date
  console.log("weekStart: d after: ", d);
  console.log("weekStart: ", toISO(d));
  return toISO(d);
}
export function weekDays(baseISO: string): string[] {
  const s = weekStart(baseISO);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}
export function monthCells(iso: string): (string | null)[] {
  const d = new Date(iso + "T00:00:00");
  const y = d.getFullYear(),
    m = d.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDow).fill(null);
  for (let i = 1; i <= days; i++) cells.push(toISO(new Date(y, m, i)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const isToday = (iso: string): boolean => iso === today();
export const isTomorrow = (iso: string): boolean => iso === addDays(today(), 1);

export const formatDayShort = (iso: string): string => {
  console.log("formatDayShort called> iso: ", iso);
  const d = new Date(iso + "T00:00:00");
  return `${DAYS_S[d.getDay()]} ${d.getDate()}`;
};
export const formatMonthYear = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export function formatWeekRange(iso: string): string {
  const s = weekStart(iso);
  const e = addDays(s, 6);
  console.log("formatWeekRange called> s: ", s);
  console.log("formatWeekRange called> e: ", e);
  return `${formatDayShort(s)} – ${formatDayShort(e)}`;
}

/** Unique accent colour per day-of-week (0=Sun … 6=Sat) */
export const DAY_COLORS = [
  "#ef4444", // 0 Sun  – red
  "#3b82f6", // 1 Mon  – blue
  "#22c55e", // 2 Tue  – green
  "#a855f7", // 3 Wed  – purple
  "#f97316", // 4 Thu  – orange
  "#6366f1", // 5 Fri  – indigo
  "#ec4899", // 6 Sat  – pink
] as const;

export function getDayColor(iso: string): string {
  return DAY_COLORS[new Date(iso + "T00:00:00").getDay()];
}
