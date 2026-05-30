"use client";

import React, { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { BlogPostForm } from "@/components/admin/BlogPostForm";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function EditBlogPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/blog/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
        } else {
          toast.error("Failed to load blog post");
          router.push("/admin/blog");
        }
      } catch (error) {
        toast.error("Error loading blog post details");
        router.push("/admin/blog");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8872a]" />
        <span className="text-xs text-[#8a8a7a] font-bold uppercase tracking-wider">
          Loading blog post details...
        </span>
      </div>
    );
  }

  if (!post) {
    return (
      <Card className="p-12 text-center border-[#d4d9b8] rounded-[8px] bg-white">
        <p className="text-sm font-bold text-[#1a2c1a]">Blog post not found.</p>
      </Card>
    );
  }

  return <BlogPostForm initialData={post} />;
}
