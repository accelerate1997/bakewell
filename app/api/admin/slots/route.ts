import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get list of all delivery slots
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slots = await prisma.deliverySlot.findMany({
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("GET admin slots error:", error);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}

// Add a new delivery slot
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { startTime, endTime, label, isActive } = body;

    if (!startTime || !endTime || !label) {
      return NextResponse.json({ error: "Start time, end time, and label are required" }, { status: 400 });
    }

    const newSlot = await prisma.deliverySlot.create({
      data: {
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        label: label.trim(),
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(newSlot);
  } catch (error) {
    console.error("POST admin slots error:", error);
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });
  }
}
