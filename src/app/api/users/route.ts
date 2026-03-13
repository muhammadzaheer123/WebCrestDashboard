import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Employee from "@/models/Employee";

const employeeCreateSchema = z.object({
  employeeId: z.string().trim().min(1, "employeeId is required").max(50).optional(),

  name: z.string().trim().min(1, "name is required").max(100),

  email: z.string().trim().toLowerCase().email("Valid email is required"),

  phone: z.string().trim().min(1, "phone is required").max(30),

  department: z.string().trim().min(1, "department is required").max(100),

  designation: z.string().trim().min(1, "designation is required").max(100),

  role: z.enum(["admin", "hr", "employee"]).optional().default("employee"),

  shift: z.string().trim().min(1, "shift is required").max(50),

  salary: z.coerce.number().min(0, "salary must be 0 or greater"),

  password: z.string().trim().min(4, "password must be at least 4 characters").max(100),

  employmentType: z
    .string()
    .trim()
    .refine(
      (val) => ["full-time", "part-time"].includes(val),
      "employmentType must be either full-time or part-time",
    ),

  qrCode: z.string().trim().min(1).max(255).optional(),

  isActive: z.coerce.boolean().optional().default(true),

  joiningDate: z.string().trim().optional(),
});

export async function GET() {
  try {
    await connectDB();

    const employees = await Employee.find().select("-password -resetOtp -resetOtpExpire");

    return NextResponse.json(
      {
        success: true,
        message: "Employees fetched successfully",
        data: employees,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Error fetching employees:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Server error while fetching employees",
        error: err?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const rawBody = await req.json();

    const parsed = employeeCreateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const body = parsed.data;

    const normalizedEmail = body.email.toLowerCase().trim();

    const existingEmployeeByEmail = await Employee.findOne({ email: normalizedEmail });
    if (existingEmployeeByEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee with this email already exists",
        },
        { status: 409 },
      );
    }

    if (body.employeeId) {
      const existingEmployeeById = await Employee.findOne({
        employeeId: body.employeeId,
      });

      if (existingEmployeeById) {
        return NextResponse.json(
          {
            success: false,
            message: "Employee with this employeeId already exists",
          },
          { status: 409 },
        );
      }
    }

    const employeeId = body.employeeId || `EMP-${Date.now()}`;
    const qrCode = body.qrCode || `QR_${normalizedEmail}_${Date.now()}`;

    const employee = await Employee.create({
      employeeId,
      name: body.name,
      email: normalizedEmail,
      phone: body.phone,
      department: body.department,
      designation: body.designation,
      role: body.role,
      shift: body.shift,
      salary: body.salary,
      password: body.password,
      employmentType: body.employmentType,
      qrCode,
      isActive: body.isActive,
      joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        user: {
          id: employee.id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          designation: employee.designation,
          role: employee.role,
          shift: employee.shift,
          salary: employee.salary,
          employmentType: employee.employmentType,
          qrCode: employee.qrCode,
          isActive: employee.isActive,
          joiningDate: employee.joiningDate,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Error creating employee:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Server error while creating employee",
        error: err?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}