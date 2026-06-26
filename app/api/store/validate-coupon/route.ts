import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const { isRateLimited } = rateLimit(ip, 15, 60000, "validate-coupon"); // 15 requests per minute
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many validation attempts. Please try again after 1 minute." },
        { status: 429 }
      );
    }

    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 400 });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: "Coupon code has expired" }, { status: 400 });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon code usage limit reached" }, { status: 400 });
    }

    // Check per-user limit
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as any).id;
      const usageCount = await prisma.order.count({
        where: {
          userId,
          couponCode: coupon.code,
          status: { not: "CANCELLED" },
        },
      });

      if (usageCount >= coupon.perUserLimit) {
        return NextResponse.json({
          error: `You have already used this coupon code the maximum allowed times (${coupon.perUserLimit}).`,
        }, { status: 400 });
      }
    }

    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json({
        error: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = Math.round((subtotal * coupon.value) / 100);
    } else {
      discountAmount = coupon.value;
    }

    return NextResponse.json({
      success: true,
      code: coupon.code,
      discountAmount,
      type: coupon.type,
      value: coupon.value,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
