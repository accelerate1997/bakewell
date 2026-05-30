import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate aggregate stats
    const aggregates = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Calculate distribution
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((r) => {
      const rating = r.rating as 5 | 4 | 3 | 2 | 1;
      if (distribution[rating] !== undefined) {
        distribution[rating]++;
      }
    });

    // Check current user status (purchased/reviewed)
    const session = await getServerSession(authOptions);
    let hasPurchased = false;
    let hasReviewed = false;

    if (session?.user && productId) {
      const userId = (session.user as any).id;
      const review = await prisma.review.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      hasReviewed = !!review;

      const deliveredOrder = await prisma.order.findFirst({
        where: {
          userId,
          status: "DELIVERED",
          items: {
            some: {
              variant: {
                productId,
              },
            },
          },
        },
      });
      hasPurchased = !!deliveredOrder;
    }

    return NextResponse.json({
      reviews,
      averageRating: aggregates._avg.rating || 0,
      totalCount: aggregates._count.rating || 0,
      distribution,
      hasPurchased,
      hasReviewed,
    });
  } catch (error) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please login first." }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { productId, rating, title, comment } = await req.json();

    if (!productId || !rating || !comment) {
      return NextResponse.json({ error: "Product ID, rating, and comment are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    // Verify purchase history: check if user bought this product and order status is DELIVERED
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: "DELIVERED",
        items: {
          some: {
            variant: {
              productId,
            },
          },
        },
      },
    });

    const isVerified = !!deliveredOrder;

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title: title || null,
        comment,
        isVerified,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("POST review error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
