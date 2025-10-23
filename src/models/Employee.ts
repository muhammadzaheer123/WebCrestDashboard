import mongoose, { Schema, Document } from "mongoose";
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
}

const employeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "hr", "employee"],
    default: "employee",
  },
  shift: { type: String, required: true },
  password: { type: String, required: true },
  qrCode: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  joiningDate: { type: Date, default: Date.now },
});

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export default mongoose.models.Employee ||
  mongoose.model<IEmployee>("Employee", employeeSchema);
