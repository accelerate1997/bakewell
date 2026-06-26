import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const { isRateLimited } = rateLimit(ip, 5, 600000, "signup"); // 5 signups per 10 minutes
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again after 10 minutes." },
        { status: 429 }
      );
    }

    const { name, email, phone, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Either email or phone number is required" },
        { status: 400 }
      );
    }

    // Check for existing user by email
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Email is already registered" },
          { status: 400 }
        );
      }
    }

    // Check for existing user by phone
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhone) {
        return NextResponse.json(
          { error: "Phone number is already registered" },
          { status: 400 }
        );
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine the role: if there are 0 users, first user is ADMIN, otherwise CUSTOMER
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "CUSTOMER";

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
