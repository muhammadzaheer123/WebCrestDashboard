import { Schema, model, models, Types } from "mongoose";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

const LeaveSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // optional denormalized fields (fast display)
    employeeName: { type: String, default: "" },
    employeeEmail: { type: String, default: "" },

    type: {
      type: String,
      enum: ["Casual", "Sick", "Annual", "Unpaid", "Other"],
      required: true,
      index: true,
    },

    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },

    // Month key for easy filtering/grouping: "2026-03"
    monthKey: { type: String, required: true, index: true },

    days: { type: Number, required: true },
    reason: { type: String, required: true, maxlength: 1000 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },

    hrComment: { type: String, default: "" },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { timestamps: true },
);

export default models.Leave || model("Leave", LeaveSchema);
