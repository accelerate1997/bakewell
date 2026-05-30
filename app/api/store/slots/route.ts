import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get available slots for a specific date (YYYY-MM-DD)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date parameter (?date=YYYY-MM-DD) is required" }, { status: 400 });
    }

    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Get active slots
    const slots = await prisma.deliverySlot.findMany({
      where: { isActive: true },
      orderBy: { startTime: "asc" },
    });

    // Map slots with availability details
    const availability = slots.map((slot) => {
      return {
        id: slot.id,
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: true,
      };
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("GET store slots error:", error);
    return NextResponse.json({ error: "Failed to fetch available slots" }, { status: 500 });
  }
}
