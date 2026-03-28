/**
 * Attendance Seed Generator (Actual Employee Data)
 *
 * Run: node scripts/generate-attendance-seed.mjs
 * Output: scripts/attendance-seed.json
 *
 * mongoimport command:
 *   mongoimport --uri "mongodb://..." --collection attendances --jsonArray --file "scripts/attendance-seed.json"
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const UTC_OFFSET_HOURS = 5; // PKT = UTC+5
const EMPLOYEE_ID = "69c71c9b576cca7c4f65d8f2"; // Replace if needed

const OFFICE_IP = "192.168.1.1";
const OFFICE_SSID = "Office-WiFi-5G";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

// Mar 2026 actual attendance entries provided by user (local PKT time)
// Note: employeeId + date is unique, so multi-session days are represented as
// one record with a long break between sessions.
const ACTUAL_ENTRIES = [
  {
    date: "2026-03-10",
    checkIn: "21:40",
    checkOut: "2026-03-11 04:19",
    durationMin: 399,
    source: "auto",
  },
  {
    date: "2026-03-11",
    checkIn: "06:17",
    checkOut: "2026-03-12 04:21",
    durationMin: 515,
    breaks: [
      {
        breakIn: "2026-03-11 08:30",
        breakOut: "2026-03-11 21:59",
      },
    ],
  },
  {
    date: "2026-03-12",
    checkIn: "06:14",
    checkOut: "2026-03-13 04:20",
    durationMin: 607,
    breaks: [
      {
        breakIn: "2026-03-12 08:19",
        breakOut: "2026-03-12 20:18",
      },
    ],
  },
  {
    date: "2026-03-13",
    checkIn: "20:31",
    checkOut: "2026-03-14 04:39",
    durationMin: 488,
  },
  {
    date: "2026-03-14",
    checkIn: "20:18",
    checkOut: "2026-03-15 04:24",
    durationMin: 486,
  },
  {
    date: "2026-03-15",
    checkIn: "20:41",
    checkOut: "2026-03-16 04:35",
    durationMin: 474,
  },
  {
    date: "2026-03-16",
    checkIn: "20:13",
    checkOut: "2026-03-17 04:14",
    durationMin: 481,
  },
  {
    date: "2026-03-17",
    checkIn: "20:45",
    checkOut: "2026-03-18 04:45",
    durationMin: 480,
  },
  {
    date: "2026-03-18",
    checkIn: "20:45",
    checkOut: "2026-03-19 05:03",
    durationMin: 498,
  },
  // Mar 19: no attendance data
  // Mar 20-25: leave period (seed through leave collection, not attendance)
  {
    date: "2026-03-26",
    checkIn: "22:57",
    checkOut: "2026-03-27 07:01",
    durationMin: 484,
  },
  {
    date: "2026-03-27",
    checkIn: "23:46",
    // Missing check-out intentionally kept open
  },
];

function localToUtc(year, month, day, hour, minute) {
  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute, 0) -
    UTC_OFFSET_HOURS * 3600 * 1000;
  return new Date(utcMs);
}

function isoDate(dateObj) {
  return { $date: dateObj.toISOString() };
}

function parseDateParts(yyyyMmDd) {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  return { year, month, day };
}

function parseTimeParts(hhMm) {
  const [hour, minute] = hhMm.split(":").map(Number);
  return { hour, minute };
}

function parseDateTimeParts(yyyyMmDdHhMm) {
  const [datePart, timePart] = yyyyMmDdHhMm.split(" ");
  const date = parseDateParts(datePart);
  const time = parseTimeParts(timePart);
  return { ...date, ...time };
}

function toUtcFromDateTime(localDateTime) {
  const parts = parseDateTimeParts(localDateTime);
  return localToUtc(
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
  );
}

function minutesBetween(a, b) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

function round2(n) {
  return +n.toFixed(2);
}

function buildRecord(entry) {
  const dateParts = parseDateParts(entry.date);
  const checkInParts = parseTimeParts(entry.checkIn);

  const checkIn = localToUtc(
    dateParts.year,
    dateParts.month,
    dateParts.day,
    checkInParts.hour,
    checkInParts.minute,
  );

  const checkOut = entry.checkOut
    ? toUtcFromDateTime(entry.checkOut)
    : undefined;

  const breaks = (entry.breaks ?? []).map((b) => {
    const breakIn = toUtcFromDateTime(b.breakIn);
    const breakOut = toUtcFromDateTime(b.breakOut);
    return {
      breakIn,
      breakOut,
      duration: minutesBetween(breakIn, breakOut),
    };
  });

  const totalBreakTime = breaks.reduce((sum, b) => sum + b.duration, 0);

  // Always derive from timestamps so the stored value matches what the
  // payroll engine will compute — never trust the manual durationMin field.
  const grossMs = checkOut ? checkOut.getTime() - checkIn.getTime() : null;
  const grossMinutes =
    grossMs !== null ? Math.max(0, Math.round(grossMs / 60000)) : null;
  const computedWorkMinutes =
    grossMinutes !== null ? Math.max(0, grossMinutes - totalBreakTime) : null;
  const totalWorkHours =
    computedWorkMinutes !== null ? round2(computedWorkMinutes / 60) : undefined;
  const totalHours =
    grossMinutes !== null ? round2(grossMinutes / 60) : undefined;

  const record = {
    employeeId: EMPLOYEE_ID,
    date: isoDate(
      new Date(
        Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0),
      ),
    ),
    checkIn: isoDate(checkIn),
    checkOut: checkOut ? isoDate(checkOut) : undefined,
    breaks: breaks.map((b) => ({
      breakIn: isoDate(b.breakIn),
      breakOut: isoDate(b.breakOut),
      duration: b.duration,
    })),
    status: "present",
    totalHours,
    totalBreakTime,
    totalWorkHours,
    network: {
      ip: OFFICE_IP,
      ssid: OFFICE_SSID,
      ua: UA,
    },
    checkInIP: OFFICE_IP,
    checkOutIP: checkOut ? OFFICE_IP : undefined,
    source: entry.source ?? "button",
    createdAt: isoDate(checkIn),
    updatedAt: isoDate(checkOut ?? checkIn),
  };

  Object.keys(record).forEach(
    (k) => record[k] === undefined && delete record[k],
  );
  return record;
}

const records = ACTUAL_ENTRIES.map(buildRecord);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "attendance-seed.json");
writeFileSync(outputPath, JSON.stringify(records, null, 2), "utf8");

console.log("Actual attendance seed generated.");
console.log(`Employee ID: ${EMPLOYEE_ID}`);
console.log(`Total records: ${records.length}`);
console.log(`Output: ${outputPath}`);
