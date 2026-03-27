/**
 * Attendance Seed Generator
 * Payroll period: March 10 – April 9, 2026 (10th-to-10th cycle)
 * Timezone: UTC+5 (PKT)
 * 3 employees: good / average / poor attendance patterns
 *
 * Run:  node scripts/generate-attendance-seed.mjs
 * Output: scripts/attendance-seed.json  (ready for mongoimport)
 *
 * mongoimport command:
 *   mongoimport --uri "mongodb://..." --collection attendances --jsonArray --file attendance-seed.json
 *
 * ⚠️  Replace the employeeId values below with real _id strings from your employees collection.
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const UTC_OFFSET_HOURS = 5; // PKT = UTC+5

// Replace these with real ObjectId strings from your employees collection
const EMPLOYEES = [
  {
    employeeId: "69bc6a03384db9dc7a370a2f",
    name: "Webcrest Admin",
    profile: "average", // mostly present, 1 half-day, 1 absent
  },
  //   {
  //     employeeId: "REPLACE_WITH_BOB_EMPLOYEE_ID",
  //     name: "Bob Smith",
  //     profile: "average", // some lates, 2 half-days, 3 absents
  //   },
  //   {
  //     employeeId: "REPLACE_WITH_CARLOS_EMPLOYEE_ID",
  //     name: "Carlos Mendez",
  //     profile: "poor", // frequent lates, 4 half-days, 5 absents
  //   },
];

// Office shift: 9:00 – 18:00 local, 60-min lunch break
const SHIFT_START = { h: 9, m: 0 };
const SHIFT_END = { h: 18, m: 0 };
const LUNCH_DURATION = 60; // minutes

const OFFICE_IP = "192.168.1.1";
const HOME_IP = "103.47.65.22";
const OFFICE_SSID = "Office-WiFi-5G";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let oidCounter = 0;
function nextOid() {
  oidCounter++;
  const hex = oidCounter.toString(16).padStart(6, "0");
  // Prefix: Mar 2026 epoch ≈ 0x679A3280, padded to 24 hex chars total
  return `679a32800000000000${hex}`;
}

let breakOidCounter = 0;
function nextBreakOid() {
  breakOidCounter++;
  const hex = breakOidCounter.toString(16).padStart(6, "0");
  return `679a33800000000000${hex}`;
}

/** Convert local time (PKT) to UTC Date for a given calendar date */
function localToUtc(year, month, day, hour, minute) {
  // UTC = local - offset
  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute, 0) -
    UTC_OFFSET_HOURS * 3600 * 1000;
  return new Date(utcMs);
}

function isoDate(d) {
  return { $date: d.toISOString() };
}

/** Jitter: add ±range minutes randomly around a base value, using a seed for reproducibility */
function jitter(base, range, seed) {
  // Deterministic pseudo-random using seed
  const n = Math.sin(seed * 9301 + 49297) * 233280;
  const rnd = n - Math.floor(n); // 0..1
  return Math.round(base + (rnd - 0.5) * 2 * range);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function minutesBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function round2(n) {
  return +n.toFixed(2);
}

// ─── Day type resolution by profile ─────────────────────────────────────────

/**
 * Returns one of: "present" | "half-day-early" | "half-day-late" | "absent"
 * based on the employee profile and day index (for deterministic variation).
 */
function dayBehaviour(profile, dayIndex) {
  // Seed so each call with same args returns same result
  const rnd01 = (seed) => {
    const n = Math.sin(seed * 12345.6789) * 99999;
    return n - Math.floor(n);
  };

  const r = rnd01(dayIndex * 7 + profiles[profile].seed);

  const { absentRate, halfDayRate } = profiles[profile];

  if (r < absentRate) return "absent";
  if (r < absentRate + halfDayRate) {
    // Alternate between early-leave and late-come half-days
    return dayIndex % 2 === 0 ? "half-day-early" : "half-day-late";
  }
  return "present";
}

const profiles = {
  good: {
    seed: 3,
    absentRate: 0.04, // ~1 absent in 23 days
    halfDayRate: 0.05, // ~1 half-day
    lateBaseMin: 2, // avg late minutes on a present day
    lateJitter: 8,
  },
  average: {
    seed: 7,
    absentRate: 0.13, // ~3 absents
    halfDayRate: 0.09, // ~2 half-days
    lateBaseMin: 12,
    lateJitter: 18,
  },
  poor: {
    seed: 11,
    absentRate: 0.22, // ~5 absents
    halfDayRate: 0.17, // ~4 half-days
    lateBaseMin: 22,
    lateJitter: 28,
  },
};

// ─── Record builder ──────────────────────────────────────────────────────────

function buildRecord(employee, year, month, day, dayIndex) {
  const profile = profiles[employee.profile];
  const behaviour = dayBehaviour(employee.profile, dayIndex);

  if (behaviour === "absent") return null; // no record = absent

  const dateMidnightUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  // Late minutes for this day (present or half-day-late arrival)
  const lateMin = Math.max(
    0,
    jitter(
      profile.lateBaseMin,
      profile.lateJitter,
      dayIndex * 13 + employee.employeeId.charCodeAt(0),
    ),
  );

  const checkInLocalH = SHIFT_START.h;
  const checkInLocalM = SHIFT_START.m + lateMin;

  let status = "present";
  let checkOut;
  const breaks = [];

  if (behaviour === "half-day-late") {
    // Came in very late, left at ~13:00–14:00 local
    const veryLateExtra = jitter(
      25,
      20,
      dayIndex * 17 + employee.employeeId.charCodeAt(1),
    );
    const totalLate = lateMin + veryLateExtra;
    const ciH = SHIFT_START.h + Math.floor((SHIFT_START.m + totalLate) / 60);
    const ciM = (SHIFT_START.m + totalLate) % 60;
    const checkIn = localToUtc(year, month, day, ciH, ciM);

    const coLocal = 13 * 60 + jitter(0, 20, dayIndex * 19);
    const coH = Math.floor(coLocal / 60);
    const coM = coLocal % 60;
    checkOut = localToUtc(year, month, day, coH, coM);

    const totalHours = round2(minutesBetween(checkIn, checkOut) / 60);

    status = "half-day";
    return finalize({
      employee,
      dateMidnightUtc,
      checkIn,
      checkOut,
      breaks,
      status,
      totalHours,
      totalBreakTime: 0,
      totalWorkHours: totalHours,
    });
  }

  if (behaviour === "half-day-early") {
    // Normal check-in, left early ~13:00–13:30 local
    const checkIn = localToUtc(year, month, day, checkInLocalH, checkInLocalM);
    const coLocal = 13 * 60 + jitter(10, 20, dayIndex * 23);
    const coH = Math.floor(coLocal / 60);
    const coM = coLocal % 60;
    checkOut = localToUtc(year, month, day, coH, coM);

    const totalHours = round2(minutesBetween(checkIn, checkOut) / 60);
    status = "half-day";
    return finalize({
      employee,
      dateMidnightUtc,
      checkIn,
      checkOut,
      breaks,
      status,
      totalHours,
      totalBreakTime: 0,
      totalWorkHours: totalHours,
    });
  }

  // ── Present: full day ──
  const checkIn = localToUtc(year, month, day, checkInLocalH, checkInLocalM);

  // Check-out: shift end + small overrun
  const overrunMin = Math.max(
    0,
    jitter(5, 10, dayIndex * 29 + employee.employeeId.charCodeAt(2)),
  );
  const endMinutes = SHIFT_END.h * 60 + SHIFT_END.m + overrunMin;
  const coH = Math.floor(endMinutes / 60);
  const coM = endMinutes % 60;
  checkOut = localToUtc(year, month, day, coH, coM);

  // Lunch break around 13:00–13:15
  const lunchStartLocal = 13 * 60 + jitter(0, 15, dayIndex * 31);
  const lunchDuration = LUNCH_DURATION + jitter(0, 5, dayIndex * 37);
  const lunchEndLocal = lunchStartLocal + lunchDuration;
  const bInH = Math.floor(lunchStartLocal / 60);
  const bInM = lunchStartLocal % 60;
  const bOutH = Math.floor(lunchEndLocal / 60);
  const bOutM = lunchEndLocal % 60;
  const breakIn = localToUtc(year, month, day, bInH, bInM);
  const breakOut = localToUtc(year, month, day, bOutH, bOutM);
  breaks.push({
    id: nextBreakOid(),
    breakIn,
    breakOut,
    duration: lunchDuration,
  });

  const grossMin = minutesBetween(checkIn, checkOut);
  const totalHours = round2(grossMin / 60);
  const totalBreakTime = lunchDuration;
  const totalWorkHours = round2((grossMin - totalBreakTime) / 60);

  return finalize({
    employee,
    dateMidnightUtc,
    checkIn,
    checkOut,
    breaks,
    status,
    totalHours,
    totalBreakTime,
    totalWorkHours,
  });
}

function finalize({
  employee,
  dateMidnightUtc,
  checkIn,
  checkOut,
  breaks,
  status,
  totalHours,
  totalBreakTime,
  totalWorkHours,
}) {
  return {
    _id: { $oid: nextOid() },
    employeeId: employee.employeeId,
    date: isoDate(dateMidnightUtc),
    checkIn: isoDate(checkIn),
    checkOut: checkOut ? isoDate(checkOut) : undefined,
    breaks: breaks.map((b) => ({
      _id: { $oid: b.id },
      breakIn: isoDate(b.breakIn),
      breakOut: b.breakOut ? isoDate(b.breakOut) : undefined,
      duration: b.duration,
    })),
    status,
    totalHours,
    totalBreakTime,
    totalWorkHours,
    network: {
      ip: OFFICE_IP,
      ssid: OFFICE_SSID,
      ua: UA,
    },
    checkInIP: OFFICE_IP,
    checkOutIP: OFFICE_IP,
    source: "button",
    createdAt: isoDate(checkIn),
    updatedAt: isoDate(checkOut ?? checkIn),
  };
}

// ─── Generate payroll period days ────────────────────────────────────────────

function isWeekend(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay(); // 0=Sun, 6=Sat
  return dow === 0 || dow === 6;
}

function payrollDays() {
  const days = [];
  // Mar 10 to Apr 9 inclusive
  const start = new Date(Date.UTC(2026, 2, 10)); // Mar = month 2 (0-indexed)
  const end = new Date(Date.UTC(2026, 3, 9)); // Apr 9
  let cur = new Date(start);
  while (cur <= end) {
    days.push({
      year: cur.getUTCFullYear(),
      month: cur.getUTCMonth() + 1,
      day: cur.getUTCDate(),
    });
    cur = new Date(cur.getTime() + 86400000);
  }
  return days;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const allDays = payrollDays();
const workingDays = allDays.filter((d) => !isWeekend(d.year, d.month, d.day));

console.log(`\nPayroll period: Mar 10 – Apr 9, 2026`);
console.log(
  `Total days: ${allDays.length}  |  Working days: ${workingDays.length}\n`,
);

const records = [];

for (const emp of EMPLOYEES) {
  let presentCount = 0,
    halfCount = 0,
    absentCount = 0;

  workingDays.forEach((d, idx) => {
    const rec = buildRecord(emp, d.year, d.month, d.day, idx);
    if (!rec) {
      absentCount++;
      return;
    }
    if (rec.status === "half-day") halfCount++;
    else presentCount++;
    // Remove undefined keys (checkOut on no-checkout days, etc.)
    Object.keys(rec).forEach((k) => rec[k] === undefined && delete rec[k]);
    records.push(rec);
  });

  console.log(
    `${emp.name.padEnd(18)} | Present: ${String(presentCount).padStart(2)}  Half-day: ${halfCount}  Absent: ${absentCount}`,
  );
}

console.log(`\nTotal records generated: ${records.length}`);

// Write output
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "attendance-seed.json");
writeFileSync(outPath, JSON.stringify(records, null, 2), "utf-8");
console.log(`\n✅  Written to: ${outPath}`);
console.log(
  `\nmongoimport command:\n  mongoimport --uri "mongodb+srv://webcrest:3cyRXHz7jT7rR83j@cluster0.4ktie13.mongodb.net/" --db Webcrest_HR_skills --collection attendances --jsonArray --file scripts/attendance-seed.json\n`,
);
