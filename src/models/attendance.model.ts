import mongoose, { Schema, Document } from "mongoose";

export interface IBreak {
  breakIn: Date;
  breakOut?: Date;
  duration?: number;
}

export interface IAttendance extends Document {
  employeeId: string;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  breaks: IBreak[];
  status: "present" | "absent" | "half-day" | "on-break";
  totalHours?: number;
  checkInIP?: string;
  checkOutIP?: string;
}

const breakSchema = new Schema<IBreak>({
  breakIn: { type: Date, required: true },
  breakOut: { type: Date },
  duration: { type: Number, default: 0 },
});

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
    },
    breaks: [breakSchema],
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "on-break"],
      default: "present",
    },
    totalHours: {
      type: Number,
    },
    checkInIP: {
      type: String,
    },
    checkOutIP: {
      type: String,
    },
  },

  {
    timestamps: true,
  }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", attendanceSchema);
