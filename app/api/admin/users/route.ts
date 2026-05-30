import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    
    // Only ADMIN (or isDev bypass) can manage users
    const userRole = (session?.user as any)?.role;
    const isAuthorized = isDev || userRole === "ADMIN" || userRole === "admin";
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all users, select safe fields (no passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET admin users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    
    const userRole = (session?.user as any)?.role;
    const currentUserId = (session?.user as any)?.id;
    const isAuthorized = isDev || userRole === "ADMIN" || userRole === "admin";
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate role value
    const validRoles = ["ADMIN", "STAFF", "CUSTOMER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
    }

    // Fetch the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-demotion
    if (userId === currentUserId && role !== "ADMIN") {
      return NextResponse.json({ error: "You cannot demote yourself" }, { status: 400 });
    }

    // Prevent demoting the last remaining ADMIN
    if (targetUser.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: {
          OR: [
            { role: "ADMIN" },
            { role: { equals: "ADMIN" } } // Just in case, uppercase ADMIN
          ]
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json({
          error: "Cannot demote the last remaining Administrator.",
        }, { status: 400 });
      }
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("PATCH admin users error:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
