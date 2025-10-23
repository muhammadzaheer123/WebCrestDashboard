export function isWeekend(d: Date) {
  const day = d.getUTCDay(); // 0 Sun, 6 Sat
  return day === 0 || day === 6;
}

export function toUTCDateOnly(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function businessDaysBetween(
  start: Date,
  end: Date,
  holidays: string[] = []
) {
  const s = toUTCDateOnly(start);
  const e = toUTCDateOnly(end);
  if (e < s) return 0;

  const holidayKeys = new Set(
    (holidays || []).map((h) => toUTCDateOnly(new Date(h)).getTime())
  );

  let count = 0;
  const cursor = new Date(s);
  while (cursor <= e) {
    const key = cursor.getTime();
    if (!isWeekend(cursor) && !holidayKeys.has(key)) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

// export function ymd(d = new Date()): string {
//   const y = d.getUTCFullYear();
//   const m = String(d.getUTCMonth() + 1).padStart(2, "0");
//   const day = String(d.getUTCDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// }
