import mongoose from "mongoose";
import Attendance from "@/models/attendance.model";
import Employee from "@/models/Employee";
import Leave from "@/models/Leave";
import { Policy, type PolicyDoc } from "@/models/Policy";

type EmployeeLike = {
  _id: any;
  name: string;
  email: string;
  salary: number;
  shift?: string;
  employmentType?: "full-time" | "part-time";
  isActive?: boolean;
};

type PayrollDay = {
  date: string;
  dayType:
    | "working-day"
    | "weekend"
    | "holiday"
    | "paid-leave"
    | "unpaid-leave"
    | "present"
    | "half-day"
    | "absent";
  attendanceStatus: string;
  payableFraction: number;
  deductionFraction: number;
  lateMinutes: number;
  workedMinutes: number;
  breakMinutes: number;
  /** Overtime minutes beyond the required shift hours (only populated in per-hour mode) */
  overtimeMinutes: number;
  /** Actual monetary amount earned for this day based on the active salary mode */
  dailySalaryEarned: number;
  autoClosed: boolean;
  remarks: string[];
};

type PayrollSummary = {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employmentType: "full-time" | "part-time";
  month: number;
  year: number;
  /** Active salary calculation mode from policy */
  salaryMode: "per-day" | "per-hour";
  baseSalary: number;
  perDaySalary: number;
  /** Hourly rate = perDaySalary / (fullDayMinutes / 60) */
  perHourSalary: number;
  workingDays: number;
  weekendDays: number;
  holidayDays: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  lateCount: number;
  latePenaltyLeaveDays: number;
  deductionDays: number;
  deductionAmount: number;
  /** Total regular hours worked across all present/half-day entries */
  totalWorkedHours: number;
  /** Total overtime hours (per-hour mode only, requires policy.overtimeEnabled) */
  totalOvertimeHours: number;
  /** Total extra pay earned from overtime (per-hour mode only) */
  overtimeAmount: number;
  netSalary: number;
  breakdown: PayrollDay[];
};

function round2(n: number) {
  return Number(n.toFixed(2));
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthRange(year: number, month: number) {
  // Payroll period: 10th of the given month to 10th of the next month (exclusive)
  const start = new Date(year, month - 1, 10, 0, 0, 0, 0);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = new Date(nextYear, nextMonth - 1, 10, 0, 0, 0, 0);
  return { start, end };
}

// Generates every day in the payroll period: 10th of `month` through 9th of next month
function eachDayOfPayrollPeriod(year: number, month: number) {
  const days: Date[] = [];
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = new Date(nextYear, nextMonth - 1, 10, 0, 0, 0, 0);
  const current = new Date(year, month - 1, 10, 0, 0, 0, 0);
  while (current < end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function parseTimeOnDate(baseDate: Date, time: string) {
  const [hh, mm] = String(time || "00:00")
    .split(":")
    .map((v) => Number(v || 0));

  const d = new Date(baseDate);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function getShiftPolicy(employeeShift: string | undefined, policy: PolicyDoc) {
  if (employeeShift && Array.isArray(policy.shifts)) {
    const found = policy.shifts.find(
      (s) =>
        String(s.name).toLowerCase() === String(employeeShift).toLowerCase() ||
        String(s.id).toLowerCase() === String(employeeShift).toLowerCase(),
    );
    if (found) return found;
  }

  return {
    id: "default",
    name: "Default",
    start: policy.workdayStart,
    end: policy.workdayEnd,
    breakMinutes: 0,
  };
}

function getRequiredMinutes(
  policy: PolicyDoc,
  shift: { start: string; end: string; breakMinutes: number },
) {
  if (typeof policy.fullDayMinutes === "number" && policy.fullDayMinutes > 0) {
    return policy.fullDayMinutes;
  }

  const sampleDate = new Date();
  const start = parseTimeOnDate(sampleDate, shift.start);
  const end = parseTimeOnDate(sampleDate, shift.end);
  const raw = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000) -
      (shift.breakMinutes || 0),
  );

  return raw || 480;
}

function sumBreakMinutes(breaks: any[] = []) {
  return breaks.reduce((sum, b) => {
    if (typeof b?.duration === "number") return sum + b.duration;

    if (b?.breakIn && b?.breakOut) {
      return (
        sum +
        Math.max(
          0,
          Math.round(
            (new Date(b.breakOut).getTime() - new Date(b.breakIn).getTime()) /
              60000,
          ),
        )
      );
    }

    return sum;
  }, 0);
}

function findApprovedLeaveForDay(leaves: any[], day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return leaves.find((leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return leave.status === "approved" && dayStart >= start && dayStart <= end;
  });
}

function getLeavePaidStatus(policy: PolicyDoc, leaveType: string) {
  const found = (policy.leaveTypes || []).find(
    (t) =>
      String(t.id).toLowerCase() === String(leaveType).toLowerCase() ||
      String(t.name).toLowerCase() === String(leaveType).toLowerCase(),
  );

  if (found) return !!found.paid;
  if (String(leaveType).toLowerCase() === "unpaid") return false;

  return true;
}

export async function calculateEmployeePayroll(params: {
  employeeId: string;
  month: number;
  year: number;
}) {
  const { employeeId, month, year } = params;

  const employee = (await Employee.findById(
    employeeId,
  ).lean()) as EmployeeLike | null;
  if (!employee) {
    throw new Error("Employee not found");
  }

  const policy = await Policy.findOne({
    key: "default",
  }).lean<PolicyDoc | null>();
  if (!policy) {
    throw new Error("Policy not found");
  }

  const { start, end } = monthRange(year, month);

  const [attendanceRows, leaveRows] = await Promise.all([
    Attendance.find({
      employeeId,
      date: { $gte: start, $lt: end },
    }).lean(),
    Leave.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: "approved",
      startDate: { $lt: end },
      endDate: { $gte: start },
    }).lean(),
  ]);

  const attendanceByDay = new Map<string, any>();
  for (const row of attendanceRows) {
    const key = toYmd(new Date(row.date));
    attendanceByDay.set(key, row);
  }

  const holidays = new Set((policy.holidays || []).map((h) => h.date));
  const weekends = new Set(policy.weekends || [0]);

  const days = eachDayOfPayrollPeriod(year, month);

  // Only process days up to today — future dates have not occurred yet.
  const processingCutoff = new Date();
  processingCutoff.setHours(23, 59, 59, 999);

  const shift = getShiftPolicy(employee.shift, policy);
  const requiredMinutes = getRequiredMinutes(policy, shift);
  const halfDayMinutes =
    policy.halfDayMinutes || Math.floor(requiredMinutes / 2);
  const graceMinutes = Math.max(0, Number(policy.graceMinutes || 0));
  const lateThresholdMinutes = Math.max(
    Number(policy.lateAfterMinutes || 0),
    graceMinutes,
  );

  // ------------------------------------------------------------------
  // Salary rate computation
  // Pre-count the total workable (non-weekend, non-holiday) days in the
  // month so perDaySalary and perHourSalary are available during the loop.
  // ------------------------------------------------------------------
  const salaryMode =
    ((policy as any).salaryCalculationMode as "per-day" | "per-hour") ||
    "per-day";
  // Overtime applies in both per-day and per-hour modes — any minutes beyond the
  // required shift hours are paid at (perHourSalary / 60) * overtimeMultiplier per minute.
  const overtimeEnabled = !!(policy as any).overtimeEnabled;
  const overtimeMultiplier =
    typeof (policy as any).overtimeMultiplier === "number" &&
    (policy as any).overtimeMultiplier >= 1
      ? (policy as any).overtimeMultiplier
      : 1.5;
  const hoursPerDay = requiredMinutes / 60; // e.g., 480 min â†’ 8 h

  let preWorkingDays = 0;
  for (const day of days) {
    const dayKey = toYmd(day);
    if (!holidays.has(dayKey) && !weekends.has(day.getDay())) {
      preWorkingDays += 1;
    }
  }

  const perDaySalary =
    preWorkingDays > 0
      ? round2(employee.salary / preWorkingDays)
      : employee.salary;
  // perHourSalary = salary earned per hour of regular work
  const perHourSalary =
    hoursPerDay > 0 ? round2(perDaySalary / hoursPerDay) : 0;

  // ------------------------------------------------------------------
  // Main day loop
  // ------------------------------------------------------------------
  const breakdown: PayrollDay[] = [];

  let workingDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let lateCount = 0;
  let totalWorkedHoursAcc = 0;
  let totalOvertimeHoursAcc = 0;
  let overtimeAmountAcc = 0;

  // Company grace allowance per payroll period:
  // first 1 absent → paid by company, first 1 half-day → no deduction taken.
  // Only the excess is deducted.
  const COMPANY_PAID_ABSENTS = 1;
  const COMPANY_PAID_HALF_DAYS = 1;
  let graceAbsentsUsed = 0;
  let graceHalfDaysUsed = 0;
  // Counts of days that actually incur a deduction (excludes grace days)
  let deductibleAbsentDays = 0;
  let deductibleHalfDays = 0;

  for (const day of days) {
    const dayKey = toYmd(day);
    const weekday = day.getDay();

    // Skip future dates only when there is no attendance record for that day.
    // If a record exists (pre-seeded or early submission) we still process it.
    // This prevents phantom absents for days that haven't happened yet.
    if (day > processingCutoff && !attendanceByDay.has(dayKey)) continue;

    // ---- Holiday (company paid — no deduction) ----
    if (holidays.has(dayKey)) {
      holidayDays += 1;
      breakdown.push({
        date: dayKey,
        dayType: "holiday",
        attendanceStatus: "",
        payableFraction: 1,
        deductionFraction: 0,
        lateMinutes: 0,
        workedMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        dailySalaryEarned: 0,
        autoClosed: false,
        remarks: ["Holiday — paid by company"],
      });
      continue;
    }

    // ---- Weekend (company paid — no deduction) ----
    if (weekends.has(weekday)) {
      weekendDays += 1;
      breakdown.push({
        date: dayKey,
        dayType: "weekend",
        attendanceStatus: "",
        payableFraction: 1,
        deductionFraction: 0,
        lateMinutes: 0,
        workedMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        dailySalaryEarned: 0,
        autoClosed: false,
        remarks: ["Weekend — paid by company"],
      });
      continue;
    }

    workingDays += 1;

    // ---- Approved leave ----
    const leave = findApprovedLeaveForDay(leaveRows, day);
    if (leave) {
      const paid = getLeavePaidStatus(policy, leave.type);
      const fraction = leave.isHalfDay ? 0.5 : 1;
      const leaveRemarks = [
        `${paid ? "Paid" : "Unpaid"} leave (${leave.type})`,
        ...(leave.isHalfDay ? [`Half day ${leave.halfDayPart || ""}`] : []),
      ].filter(Boolean);

      // Compute earned amount for leaves
      let leaveDailyEarned = 0;
      if (paid) {
        if (salaryMode === "per-hour") {
          leaveDailyEarned = round2(fraction * hoursPerDay * perHourSalary);
        } else {
          leaveDailyEarned = round2(fraction * perDaySalary);
        }
        paidLeaveDays += fraction;
      } else {
        unpaidLeaveDays += fraction;
      }

      breakdown.push({
        date: dayKey,
        dayType: paid ? "paid-leave" : "unpaid-leave",
        attendanceStatus: "approved-leave",
        payableFraction: paid ? fraction : 0,
        deductionFraction: paid ? 1 - fraction : fraction,
        lateMinutes: 0,
        workedMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        dailySalaryEarned: leaveDailyEarned,
        autoClosed: false,
        remarks: leaveRemarks,
      });
      continue;
    }

    // ---- Attendance day ----
    const attendance = attendanceByDay.get(dayKey);

    // Attendance record marked as leave with no checkIn (e.g. from attendance system directly)
    // and no approved LeaveRequest found above — treat as unpaid leave day.
    if (attendance && !attendance.checkIn && attendance.status === "leave") {
      unpaidLeaveDays += 1;
      breakdown.push({
        date: dayKey,
        dayType: "unpaid-leave",
        attendanceStatus: "leave",
        payableFraction: 0,
        deductionFraction: 1,
        lateMinutes: 0,
        workedMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        dailySalaryEarned: 0,
        autoClosed: false,
        remarks: ["Leave day (no approved leave request on record)"],
      });
      continue;
    }

    if (!attendance || !attendance.checkIn) {
      absentDays += 1;
      const isGrace = graceAbsentsUsed < COMPANY_PAID_ABSENTS;
      if (isGrace) graceAbsentsUsed += 1;
      else deductibleAbsentDays += 1;
      // Grace absent: company pays the full day even though no one showed up
      const graceDailyEarned = isGrace
        ? salaryMode === "per-hour"
          ? round2(hoursPerDay * perHourSalary)
          : perDaySalary
        : 0;
      breakdown.push({
        date: dayKey,
        dayType: "absent",
        attendanceStatus: "absent",
        payableFraction: isGrace ? 1 : 0,
        deductionFraction: isGrace ? 0 : 1,
        lateMinutes: 0,
        workedMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        dailySalaryEarned: graceDailyEarned,
        autoClosed: false,
        remarks: [
          isGrace
            ? "No attendance — company grace day (paid, 1 per period)"
            : "No attendance",
        ],
      });
      continue;
    }

    const actualCheckIn = new Date(attendance.checkIn);
    const actualCheckOut = attendance.checkOut
      ? new Date(attendance.checkOut)
      : null;

    // Payroll is based solely on actual check-in / checkout times.
    // If the employee never checked out, they earn 0 minutes for that day.
    const autoClosed = !actualCheckOut;

    const breakMinutes = sumBreakMinutes(attendance.breaks || []);
    const grossMinutes = actualCheckOut
      ? Math.max(
          0,
          Math.round(
            (actualCheckOut.getTime() - actualCheckIn.getTime()) / 60000,
          ),
        )
      : 0;
    const workedMinutes = Math.max(0, grossMinutes - breakMinutes);
    const shortWorkMinutes = Math.max(0, requiredMinutes - workedMinutes);
    const shortageLateMinutes =
      shortWorkMinutes > graceMinutes ? shortWorkMinutes : 0;
    const lateMinutes = shortageLateMinutes;

    // Effective half-day boundary: grace applies here too, so a shortfall
    // within graceMinutes of the half-day threshold is treated as "late but
    // still present", not as a half-day.
    const effectiveHalfDayMinutes = Math.max(0, halfDayMinutes - graceMinutes);

    // --- Day classification (same for both modes) ---
    let dayType: PayrollDay["dayType"] = "present";
    let payableFraction = 1;
    let deductionFraction = 0;
    const remarks: string[] = [];

    if (lateMinutes > lateThresholdMinutes) {
      lateCount += 1;
      if (shortageLateMinutes > 0) {
        remarks.push(`Short work by ${shortageLateMinutes} minute(s)`);
      }
    }

    if (workedMinutes < effectiveHalfDayMinutes) {
      dayType = "half-day";
      halfDays += 1;
      const isGrace = graceHalfDaysUsed < COMPANY_PAID_HALF_DAYS;
      if (isGrace) graceHalfDaysUsed += 1;
      else deductibleHalfDays += 1;
      payableFraction = 0.5;
      deductionFraction = isGrace ? 0 : 0.5; // grace → no deduction; otherwise deduct 0.5

      remarks.push("Worked less than half day threshold");
    } else {
      dayType = "present";
      payableFraction = 1;
      deductionFraction = 0;
      presentDays += 1;

      if (workedMinutes < requiredMinutes) {
        remarks.push(
          "Worked less than full-day minutes but above half-day threshold",
        );
      }
    }

    if (autoClosed) {
      remarks.push("No checkout recorded — 0 worked minutes credited");
    }

    // --- Per-hour adjustments & earned amount ---
    let dayOvertimeMinutes = 0;
    let dailySalaryEarned = 0;

    if (salaryMode === "per-hour") {
      // present or half-day: pay for actual regular hours worked (capped at required)
      const regularWorked = Math.min(workedMinutes, requiredMinutes);
      const regularEarned = round2((regularWorked / 60) * perHourSalary);
      dailySalaryEarned = regularEarned;

      // track total worked hours
      totalWorkedHoursAcc += round2(workedMinutes / 60);

      // Overtime: every minute beyond required shift hours
      if (overtimeEnabled && workedMinutes > requiredMinutes) {
        dayOvertimeMinutes = workedMinutes - requiredMinutes;
        // per-minute rate = perHourSalary / 60
        const perMinuteSalary = round2(perHourSalary / 60);
        const otEarned = round2(
          dayOvertimeMinutes * perMinuteSalary * overtimeMultiplier,
        );
        dailySalaryEarned = round2(dailySalaryEarned + otEarned);
        overtimeAmountAcc = round2(overtimeAmountAcc + otEarned);
        totalOvertimeHoursAcc = round2(
          totalOvertimeHoursAcc + dayOvertimeMinutes / 60,
        );
        remarks.push(
          `Overtime: ${dayOvertimeMinutes}m × ${perMinuteSalary}/min × ${overtimeMultiplier} = +${otEarned}`,
        );
      }

      // In per-hour mode, update payableFraction to reflect actual hours ratio
      // so the Payable column in the UI shows reality
      const hrFraction = round2(
        Math.min(workedMinutes, requiredMinutes) / requiredMinutes,
      );
      payableFraction = hrFraction;
      deductionFraction = round2(1 - hrFraction);
    } else {
      // per-day mode: earned is the HR-fraction of a full day's pay
      dailySalaryEarned = round2(payableFraction * perDaySalary);
      totalWorkedHoursAcc += round2(workedMinutes / 60);

      // Overtime: per-minute rate beyond required shift hours
      if (overtimeEnabled && workedMinutes > requiredMinutes) {
        dayOvertimeMinutes = workedMinutes - requiredMinutes;
        const perMinuteSalary = round2(perHourSalary / 60);
        const otEarned = round2(
          dayOvertimeMinutes * perMinuteSalary * overtimeMultiplier,
        );
        dailySalaryEarned = round2(dailySalaryEarned + otEarned);
        overtimeAmountAcc = round2(overtimeAmountAcc + otEarned);
        totalOvertimeHoursAcc = round2(
          totalOvertimeHoursAcc + dayOvertimeMinutes / 60,
        );
        remarks.push(
          `Overtime: ${dayOvertimeMinutes}m × ${perMinuteSalary}/min × ${overtimeMultiplier} = +${otEarned}`,
        );
      }
    }

    breakdown.push({
      date: dayKey,
      dayType,
      attendanceStatus: attendance.status || dayType,
      payableFraction,
      deductionFraction,
      lateMinutes,
      workedMinutes,
      breakMinutes,
      overtimeMinutes: dayOvertimeMinutes,
      dailySalaryEarned,
      autoClosed,
      remarks,
    });
  }

  // ------------------------------------------------------------------
  // Summaries
  // ------------------------------------------------------------------
  const latePenaltyLeaveDays =
    policy.enableLatePenalty && policy.lateToLeaveThreshold > 0
      ? Math.floor(lateCount / policy.lateToLeaveThreshold)
      : 0;

  const deductionDays =
    deductibleAbsentDays +
    unpaidLeaveDays +
    deductibleHalfDays * 0.5 +
    latePenaltyLeaveDays;

  let deductionAmount: number;
  let netSalary: number;
  const totalWorkedHours = round2(totalWorkedHoursAcc);
  const totalOvertimeHours = round2(totalOvertimeHoursAcc);
  const overtimeAmount = round2(overtimeAmountAcc);

  if (salaryMode === "per-hour") {
    // Net = sum of all daily earned amounts (already includes overtime per-day)
    // Then subtract late-penalty deductions (expressed in per-day units)
    const penaltyDeduction = round2(latePenaltyLeaveDays * perDaySalary);
    const earnedSum = round2(
      breakdown.reduce((s, d) => s + d.dailySalaryEarned, 0),
    );
    // deductionAmount = how much below base salary was earned (excluding overtime)
    const earnedRegular = round2(earnedSum - overtimeAmount);
    deductionAmount = round2(
      Math.max(0, employee.salary - earnedRegular + penaltyDeduction),
    );
    netSalary = Math.max(0, round2(earnedSum - penaltyDeduction));
  } else {
    // per-day mode: deduct absent/unpaid/half-day fractions, then add overtime
    deductionAmount = round2(perDaySalary * deductionDays);
    netSalary = Math.max(
      0,
      round2(employee.salary - deductionAmount + overtimeAmount),
    );
  }

  const summary: PayrollSummary = {
    employeeId,
    employeeName: employee.name || "",
    employeeEmail: employee.email || "",
    employmentType: employee.employmentType || "full-time",
    month,
    year,
    salaryMode,
    baseSalary: employee.salary || 0,
    perDaySalary,
    perHourSalary,
    workingDays,
    weekendDays,
    holidayDays,
    presentDays,
    halfDays,
    absentDays,
    paidLeaveDays,
    unpaidLeaveDays,
    lateCount,
    latePenaltyLeaveDays,
    deductionDays,
    deductionAmount,
    totalWorkedHours,
    totalOvertimeHours,
    overtimeAmount,
    netSalary,
    breakdown,
  };

  return summary;
}
