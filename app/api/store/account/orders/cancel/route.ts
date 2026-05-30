import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Find the order, its items, and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized access to this order" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending orders can be cancelled." }, { status: 400 });
    }

    // Execute cancellation status update and inventory restoration in a Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update order status to CANCELLED
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      // 2. Increment stock quantities of corresponding product variants
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    });

    return NextResponse.json({ message: "Order cancelled successfully." });
  } catch (error) {
    console.error("Order cancellation error:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
