import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().nullable().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("GET admin post detail error:", error);
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 });
  }
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
    const validatedData = updatePostSchema.parse(body);

    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Process slug
    const processedSlug = validatedData.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Determine publishedAt date
    let publishedAtDate = existingPost.publishedAt;
    if (validatedData.isPublished) {
      if (!existingPost.isPublished) {
        // Just published now
        publishedAtDate = validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date();
      } else if (validatedData.publishedAt) {
        // Updating explicit published date
        publishedAtDate = new Date(validatedData.publishedAt);
      }
    } else {
      // Draft mode
      publishedAtDate = null;
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title: validatedData.title,
        slug: processedSlug,
        excerpt: validatedData.excerpt || null,
        content: validatedData.content,
        coverImage: validatedData.coverImage || null,
        categoryId: validatedData.categoryId || null,
        isPublished: validatedData.isPublished,
        publishedAt: publishedAtDate,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        tags: validatedData.tags,
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    console.error("PUT admin post detail error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A blog post with this slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
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

    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin post detail error:", error);
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}
