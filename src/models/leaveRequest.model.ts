import mongoose, { Schema, InferSchemaType, models } from "mongoose";

const LeaveRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["annual", "sick", "casual", "unpaid", "other"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isHalfDay: { type: Boolean, default: false },
    halfDayPart: { type: String, enum: ["AM", "PM", null], default: null },
    reason: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },  
    approverId: { type: Schema.Types.ObjectId, ref: "User" },
    daysRequested: { type: Number, required: true },
    balanceSnapshot: {
      annual: Number,
      sick: Number,
      casual: Number,
    },
  },
  { timestamps: true }
);

export type LeaveRequestDoc = InferSchemaType<typeof LeaveRequestSchema>;
export default models.LeaveRequest ||
  mongoose.model("LeaveRequest", LeaveRequestSchema);
