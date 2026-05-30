"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: initialData ? {
      name: initialData.name,
      slug: initialData.slug,
      description: initialData.description || '',
      imageUrl: initialData.imageUrl || '',
    } : {
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
    },
  });

  // Auto-generate slug from name if creating new
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    if (!initialData) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue('slug', generatedSlug);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
        form.setValue('imageUrl', data.url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setIsLoading(true);
    try {
      const url = initialData 
        ? `/api/admin/categories/${initialData.id}` 
        : '/api/admin/categories';
      
      const res = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, imageUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Category ${initialData ? 'updated' : 'created'} successfully`);
        router.push('/admin/categories');
        router.refresh();
      } else {
        toast.error(data.error || `Failed to ${initialData ? 'update' : 'create'} category`);
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1a2c1a] hover:bg-[#f0f2e8]">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">
            {initialData ? 'Edit Category' : 'Create Category'}
          </h1>
          <p className="text-xs text-[#8a8a7a] mt-0.5 font-bold uppercase tracking-wider">
            {initialData ? 'Update existing category details and image' : 'Add a new product category to your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details */}
          <Card className="md:col-span-2 p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <h3 className="text-base font-black uppercase tracking-tight text-[#1a2c1a] border-b border-[#f0f2e8] pb-3">
              Category Information
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Category Name *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Breads & Loaves" 
                  {...form.register('name')} 
                  onChange={handleNameChange}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600 font-bold">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">URL Slug *</Label>
                <Input 
                  id="slug" 
                  placeholder="e.g. breads" 
                  {...form.register('slug')} 
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white font-mono text-xs"
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-red-600 font-bold">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Brief description of the category..." 
                  {...form.register('description')} 
                  rows={4}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Image Upload */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-[#1a2c1a] border-b border-[#f0f2e8] pb-3 mb-6">
                Category Image
              </h3>

              <div className="space-y-4">
                <div className="relative aspect-video w-full rounded-xl bg-[#f0f2e8] border-2 border-dashed border-[#d4d9b8] flex flex-col items-center justify-center overflow-hidden group">
                  {imageUrl ? (
                    <>
                      <Image src={imageUrl} alt="Category preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Label htmlFor="image-upload" className="cursor-pointer bg-white text-[#1a2c1a] px-3 py-1.5 rounded font-bold text-xs uppercase tracking-wider shadow">
                          Change Image
                        </Label>
                      </div>
                    </>
                  ) : (
                    <Label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-6 text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-[#8a8a7a] opacity-40" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Upload Image</span>
                      <span className="text-[10px] text-[#8a8a7a]">PNG, JPG up to 5MB</span>
                    </Label>
                  )}
                  <Input 
                    id="image-upload" 
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
                    <span>Uploading image...</span>
                  </div>
                )}
                <div className="space-y-2 pt-2">
                  <Label htmlFor="image-url-input" className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a7a]">Or Image URL</Label>
                  <Input 
                    id="image-url-input" 
                    placeholder="https://example.com/image.jpg" 
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      form.setValue('imageUrl', e.target.value);
                    }}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#f0f2e8]">
              <Button 
                type="submit" 
                disabled={isLoading || isUploading}
                className="w-full bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white py-6 rounded-[8px] font-bold uppercase tracking-widest text-sm shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{initialData ? 'Save Changes' : 'Create Category'}</span>}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
