import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["PENDING", "CONTACTED", "RESOLVED"];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updated = await prisma.bulkEnquiry.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    return NextResponse.json({ success: true, enquiry: updated });
  } catch (error: any) {
    console.error("PATCH admin bulk enquiry error:", error);
    return NextResponse.json(
      { error: "Failed to update bulk enquiry: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.bulkEnquiry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE admin bulk enquiry error:", error);
    return NextResponse.json(
      { error: "Failed to delete bulk enquiry: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
