import mongoose, { Schema, models, model } from "mongoose";

const LeaveTypeSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    paid: { type: Boolean, required: true, default: true },
    requiresApproval: { type: Boolean, required: true, default: true },
    maxPerYear: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const HolidaySchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { _id: false },
);

const ShiftSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    start: { type: String, required: true }, // HH:MM
    end: { type: String, required: true }, // HH:MM
    breakMinutes: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const PolicySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },

    workdayStart: { type: String, required: true, default: "09:00" },
    workdayEnd: { type: String, required: true, default: "18:00" },
    graceMinutes: { type: Number, required: true, default: 20 },

    lateAfterMinutes: { type: Number, required: true, default: 20 },
    halfDayAfterMinutes: { type: Number, required: true, default: 120 },
    absentAfterMinutes: { type: Number, required: true, default: 240 },

    fullDayMinutes: { type: Number, required: true, default: 480 },
    halfDayMinutes: { type: Number, required: true, default: 240 },

    salaryCalculationMode: {
      type: String,
      enum: ["per-day", "per-hour"],
      required: true,
      default: "per-day",
    },
    overtimeEnabled: { type: Boolean, required: true, default: false },
    overtimeMultiplier: { type: Number, required: true, default: 1.5, min: 1 },

    partTimeMode: {
      type: String,
      enum: ["monthly-deduction"],
      required: true,
      default: "monthly-deduction",
    },

    enableLatePenalty: { type: Boolean, required: true, default: true },
    lateToLeaveThreshold: { type: Number, required: true, default: 3, min: 1 },

    missingCheckoutAction: {
      type: String,
      enum: ["auto-close"],
      required: true,
      default: "auto-close",
    },

    weekends: {
      type: [Number], // JS weekday indexes: 0=Sun ... 6=Sat
      required: true,
      default: [0],
    },

    leaveTypes: { type: [LeaveTypeSchema], required: true, default: [] },
    holidays: { type: [HolidaySchema], required: true, default: [] },
    shifts: { type: [ShiftSchema], required: true, default: [] },
  },
  { timestamps: true },
);

export type PolicyDoc = mongoose.InferSchemaType<typeof PolicySchema>;

export const Policy =
  (models.Policy as mongoose.Model<PolicyDoc>) || model("Policy", PolicySchema);
