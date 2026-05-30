import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const processedSlug = validatedData.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const updatedCategory = await prisma.blogCategory.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug: processedSlug,
        description: validatedData.description || null,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    console.error("PUT admin blog category detail error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A category with this name or slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Safety check: verify no posts are using this category
    const postsCount = await prisma.blogPost.count({
      where: { categoryId: id },
    });

    if (postsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category because it is linked to " + postsCount + " blog post(s)." },
        { status: 400 }
      );
    }

    await prisma.blogCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin blog category detail error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
