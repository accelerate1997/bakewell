import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const createPostSchema = z.object({
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.blogPost.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET admin posts error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== "ADMIN" && role !== "STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorId = (session?.user as any)?.id;
    if (!isDev && !authorId) {
      return NextResponse.json({ error: "Author user ID not found in session" }, { status: 400 });
    }

    // Default mock author ID for dev bypass if not logged in
    const finalAuthorId = authorId || "dev-author-id";

    // If dev author doesn't exist in DB, create/get a fallback admin user
    if (isDev && !authorId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
      if (fallbackUser) {
        // use fallback admin
      } else {
        // we might get error, so we will handle it
      }
    }

    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // Make sure author exists
    let dbAuthorId = finalAuthorId;
    if (isDev && (!session || !authorId)) {
      const firstAdmin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
      if (firstAdmin) {
        dbAuthorId = firstAdmin.id;
      } else {
        // Create a dummy admin user if none exists
        const newAdmin = await prisma.user.create({
          data: {
            name: "Admin Developer",
            email: "devadmin@example.com",
            role: "ADMIN",
          },
        });
        dbAuthorId = newAdmin.id;
      }
    }

    // Process slug
    const processedSlug = validatedData.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const post = await prisma.blogPost.create({
      data: {
        title: validatedData.title,
        slug: processedSlug,
        excerpt: validatedData.excerpt || null,
        content: validatedData.content,
        coverImage: validatedData.coverImage || null,
        categoryId: validatedData.categoryId || null,
        authorId: dbAuthorId,
        isPublished: validatedData.isPublished,
        publishedAt: validatedData.isPublished
          ? validatedData.publishedAt
            ? new Date(validatedData.publishedAt)
            : new Date()
          : null,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        tags: validatedData.tags,
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("POST admin post error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A blog post with this slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
