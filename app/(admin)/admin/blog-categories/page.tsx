"use client";

import React, { useState, useEffect } from "react";
import { FolderPlus, Pencil, Trash2, Loader2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    posts: number;
  };
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/blog-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        toast.error("Failed to fetch blog categories");
      }
    } catch (error) {
      toast.error("Error loading blog categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (!editingId) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
  };

  const handleEdit = (category: BlogCategory) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId
        ? `/api/admin/blog-categories/${editingId}`
        : "/api/admin/blog-categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Category ${editingId ? "updated" : "created"} successfully`);
        resetForm();
        fetchCategories();
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete "${catName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/blog-categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Category "${catName}" deleted successfully`);
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete category");
      }
    } catch (error) {
      toast.error("Error deleting category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">
            Blog Categories
          </h1>
          <Badge className="bg-[#3d5a2e]/10 text-[#3d5a2e] hover:bg-[#3d5a2e]/10 border-none rounded-full px-2 py-0">
            {categories.length} Categories
          </Badge>
        </div>
        <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">
          Organize your blog posts with custom categories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left pane: Form */}
        <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white h-fit space-y-6">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-[#1a2c1a] border-b border-[#f0f2e8] pb-3">
              {editingId ? "Edit Category" : "Create Category"}
            </h3>
            <p className="text-[10px] text-[#8a8a7a] font-bold uppercase tracking-wider mt-1">
              {editingId
                ? "Update category name, slug and description"
                : "Add a new category to group your recipes or articles"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="cat-name"
                className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]"
              >
                Category Name *
              </Label>
              <Input
                id="cat-name"
                placeholder="e.g. Baking Tips"
                value={name}
                onChange={handleNameChange}
                className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="cat-slug"
                className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]"
              >
                URL Slug *
              </Label>
              <Input
                id="cat-slug"
                placeholder="e.g. baking-tips"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="cat-desc"
                className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]"
              >
                Description
              </Label>
              <Textarea
                id="cat-desc"
                placeholder="Brief summary of what this category is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white font-bold uppercase tracking-wider text-xs h-10 shadow"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingId ? (
                  "Save Changes"
                ) : (
                  "Create Category"
                )}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-[#d4d9b8] hover:bg-[#f0f2e8] text-[#1a2c1a] font-bold uppercase tracking-wider text-xs h-10"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Right pane: List */}
        <Card className="md:col-span-2 p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-[#1a2c1a] border-b border-[#f0f2e8] pb-3">
              Existing Categories
            </h3>
            <p className="text-[10px] text-[#8a8a7a] font-bold uppercase tracking-wider mt-1">
              Active categories configured on the blog
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#c8872a]" />
              <span className="text-xs text-[#8a8a7a] font-bold uppercase">
                Loading categories...
              </span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Bookmark className="w-12 h-12 text-[#8a8a7a] mx-auto opacity-30" />
              <h4 className="font-bold text-sm text-[#1a2c1a]">No categories yet</h4>
              <p className="text-xs text-[#8a8a7a]">
                Create your first category on the left side.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f2e8]">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-[#1a2c1a] uppercase tracking-tight">
                        {cat.name}
                      </h4>
                      <Badge className="bg-[#f0f2e8] text-[#1a2c1a] hover:bg-[#f0f2e8] font-mono text-[10px] border-none">
                        /{cat.slug}
                      </Badge>
                      <Badge className="bg-[#3d5a2e]/10 text-[#3d5a2e] hover:bg-[#3d5a2e]/10 text-[9px] border-none font-bold">
                        {cat._count?.posts || 0} posts
                      </Badge>
                    </div>
                    <p className="text-xs text-[#8a8a7a] leading-relaxed">
                      {cat.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(cat)}
                      className="h-8 w-8 text-[#1a2c1a] hover:bg-[#f0f2e8]"
                      title="Edit Category"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="h-8 w-8 text-[#A32D2D] hover:bg-[#FCEBEB]"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
