import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Update a delivery slot
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { startTime, endTime, label, isActive } = body;

    const existing = await prisma.deliverySlot.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    const updated = await prisma.deliverySlot.update({
      where: { id },
      data: {
        startTime: startTime !== undefined ? startTime.trim() : existing.startTime,
        endTime: endTime !== undefined ? endTime.trim() : existing.endTime,
        label: label !== undefined ? label.trim() : existing.label,
        isActive: isActive !== undefined ? !!isActive : existing.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT admin slot error:", error);
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
  }
}

// Delete a delivery slot
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if slot has orders linked to it
    const ordersCount = await prisma.order.count({
      where: { deliverySlotId: id },
    });

    if (ordersCount > 0) {
      // Deactivate it instead of deleting to keep order referential integrity
      const deactivated = await prisma.deliverySlot.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ 
        success: true, 
        message: "Slot is linked to existing orders. Deactivated instead of deleted.",
        deactivated 
      });
    }

    await prisma.deliverySlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin slot error:", error);
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 });
  }
}
