"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import RichTextEditor from "./RichTextEditor";

const blogPostSchema = z.object({
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
  tagsString: z.string().default(""),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

interface BlogCategory {
  id: string;
  name: string;
}

interface BlogPostFormProps {
  initialData?: any;
}

export function BlogPostForm({ initialData }: BlogPostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [coverImage, setCoverImage] = useState<string>(initialData?.coverImage || "");

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/blog-categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error loading blog categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema) as any,
    defaultValues: initialData
      ? {
          title: initialData.title,
          slug: initialData.slug,
          excerpt: initialData.excerpt || "",
          content: initialData.content || "",
          coverImage: initialData.coverImage || "",
          categoryId: initialData.categoryId || "",
          isPublished: initialData.isPublished || false,
          publishedAt: initialData.publishedAt
            ? new Date(initialData.publishedAt).toISOString().split("T")[0]
            : "",
          metaTitle: initialData.metaTitle || "",
          metaDescription: initialData.metaDescription || "",
          tagsString: initialData.tags ? initialData.tags.join(", ") : "",
        }
      : {
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          coverImage: "",
          categoryId: "",
          isPublished: false,
          publishedAt: "",
          metaTitle: "",
          metaDescription: "",
          tagsString: "",
        },
  });

  // Watch fields
  const titleVal = form.watch("title");

  // Auto-generate slug if title changes (only on create)
  useEffect(() => {
    if (!initialData && titleVal) {
      const generatedSlug = titleVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      form.setValue("slug", generatedSlug);
    }
  }, [titleVal, initialData, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCoverImage(data.url);
        form.setValue("coverImage", data.url);
        toast.success("Cover image uploaded successfully");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      toast.error("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: BlogPostFormValues) => {
    setIsLoading(true);
    try {
      const tags = values.tagsString
        ? values.tagsString
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [];

      const payload = {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt || null,
        content: values.content,
        coverImage: coverImage || null,
        categoryId: values.categoryId || null,
        isPublished: values.isPublished,
        publishedAt: values.isPublished
          ? values.publishedAt
            ? new Date(values.publishedAt).toISOString()
            : new Date().toISOString()
          : null,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
        tags,
      };

      const url = initialData ? `/api/admin/blog/${initialData.id}` : "/api/admin/blog";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Blog post ${initialData ? "updated" : "created"} successfully`);
        router.push("/admin/blog");
        router.refresh();
      } else {
        toast.error(data.error || `Failed to ${initialData ? "update" : "create"} post`);
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1a2c1a] hover:bg-[#f0f2e8]">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">
            {initialData ? "Edit Blog Post" : "Create Blog Post"}
          </h1>
          <p className="text-xs text-[#8a8a7a] mt-0.5 font-bold uppercase tracking-wider">
            {initialData ? "Update your blog post content and metadata" : "Write a new article for your website"}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content pane (left) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                  Post Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. 5 Secrets to Perfect Sourdough Bread"
                  {...form.register("title")}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white text-base font-semibold"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-600 font-bold">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                  URL Slug *
                </Label>
                <Input
                  id="slug"
                  placeholder="e.g. 5-secrets-to-perfect-sourdough"
                  {...form.register("slug")}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white font-mono text-xs"
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-red-600 font-bold">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                  Excerpt (Short Summary)
                </Label>
                <Textarea
                  id="excerpt"
                  placeholder="A short summary displayed on cards and search results..."
                  {...form.register("excerpt")}
                  rows={2}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white resize-none text-xs"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                  Post Content *
                </Label>
                <RichTextEditor
                  content={form.getValues("content")}
                  onChange={(html) => form.setValue("content", html, { shouldValidate: true })}
                />
                {form.formState.errors.content && (
                  <p className="text-xs text-red-600 font-bold">{form.formState.errors.content.message}</p>
                )}
              </div>
            </Card>

            {/* SEO section */}
            <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
              <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a] border-b border-[#f0f2e8] pb-2">
                SEO Settings (Optional)
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle" className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">
                    Meta Title
                  </Label>
                  <Input
                    id="metaTitle"
                    placeholder="Custom SEO Title"
                    {...form.register("metaTitle")}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">
                    Meta Description
                  </Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="Custom SEO Meta Description (150-160 characters suggested)"
                    {...form.register("metaDescription")}
                    rows={3}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white resize-none text-xs"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right sidebar pane */}
          <div className="space-y-6">
            {/* Publish Actions */}
            <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
              <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a] border-b border-[#f0f2e8] pb-2">
                Publish Status
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9f5] border border-[#d4d9b8]">
                  <Label htmlFor="isPublished" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] cursor-pointer">
                    Publish Immediately
                  </Label>
                  <input
                    id="isPublished"
                    type="checkbox"
                    {...form.register("isPublished")}
                    className="w-4 h-4 text-[#3d5a2e] border-gray-300 rounded focus:ring-[#3d5a2e] cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishedAt" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                    Publish Date (Optional)
                  </Label>
                  <Input
                    id="publishedAt"
                    type="date"
                    {...form.register("publishedAt")}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || isUploading}
                  className="w-full bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white py-5 rounded-[8px] font-bold uppercase tracking-widest text-xs shadow transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Post</span>}
                </Button>
              </div>
            </Card>

            {/* Categorization & Tags */}
            <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
              <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a] border-b border-[#f0f2e8] pb-2">
                Categorization
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                    Category
                  </Label>
                  <select
                    id="categoryId"
                    {...form.register("categoryId")}
                    className="w-full rounded-md border border-[#d4d9b8] bg-[#f0f2e8] p-2 text-xs font-bold text-[#1a2c1a] focus:border-[#c8872a] focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagsString" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                    Tags (Comma-separated)
                  </Label>
                  <Input
                    id="tagsString"
                    placeholder="e.g. sourdough, recipe, organic"
                    {...form.register("tagsString")}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white text-xs"
                  />
                </div>
              </div>
            </Card>

            {/* Cover Image Upload */}
            <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
              <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a] border-b border-[#f0f2e8] pb-2">
                Cover Image
              </h3>

              <div className="space-y-4">
                <div className="relative aspect-video w-full rounded-lg bg-[#f0f2e8] border-2 border-dashed border-[#d4d9b8] flex flex-col items-center justify-center overflow-hidden group">
                  {coverImage ? (
                    <>
                      <Image src={coverImage} alt="Cover preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Label
                          htmlFor="cover-image-upload"
                          className="cursor-pointer bg-white text-[#1a2c1a] px-3 py-1.5 rounded font-bold text-xs uppercase tracking-wider shadow"
                        >
                          Change Cover
                        </Label>
                      </div>
                    </>
                  ) : (
                    <Label
                      htmlFor="cover-image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 text-center space-y-2"
                    >
                      <ImageIcon className="w-8 h-8 text-[#8a8a7a] opacity-40" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Upload Image</span>
                      <span className="text-[10px] text-[#8a8a7a]">PNG, JPG up to 5MB</span>
                    </Label>
                  )}
                  <Input
                    id="cover-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>
                {isUploading && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#c8872a]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading cover image...</span>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="cover-url" className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a7a]">
                    Or Image URL
                  </Label>
                  <Input
                    id="cover-url"
                    placeholder="https://example.com/image.jpg"
                    value={coverImage}
                    onChange={(e) => {
                      setCoverImage(e.target.value);
                      form.setValue("coverImage", e.target.value);
                    }}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white text-xs"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
