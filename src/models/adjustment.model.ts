import mongoose, { Schema, Document } from "mongoose";

export interface IAdjustment extends Document {
  employeeId: string;
  type: "bonus" | "deduction";
  amount: number;
  reason: string;
  description?: string;
  date: Date;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  remarks?: string;
}

const adjustmentSchema = new Schema<IAdjustment>(
  {
    employeeId: {
      type: String,
      required: true,
      ref: "Employee",
    },
    type: {
      type: String,
      enum: ["bonus", "deduction"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Adjustment ||
  mongoose.model<IAdjustment>("Adjustment", adjustmentSchema);
