import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    
    // Only ADMIN (or isDev bypass) can delete users
    const currentUserRole = (session?.user as any)?.role?.toUpperCase();
    const currentUserId = (session?.user as any)?.id;
    const isAuthorized = isDev || currentUserRole === "ADMIN";
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent self-deletion
    if (id === currentUserId) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    // Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting the last remaining ADMIN
    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return NextResponse.json({
          error: "Cannot delete the last remaining Administrator.",
        }, { status: 400 });
      }
    }

    // Check if user has orders
    const orderCount = await prisma.order.count({
      where: { userId: id },
    });

    if (orderCount > 0) {
      return NextResponse.json({
        error: `Cannot delete user with existing orders (${orderCount} order(s) found). Please demote/deactivate their role access instead of deleting.`,
      }, { status: 400 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
