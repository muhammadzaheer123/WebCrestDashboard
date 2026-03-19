import mongoose, { Schema, models, model } from "mongoose";

const PayrollDaySchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    dayType: {
      type: String,
      enum: [
        "working-day",
        "weekend",
        "holiday",
        "paid-leave",
        "unpaid-leave",
        "present",
        "half-day",
        "absent",
      ],
      required: true,
    },
    attendanceStatus: { type: String, default: "" },
    payableFraction: { type: Number, required: true, default: 0 },
    deductionFraction: { type: Number, required: true, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    workedMinutes: { type: Number, default: 0 },
    breakMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    dailySalaryEarned: { type: Number, default: 0 },
    autoClosed: { type: Boolean, default: false },
    remarks: { type: [String], default: [] },
  },
  { _id: false },
);

const PayrollSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },

    employeeName: { type: String, required: true, default: "" },
    employeeEmail: { type: String, required: true, default: "" },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time"],
      required: true,
      default: "full-time",
    },

    baseSalary: { type: Number, required: true, default: 0 },
    perDaySalary: { type: Number, required: true, default: 0 },
    perHourSalary: { type: Number, required: true, default: 0 },
    salaryMode: {
      type: String,
      enum: ["per-day", "per-hour"],
      required: true,
      default: "per-day",
    },

    workingDays: { type: Number, required: true, default: 0 },
    weekendDays: { type: Number, required: true, default: 0 },
    holidayDays: { type: Number, required: true, default: 0 },

    presentDays: { type: Number, required: true, default: 0 },
    halfDays: { type: Number, required: true, default: 0 },
    absentDays: { type: Number, required: true, default: 0 },

    paidLeaveDays: { type: Number, required: true, default: 0 },
    unpaidLeaveDays: { type: Number, required: true, default: 0 },

    lateCount: { type: Number, required: true, default: 0 },
    latePenaltyLeaveDays: { type: Number, required: true, default: 0 },

    deductionDays: { type: Number, required: true, default: 0 },
    deductionAmount: { type: Number, required: true, default: 0 },
    totalWorkedHours: { type: Number, required: true, default: 0 },
    totalOvertimeHours: { type: Number, required: true, default: 0 },
    overtimeAmount: { type: Number, required: true, default: 0 },
    netSalary: { type: Number, required: true, default: 0 },

    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
    },

    breakdown: { type: [PayrollDaySchema], default: [] },
  },
  { timestamps: true },
);

PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export type PayrollDoc = mongoose.InferSchemaType<typeof PayrollSchema>;

export const Payroll =
  (models.Payroll as mongoose.Model<PayrollDoc>) ||
  model("Payroll", PayrollSchema);
