import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enquiries = await prisma.bulkEnquiry.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(enquiries);
  } catch (error: any) {
    console.error("GET admin bulk enquiries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bulk enquiries: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
