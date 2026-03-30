import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Employee from "@/models/Employee";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    const employee = await Employee.findById(id).select("-password -__v");

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Employee fetched successfully",
      employee,
    });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (
      body.employmentType !== undefined &&
      !["full-time", "part-time"].includes(body.employmentType)
    ) {
      return NextResponse.json(
        {
          error: "employmentType must be either 'full-time' or 'part-time'",
        },
        { status: 400 },
      );
    }

    if (
      body.role !== undefined &&
      !["admin", "hr", "employee"].includes(body.role)
    ) {
      return NextResponse.json(
        {
          error: "role must be either 'admin', 'hr', or 'employee'",
        },
        { status: 400 },
      );
    }

    if (body.salary !== undefined) {
      const salaryNumber = Number(body.salary);

      if (Number.isNaN(salaryNumber) || salaryNumber < 0) {
        return NextResponse.json(
          { error: "salary must be a valid number greater than or equal to 0" },
          { status: 400 },
        );
      }

      body.salary = salaryNumber;
    }

    const employee = await Employee.findById(id).select("+password");

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    if (body.name !== undefined) employee.name = body.name;
    if (body.email !== undefined) employee.email = body.email;
    if (body.phone !== undefined) employee.phone = body.phone;
    if (body.department !== undefined) employee.department = body.department;
    if (body.designation !== undefined) employee.designation = body.designation;
    if (body.role !== undefined) employee.role = body.role;
    if (body.shift !== undefined) employee.shift = body.shift;
    if (body.salary !== undefined) employee.salary = body.salary;
    if (body.qrCode !== undefined) employee.qrCode = body.qrCode;
    if (body.isActive !== undefined) employee.isActive = body.isActive;
    if (body.joiningDate !== undefined) employee.joiningDate = body.joiningDate;
    if (body.employmentType !== undefined) {
      employee.employmentType = body.employmentType;
    }

    if (
      body.password !== undefined &&
      typeof body.password === "string" &&
      body.password.trim() !== ""
    ) {
      employee.password = body.password.trim();
    }

    await employee.save();

    const updatedEmployee =
      await Employee.findById(id).select("-password -__v");

    return NextResponse.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error: any) {
    console.error("Error updating employee:", error);

    if (error?.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "Email or employeeId already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    const employee =
      await Employee.findByIdAndDelete(id).select("-password -__v");

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Employee deleted successfully",
      employee,
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
