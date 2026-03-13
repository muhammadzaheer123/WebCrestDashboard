import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Employee from "../../../models/Employee";

async function generateQRCode(email: string): Promise<string> {
  return `QR_${email}_${Date.now()}`;
}

// POST api
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const requiredFields = [
      "name",
      "email",
      "phone",
      "department",
      "designation",
      "shift",
      "salary",
    ];

    const missingFields = requiredFields.filter(
      (field) =>
        body[field] === undefined || body[field] === null || body[field] === "",
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          missingFields,
        },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      phone,
      department,
      designation,
      role = "employee",
      shift,
      salary,
      password,
    } = body;

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required",
        },
        { status: 400 },
      );
    }

    const parsedSalary = Number(salary);

    if (Number.isNaN(parsedSalary) || parsedSalary < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Salary must be a valid number greater than or equal to 0",
        },
        { status: 400 },
      );
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee with this email already exists",
        },
        { status: 409 },
      );
    }

    const qrCode = await generateQRCode(email);

    const employee = new Employee({
      employeeId: `EMP${Date.now()}`,
      name,
      email,
      phone,
      department,
      designation,
      role,
      shift,
      salary: parsedSalary,
      password,
      qrCode,
    });

    await employee.save();

    const employeeResponse = {
      id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      role: employee.role,
      shift: employee.shift,
      salary: employee.salary,
      qrCode: employee.qrCode,
      isActive: employee.isActive,
      joiningDate: employee.joiningDate,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        data: employeeResponse,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating employee:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 },
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee with this email or employee ID already exists",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

// GET api
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const department = searchParams.get("department");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const filter: Record<string, any> = { isActive: true };

    if (department) filter.department = department;
    if (role) filter.role = role;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const employees = await Employee.find(filter)
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      message: "Employees fetched successfully",
      data: {
        employees,
        pagination: {
          currentPage: page,
          totalPages,
          totalEmployees: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching employees:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch employees",
      },
      { status: 500 },
    );
  }
}
