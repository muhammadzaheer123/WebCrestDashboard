import mongoose, { Schema, Document } from "mongoose";

export interface IBreak {
  breakIn: Date;
  breakOut?: Date;
  duration?: number;
}

export interface INetwork {
  ip?: string;
  ssid?: string;
  ua?: string;
}

export interface ICheckInLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  distanceFromOffice: number;
  checkedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface IAttendance extends Document {
  employeeId: string;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  breaks: IBreak[];
  status: "present" | "absent" | "half-day" | "on-break";
  totalHours?: number;
  totalBreakTime?: number;
  totalWorkHours?: number;
  network?: INetwork;
  checkInIP?: string;
  checkOutIP?: string;
  source?: "button" | "auto";
  checkInLocation?: ICheckInLocation;
}

const breakSchema = new Schema<IBreak>({
  breakIn: { type: Date, required: true },
  breakOut: { type: Date },
  duration: { type: Number, default: 0 },
});

const checkInLocationSchema = new Schema<ICheckInLocation>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    distanceFromOffice: { type: Number, required: true },
    checkedAt: { type: Date, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { _id: false },
);

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
    totalBreakTime: {
      type: Number,
    },
    totalWorkHours: {
      type: Number,
    },
    network: {
      ip: { type: String },
      ssid: { type: String },
      ua: { type: String },
    },
    checkInIP: {
      type: String,
    },
    checkOutIP: {
      type: String,
    },
    source: {
      type: String,
      enum: ["button", "auto"],
      default: "button",
    },
    checkInLocation: checkInLocationSchema,
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance =
  (mongoose.models.Attendance as mongoose.Model<IAttendance>) ||
  mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
