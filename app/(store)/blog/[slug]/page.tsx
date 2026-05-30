import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, User, ArrowLeft, Bookmark, Tag, MessageSquare, BookOpen } from "lucide-react";
import "./blog-content.css";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  if (!post) {
    return {
      title: "Article Not Found - The Daily Bake",
    };
  }

  return {
    title: `${post.metaTitle || post.title} - The Daily Bake`,
    description: post.metaDescription || post.excerpt || "Read our latest article on The Daily Bake blog.",
  };
}

export default async function BlogPostReaderPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  // Retrieve blog post details
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: true,
      author: {
        select: {
          name: true,
          image: true,
          role: true,
        },
      },
    },
  });

  // Verify post exists and is published
  if (!post || !post.isPublished) {
    notFound();
  }

  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  // Fetch related posts (same category, excluding current post)
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      categoryId: post.categoryId,
      id: { not: post.id },
    },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.coverImage ? [post.coverImage] : [],
    "datePublished": publishedDate.toISOString(),
    "dateModified": new Date(post.updatedAt).toISOString(),
    "author": [
      {
        "@type": "Person",
        "name": post.author.name || "The Daily Bake Team",
      },
    ],
    "description": post.excerpt || post.title,
  };

  return (
    <article className="bg-[#f0f2e8] min-h-screen py-12">
      {/* JSON-LD Script injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back navigation */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#3d5a2e] hover:text-[#1a2c1a] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Blog
        </Link>

        {/* Post Metadata Card */}
        <div className="bg-white rounded-2xl border border-[#d4d9b8] p-6 sm:p-8 space-y-4 shadow-sm">
          {post.category && (
            <Link href={`/blog?category=${post.category.slug}`}>
              <span className="inline-block bg-[#3d5a2e]/10 text-[#3d5a2e] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#3d5a2e]/20 hover:bg-[#3d5a2e] hover:text-white transition-all duration-300">
                {post.category.name}
              </span>
            </Link>
          )}

          <h1 className="font-playfair font-black text-3xl sm:text-4xl lg:text-5xl text-[#1a2c1a] leading-tight uppercase tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#f0f2e8] text-xs text-[#8a8a7a] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded-full bg-[#3d5a2e] flex items-center justify-center font-bold text-[10px] text-white overflow-hidden">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span>{post.author.name ? post.author.name.slice(0, 2) : "DB"}</span>
                )}
              </div>
              <span>By {post.author.name || "Daily Bake Team"}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#c8872a]" />
              <span>{format(publishedDate, "dd MMMM yyyy")}</span>
            </div>
          </div>
        </div>

        {/* Cover Image banner */}
        {post.coverImage && (
          <div className="relative w-full aspect-video rounded-2xl bg-[#e8ead8] border border-[#d4d9b8] overflow-hidden shadow-sm">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Main Content Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#d4d9b8] p-6 sm:p-10 shadow-sm space-y-6">
            <div
              className="blog-content-prose"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags row */}
            {post.tags.length > 0 && (
              <div className="pt-8 border-t border-[#f0f2e8] flex flex-wrap gap-2 items-center">
                <Tag size={14} className="text-[#c8872a]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a] mr-2">Tags:</span>
                {post.tags.map((tg) => (
                  <span
                    key={tg}
                    className="bg-[#f0f2e8] text-[#1a2c1a] text-[10px] font-bold px-2.5 py-1 rounded-[4px] border border-[#d4d9b8]/50"
                  >
                    #{tg}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* About author */}
            <div className="bg-white rounded-2xl border border-[#d4d9b8] p-6 shadow-sm text-center space-y-4">
              <div className="relative w-16 h-16 rounded-full bg-[#1a2c1a] text-white flex items-center justify-center font-black text-lg mx-auto overflow-hidden">
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span>{post.author.name ? post.author.name.slice(0, 2) : "DB"}</span>
                )}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#1a2c1a] uppercase tracking-wider">
                  {post.author.name || "The Daily Bake Team"}
                </h4>
                <p className="text-[10px] text-[#c8872a] font-extrabold uppercase tracking-widest">
                  {post.author.role || "ADMINISTRATOR"}
                </p>
              </div>
              <p className="text-xs text-[#8a8a7a] leading-relaxed">
                Bringing you wholesome recipes, baking science, and organic kitchen lifestyle guides.
              </p>
            </div>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#d4d9b8] p-6 shadow-sm space-y-4">
                <h4 className="font-playfair font-black text-base text-[#1a2c1a] uppercase tracking-wider border-b border-[#f0f2e8] pb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#c8872a]" />
                  Related Reads
                </h4>
                <div className="space-y-4">
                  {relatedPosts.map((rel) => {
                    const relDate = rel.publishedAt ? new Date(rel.publishedAt) : new Date(rel.createdAt);
                    return (
                      <div key={rel.id} className="flex gap-3 group">
                        <div className="relative w-16 h-16 rounded-[6px] bg-[#f0f2e8] overflow-hidden flex-shrink-0 border border-[#d4d9b8]/50">
                          {rel.coverImage ? (
                            <Image
                              src={rel.coverImage}
                              alt={rel.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8a8a7a] opacity-40">
                              <BookOpen size={18} />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <Link href={`/blog/${rel.slug}`}>
                            <h5 className="font-bold text-xs text-[#1a2c1a] uppercase tracking-tight line-clamp-2 hover:text-[#3d5a2e] transition-colors">
                              {rel.title}
                            </h5>
                          </Link>
                          <span className="text-[9px] text-[#8a8a7a] font-bold uppercase tracking-wider block">
                            {format(relDate, "dd MMM yyyy")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
