import mongoose, { Schema, InferSchemaType, models } from "mongoose";

const LeaveBalanceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    annual: { type: Number, default: 0 },
    sick: { type: Number, default: 0 },
    casual: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type LeaveBalanceDoc = InferSchemaType<typeof LeaveBalanceSchema>;
export default models.LeaveBalance ||
  mongoose.model("LeaveBalance", LeaveBalanceSchema);
