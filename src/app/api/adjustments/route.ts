import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Adjustment from "../../../models/adjustment.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const filter: any = {};

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);

      filter.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const skip = (page - 1) * limit;

    const adjustments = await Adjustment.find(filter)
      .select("-__v")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Adjustment.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      message: "Adjustments fetched successfully",
      data: {
        adjustments,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit,
        },
        filters: {
          employeeId,
          month,
          type,
          status,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching adjustments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch adjustments",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { employeeId, type, amount, reason, description, date } = body;

    const requiredFields = ["employeeId", "type", "amount", "reason"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          missingFields,
        },
        { status: 400 }
      );
    }

    if (!["bonus", "deduction"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Type must be either 'bonus' or 'deduction'",
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    const adjustment = new Adjustment({
      employeeId,
      type,
      amount,
      reason,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      status: "pending",
    });

    await adjustment.save();

    return NextResponse.json(
      {
        success: true,
        message: `${
          type === "bonus" ? "Bonus" : "Deduction"
        } added successfully`,
        data: adjustment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating adjustment:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create adjustment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
