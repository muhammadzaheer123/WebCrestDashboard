import { Schema, model, models, Model, Document, Types } from "mongoose";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ILeave extends Document {
  employeeId: Types.ObjectId;
  employeeName: string;
  employeeEmail: string;
  type: "Casual" | "Sick" | "Annual" | "Unpaid" | "Other";
  startDate: Date;
  endDate: Date;
  monthKey: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  hrComment: string;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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

const Leave =
  (models.Leave as Model<ILeave>) || model<ILeave>("Leave", LeaveSchema);

export default Leave;
