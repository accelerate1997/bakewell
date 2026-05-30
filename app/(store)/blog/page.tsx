import React from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, User, Clock, ArrowRight, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const currentCategory = category || "";

  // Query categories for filter list
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
  });

  // Query published blog posts
  const posts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      ...(currentCategory
        ? {
            category: {
              slug: currentCategory,
            },
          }
        : {}),
    },
    include: {
      category: true,
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return (
    <div className="bg-[#f0f2e8] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge text="The Daily Bake Blog" />
          <h1 className="font-playfair font-black text-4xl sm:text-5xl lg:text-6xl text-[#1a2c1a] leading-tight">
            From Our Oven to Your Feed
          </h1>
          <p className="text-sm sm:text-base text-[#8a8a7a] font-bold uppercase tracking-wider">
            Recipes, baking secrets, and organic food stories from our kitchen
          </p>
        </div>

        {/* Categories Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Link
            href="/blog"
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all duration-300 ${
              !currentCategory
                ? "bg-[#3d5a2e] border-[#3d5a2e] text-white shadow-md"
                : "bg-white border-[#d4d9b8] text-[#1a2c1a] hover:border-[#3d5a2e]"
            }`}
          >
            All Stories
          </Link>
          {categories.map((cat) => {
            const isActive = currentCategory === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all duration-300 ${
                  isActive
                    ? "bg-[#3d5a2e] border-[#3d5a2e] text-white shadow-md"
                    : "bg-white border-[#d4d9b8] text-[#1a2c1a] hover:border-[#3d5a2e]"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        {/* Featured Post (only if no category filter & posts exist) */}
        {!currentCategory && posts.length > 0 && (
          <div className="mb-16">
            <FeaturedPostCard post={posts[0]} />
          </div>
        )}

        {/* Grid of posts */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#d4d9b8] p-16 text-center space-y-4 max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-[#8a8a7a] mx-auto opacity-40" />
            <h3 className="font-playfair font-bold text-2xl text-[#1a2c1a]">No articles found</h3>
            <p className="text-[#8a8a7a] text-sm leading-relaxed">
              We haven&apos;t published any articles in this category yet. Check back soon for fresh updates!
            </p>
            <Link href="/blog" className="inline-block pt-2">
              <span className="bg-[#3d5a2e] text-white font-bold uppercase tracking-widest px-6 py-3 rounded-full text-xs shadow-md">
                Reset Filters
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* If featured post was shown, skip it in the grid list */}
            {posts
              .slice(!currentCategory ? 1 : 0)
              .map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-block bg-[#c8872a]/15 text-[#c8872a] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#c8872a]/20">
      {text}
    </span>
  );
}

function FeaturedPostCard({ post }: { post: any }) {
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  return (
    <div className="bg-white rounded-2xl border border-[#d4d9b8] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0">
      <div className="relative h-64 sm:h-96 lg:h-auto lg:col-span-7 bg-[#e8ead8]">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#8a8a7a]">
            <BookOpen className="w-16 h-16 opacity-35" />
          </div>
        )}
      </div>
      <div className="p-8 sm:p-12 lg:col-span-5 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {post.category && (
              <span className="bg-[#3d5a2e]/10 text-[#3d5a2e] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                {post.category.name}
              </span>
            )}
            <span className="inline-block bg-[#c8872a] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
              Featured
            </span>
          </div>

          <h2 className="font-playfair font-black text-2xl sm:text-3xl text-[#1a2c1a] uppercase tracking-tight hover:text-[#3d5a2e] transition-colors">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>

          <p className="text-sm text-[#4a4a4a] leading-relaxed line-clamp-3">
            {post.excerpt || "Dive into this article to read about all the delicious details, baking methods, and stories straight from our oven."}
          </p>
        </div>

        <div className="pt-6 border-t border-[#f0f2e8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-[#8a8a7a] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <User size={14} className="text-[#3d5a2e]" />
              {post.author.name || "Daily Bake"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#c8872a]" />
              {format(publishedDate, "dd MMM yyyy")}
            </span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="text-xs font-black uppercase tracking-widest text-[#3d5a2e] hover:text-[#1a2c1a] flex items-center gap-1.5 group self-start sm:self-auto"
          >
            Read Article
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function BlogPostCard({ post }: { post: any }) {
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  return (
    <div className="bg-white rounded-2xl border border-[#d4d9b8] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <div className="relative h-56 bg-[#e8ead8] overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#8a8a7a]">
            <BookOpen className="w-12 h-12 opacity-35" />
          </div>
        )}
        {post.category && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-[#3d5a2e] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded shadow-sm">
              {post.category.name}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-playfair font-black text-lg text-[#1a2c1a] uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-[#3d5a2e] transition-colors">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>
          <p className="text-xs text-[#8a8a7a] line-clamp-2 leading-relaxed">
            {post.excerpt || "Read about our baking processes, sourdough guides, and delicious kitchen stories."}
          </p>
        </div>

        <div className="pt-4 border-t border-[#f0f2e8] flex items-center justify-between text-[11px] text-[#8a8a7a] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User size={12} className="text-[#3d5a2e]" />
              {post.author.name || "Daily Bake"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-[#c8872a]" />
              {format(publishedDate, "dd MMM")}
            </span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="text-[10px] font-black text-[#3d5a2e] hover:text-[#1a2c1a] flex items-center gap-1 group-hover:underline"
          >
            Read <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
