// lib/dates.ts
export function ymd(date: Date = new Date()): string {
  const d = date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
export function msToHours(ms: number) {
  return Number((ms / (1000 * 60 * 60)).toFixed(2));
}
