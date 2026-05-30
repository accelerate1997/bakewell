"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, ExternalLink, FolderTree, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  _count: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      toast.error('Error loading categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(`Category "${name}" deleted successfully`);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('Error deleting category');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Categories</h1>
            <Badge className="bg-[#3d5a2e]/10 text-[#3d5a2e] hover:bg-[#3d5a2e]/10 border-none rounded-full px-2 py-0">
              {categories.length} categories
            </Badge>
          </div>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">Manage your product categories and showcase images</p>
        </div>
        <Link href="/admin/categories/new">
          <Button className="btn-primary gap-2">
            <Plus size={18} />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
          <Input 
            placeholder="Search categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-[#d4d9b8]" 
          />
        </div>
      </Card>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-[#f0f2e8] rounded-xl" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="p-12 text-center border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
          <FolderTree className="w-12 h-12 text-[#8a8a7a] mx-auto opacity-40" />
          <h3 className="font-bold text-lg text-[#1a2c1a]">No categories found</h3>
          <p className="text-xs text-[#8a8a7a]">Try adjusting your search query or add a new category.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <Card key={cat.id} className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden flex flex-col group">
              <div className="relative h-48 bg-[#f0f2e8] flex items-center justify-center overflow-hidden border-b border-[#d4d9b8]">
                {cat.imageUrl ? (
                  <Image 
                    src={cat.imageUrl} 
                    alt={cat.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="flex flex-col items-center text-[#8a8a7a] gap-2 opacity-50">
                    <ImageIcon size={40} />
                    <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-[#3d5a2e] text-white border-none rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest shadow">
                    {cat._count.products} Products
                  </Badge>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black text-[#1a2c1a] uppercase tracking-tight">{cat.name}</h3>
                    <span className="text-[10px] font-mono font-bold text-[#8a8a7a] bg-[#f0f2e8] px-2 py-0.5 rounded">/{cat.slug}</span>
                  </div>
                  <p className="text-xs text-[#8a8a7a] line-clamp-2 leading-relaxed">
                    {cat.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#f0f2e8]">
                  <div className="flex gap-2">
                    <Link href={`/admin/categories/${cat.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-[#1a2c1a] hover:bg-[#f0f2e8] gap-1.5">
                        <Pencil size={12} /> Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-[#A32D2D] hover:bg-[#FCEBEB] gap-1.5"
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                  <Link href={`/category/${cat.slug}`} target="_blank">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-[#3d5a2e] hover:bg-[#EAF3DE] gap-1.5">
                      <ExternalLink size={12} /> View
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
