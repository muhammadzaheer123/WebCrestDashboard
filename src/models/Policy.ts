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
    // if you have multi-company later, add orgId/companyId here
    key: { type: String, required: true, unique: true, default: "default" },

    workdayStart: { type: String, required: true, default: "09:00" },
    workdayEnd: { type: String, required: true, default: "18:00" },
    graceMinutes: { type: Number, required: true, default: 10 },

    lateAfterMinutes: { type: Number, required: true, default: 10 },
    halfDayAfterMinutes: { type: Number, required: true, default: 120 },
    absentAfterMinutes: { type: Number, required: true, default: 240 },

    leaveTypes: { type: [LeaveTypeSchema], required: true, default: [] },
    holidays: { type: [HolidaySchema], required: true, default: [] },
    shifts: { type: [ShiftSchema], required: true, default: [] },
  },
  { timestamps: true },
);

export type PolicyDoc = mongoose.InferSchemaType<typeof PolicySchema>;

export const Policy =
  (models.Policy as mongoose.Model<PolicyDoc>) || model("Policy", PolicySchema);
