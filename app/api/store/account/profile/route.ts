import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, email, phone, currentPassword, newPassword } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check for email collision
    if (email) {
      const emailCollision = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });
      if (emailCollision) {
        return NextResponse.json({ error: "Email is already registered by another account" }, { status: 400 });
      }
    }

    // Check for phone collision
    if (phone) {
      const phoneCollision = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: userId },
        },
      });
      if (phoneCollision) {
        return NextResponse.json({ error: "Phone number is already registered by another account" }, { status: 400 });
      }
    }

    // Handle password change if requested
    let hashedPasswordUpdate = undefined;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }

      // Fetch user's current password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        return NextResponse.json({ error: "User password record not found" }, { status: 404 });
      }

      // Verify current password matches
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }

      // Hash the new password
      hashedPasswordUpdate = await bcrypt.hash(newPassword, 10);
    }

    // Perform updates
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        ...(hashedPasswordUpdate ? { password: hashedPasswordUpdate } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT customer profile error:", error);
    return NextResponse.json({ error: "Failed to update profile details" }, { status: 500 });
  }
}
