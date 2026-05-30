import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const tag = searchParams.get("tag");
    const limit = parseInt(searchParams.get("limit") || "9", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    // Base query conditions
    const where: any = {
      isPublished: true,
    };

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    const [posts, totalCount] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          tags: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: limit,
        skip,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      posts,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("GET public blog posts error:", error);
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}
