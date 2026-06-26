import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const { isRateLimited } = rateLimit(ip, 5, 300000, "bulk-enquiry"); // 5 submissions per 5 minutes
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many enquiry submissions. Please try again after 5 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, phone, email, message, quantity, categoryIds, productIds } = body;

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and Phone Number are required fields." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim() : null;
    const cleanMessage = message ? message.trim() : null;
    const parsedQuantity = quantity ? parseInt(quantity) : null;

    // Create the Bulk Enquiry inside a transaction to ensure integrity of relations
    const enquiry = await prisma.$transaction(async (tx) => {
      const record = await tx.bulkEnquiry.create({
        data: {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          message: cleanMessage,
          quantity: parsedQuantity,
          status: "PENDING",
        },
      });

      // Link categories if selected
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await tx.bulkEnquiryCategory.createMany({
          data: categoryIds.map((id: string) => ({
            enquiryId: record.id,
            categoryId: id,
          })),
        });
      }

      // Link products if selected
      if (Array.isArray(productIds) && productIds.length > 0) {
        await tx.bulkEnquiryProduct.createMany({
          data: productIds.map((id: string) => ({
            enquiryId: record.id,
            productId: id,
          })),
        });
      }

      return record;
    });

    return NextResponse.json({ success: true, enquiryId: enquiry.id });
  } catch (error: any) {
    console.error("Bulk enquiry submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit bulk enquiry: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
