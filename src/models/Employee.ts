import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  role: "admin" | "hr" | "employee";
  shift: string;
  password: string;
  qrCode: string;
  isActive: boolean;
  joiningDate: Date;
  resetOtp?: string;
  resetOtpExpire?: number;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "hr", "employee"],
      default: "employee",
    },
    shift: { type: String, required: true },
    password: { type: String, required: true, select: false },
    qrCode: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    joiningDate: { type: Date, default: Date.now },
    resetOtp: { type: String, select: false },
    resetOtpExpire: { type: Number, select: false },
  },
  { timestamps: true },
);

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const Employee: Model<IEmployee> =
  (mongoose.models.Employee as Model<IEmployee>) ||
  mongoose.model<IEmployee>("Employee", employeeSchema);

export default Employee;
