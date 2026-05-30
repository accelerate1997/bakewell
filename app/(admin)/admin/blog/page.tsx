"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: {
    name: string;
    slug: string;
  } | null;
  author: {
    name: string | null;
  };
}

export default function BlogPostsAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        toast.error("Failed to fetch blog posts");
      }
    } catch (error) {
      toast.error("Error loading blog posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Post "${title}" deleted successfully`);
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete post");
      }
    } catch (error) {
      toast.error("Error deleting post");
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.category && post.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">
              Blog Posts
            </h1>
            <Badge className="bg-[#3d5a2e]/10 text-[#3d5a2e] hover:bg-[#3d5a2e]/10 border-none rounded-full px-2 py-0">
              {posts.length} posts
            </Badge>
          </div>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">
            Create, edit, and publish articles for your storefront blog
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white rounded-[8px] font-bold uppercase tracking-widest text-xs h-10 px-4 shadow flex items-center gap-2">
            <Plus size={16} />
            New Post
          </Button>
        </Link>
      </div>

      {/* Search Filter */}
      <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
          <Input
            placeholder="Search posts by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-[#d4d9b8] bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
          />
        </div>
      </Card>

      {/* Posts List */}
      {isLoading ? (
        <Card className="p-12 text-center border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#c8872a]" />
            <span className="text-xs text-[#8a8a7a] font-bold uppercase">
              Loading blog posts...
            </span>
          </div>
        </Card>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
          <FileText className="w-12 h-12 text-[#8a8a7a] mx-auto opacity-40" />
          <h3 className="font-bold text-lg text-[#1a2c1a]">No blog posts found</h3>
          <p className="text-xs text-[#8a8a7a]">
            Start sharing stories, baking recipes, and news with your readers!
          </p>
          <Link href="/admin/blog/new">
            <Button className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white font-bold uppercase tracking-wider text-xs h-10 px-4 rounded-[8px]">
              Write First Post
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9f5] border-b border-[#d4d9b8] text-[10px] font-black uppercase tracking-wider text-[#1a2c1a]">
                  <th className="p-4 w-20">Cover</th>
                  <th className="p-4">Post Info</th>
                  <th className="p-4 w-40">Category</th>
                  <th className="p-4 w-32">Status</th>
                  <th className="p-4 w-48">Publish Date</th>
                  <th className="p-4 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2e8]">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-[#f8f9f5] transition-colors group">
                    <td className="p-4">
                      <div className="relative w-12 h-12 rounded-[4px] bg-[#f0f2e8] overflow-hidden flex items-center justify-center border border-[#d4d9b8]">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#8a8a7a] opacity-40" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-[#1a2c1a] line-clamp-1">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-[#8a8a7a] font-bold uppercase">
                          <span>By {post.author.name || "Daily Bake Team"}</span>
                          <span>•</span>
                          <span className="font-mono">/{post.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {post.category ? (
                        <Badge className="bg-[#f0f2e8] text-[#1a2c1a] border-none font-bold uppercase text-[9px] px-2 py-0.5 rounded">
                          {post.category.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#8a8a7a] italic">Uncategorized</span>
                      )}
                    </td>
                    <td className="p-4">
                      {post.isPublished ? (
                        <Badge className="bg-[#EAF3DE] text-[#3d5a2e] border-none font-black uppercase text-[9px] px-2 py-0.5 rounded">
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-[#f0f0f0] text-[#8a8a7a] border-none font-black uppercase text-[9px] px-2 py-0.5 rounded">
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-xs text-[#8a8a7a] font-medium">
                      {post.isPublished && post.publishedAt ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#3d5a2e]" />
                          <span>{format(new Date(post.publishedAt), "dd MMM yyyy, hh:mm a")}</span>
                        </div>
                      ) : (
                        <span className="italic">Not published</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/blog/${post.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-[#1a2c1a] hover:bg-[#f0f2e8] gap-1"
                          >
                            <Pencil size={12} /> Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id, post.title)}
                          className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-[#A32D2D] hover:bg-[#FCEBEB] gap-1"
                        >
                          <Trash2 size={12} /> Delete
                        </Button>
                        {post.isPublished && (
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-[#3d5a2e] hover:bg-[#EAF3DE] gap-1"
                            >
                              <ExternalLink size={12} /> View
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
