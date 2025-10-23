import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Adjustment from "../../../../models/adjustment.model";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid adjustment ID format",
        },
        { status: 400 }
      );
    }

    const adjustment = await Adjustment.findById(id);

    if (!adjustment) {
      return NextResponse.json(
        {
          success: false,
          error: "Adjustment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Adjustment fetched successfully",
      data: adjustment,
    });
  } catch (error: any) {
    console.error("Error fetching adjustment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch adjustment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid adjustment ID format",
        },
        { status: 400 }
      );
    }

    const adjustment = await Adjustment.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!adjustment) {
      return NextResponse.json(
        {
          success: false,
          error: "Adjustment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Adjustment updated successfully",
      data: adjustment,
    });
  } catch (error: any) {
    console.error("Error updating adjustment:", error);

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
        error: "Failed to update adjustment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid adjustment ID format",
        },
        { status: 400 }
      );
    }

    const adjustment = await Adjustment.findByIdAndDelete(id);

    if (!adjustment) {
      return NextResponse.json(
        {
          success: false,
          error: "Adjustment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Adjustment deleted successfully",
      data: {
        id: adjustment._id,
        employeeId: adjustment.employeeId,
        type: adjustment.type,
        amount: adjustment.amount,
        reason: adjustment.reason,
      },
    });
  } catch (error: any) {
    console.error("Error deleting adjustment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete adjustment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
