import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

export interface IEmployee {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  role: "admin" | "hr" | "employee";
  shift: string;
  salary: number;
  password: string;
  qrCode: string;
  isActive: boolean;
  joiningDate: Date;
  resetOtp?: string;
  resetOtpExpire?: number;
  createdAt?: Date;
  updatedAt?: Date;

  employmentType: "full-time" | "part-time";
}

export type EmployeeDocument = HydratedDocument<IEmployee>;

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

    salary: { type: Number, required: true, min: 0 },

    password: { type: String, required: true, select: false },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time"],
      required: true,
      default: "full-time",
    },

    qrCode: { type: String, required: true },

    isActive: { type: Boolean, default: true },

    joiningDate: { type: Date, default: Date.now },

    resetOtp: { type: String, select: false },

    resetOtpExpire: { type: Number, select: false },
  },
  { timestamps: true },
);

employeeSchema.pre("save", async function (next) {
  const doc = this as EmployeeDocument;

  if (!doc.isModified("password")) return next();

  doc.password = await bcrypt.hash(doc.password, 12);
  next();
});

const Employee: Model<IEmployee> =
  mongoose.models.Employee ||
  mongoose.model<IEmployee>("Employee", employeeSchema);

export default Employee;
