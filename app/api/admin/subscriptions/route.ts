import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        },
        deliverySlot: true,
        deliveries: {
          orderBy: { deliveryDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("GET admin subscriptions error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    
    // Admins and Staff can modify subscription status. Users can also pause/cancel their own subscriptions.
    if (!session && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = (session?.user as any)?.id;

    const body = await req.json();
    const { subscriptionId, status } = body; // ACTIVE, PAUSED, CANCELLED

    if (!subscriptionId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validStatuses = ['ACTIVE', 'PAUSED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const existing = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Verify ownership if not an admin/staff
    const isAdminOrStaff = isDev || role === 'ADMIN' || role === 'STAFF';
    if (!isAdminOrStaff && existing.userId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized access to subscription" }, { status: 401 });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status },
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error("PATCH admin subscription error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
