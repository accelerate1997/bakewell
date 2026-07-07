'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Image as ImageIcon, X, Upload, Info, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const productSchema = z.object({
  name: z.string().min(3, 'Product name is required'),
  slug: z.string().min(3, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  status: z.boolean().default(true),
  variants: z.array(z.object({
    label: z.string().min(1, 'Label required'),
    price: z.coerce.number().min(0, 'Price required'),
    stock: z.coerce.number().min(0, 'Stock required'),
    sku: z.string().min(1, 'SKU required'),
  })).min(1, 'At least one variant is required'),
  nutritionalTags: z.array(z.string()),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  images: z.array(z.string()).default([]),
  gstRate: z.coerce.number().default(5),
  hsnCode: z.string().optional().nullable(),
  packagingFee: z.coerce.number().min(0, 'Packaging fee must be 0 or greater').default(0),
});

type ProductFormValues = z.infer<typeof productSchema>;

const NUTRITIONAL_TAGS = [
  'No Maida', 'High Protein', 'Vegan', 'Gluten Free', 
  'Sugar Free', 'No Preservatives', 'Fresh Baked'
];

export function ProductForm({ initialData }: { initialData?: any }) {
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();
  }, []);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      category: initialData.category?.slug || initialData.categoryId || '',
      status: initialData.status === 'ACTIVE' || initialData.status === true,
      images: initialData.images || [],
      nutritionalTags: initialData.nutritionTags || initialData.nutritionalTags || [],
      gstRate: initialData.gstRate ?? 5,
      hsnCode: initialData.hsnCode ?? '',
      packagingFee: initialData.packagingFee ?? 0,
    } : {
      name: '',
      slug: '',
      description: '',
      category: '',
      status: true,
      variants: [{ label: '', price: 0, stock: 0, sku: '' }],
      nutritionalTags: [],
      metaTitle: '',
      metaDescription: '',
      images: [],
      gstRate: 5,
      hsnCode: '',
      packagingFee: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants"
  });

  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setImages(prev => [...prev, data.url]);
          toast.success('Image uploaded successfully');
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    } catch (error) {
      toast.error('Error uploading images');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const payload = {
        ...data,
        images,
      };
      const url = initialData ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
      const method = initialData ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save product');
      }

      const isDraft = !data.status;
      if (isDraft) {
        toast.success(initialData ? 'Product draft updated successfully!' : 'Product saved as draft!');
      } else {
        toast.success(initialData ? 'Product updated successfully!' : 'Product published successfully!');
      }
      router.push('/admin/products');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    }
  };

  const variants = form.watch('variants') || [];
  const totalPrice = variants.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const totalStock = variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  const minPrice = Math.min(...variants.map(v => Number(v.price) || 0)) || 0;
  const maxPrice = Math.max(...variants.map(v => Number(v.price) || 0)) || 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column (60%) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Basic Info */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a]">Basic Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px]">Product Name</Label>
                <Input 
                  {...form.register('name')} 
                  placeholder="e.g. Multigrain Sourdough"
                  className="h-10 border-[#d4d9b8] focus-visible:ring-[#3d5a2e]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px]">Slug</Label>
                <Input 
                  {...form.register('slug')} 
                  placeholder="multigrain-sourdough"
                  className="h-10 border-[#d4d9b8] bg-[#f9faf6]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px]">Description</Label>
                <Textarea 
                  {...form.register('description')} 
                  placeholder="Tell us about this delicious product..."
                  className="min-h-[120px] border-[#d4d9b8] focus-visible:ring-[#3d5a2e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px]">Category</Label>
                  <Select value={form.watch('category')} onValueChange={(v) => form.setValue('category', v || '')}>
                    <SelectTrigger className="h-10 border-[#d4d9b8]">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-8">
                  <Switch 
                    checked={form.watch('status')}
                    onCheckedChange={(v) => form.setValue('status', v)}
                  />
                  <Label className="text-[10px] m-0">Active Status</Label>
                </div>
              </div>
            </div>
          </Card>

          {/* Variants */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a]">Product Variants</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-8 text-[10px] font-bold uppercase tracking-widest border-[#3d5a2e] text-[#3d5a2e]"
                onClick={() => append({ label: '', price: 0, stock: 0, sku: '' })}
              >
                <Plus size={14} className="mr-1" /> Add Variant
              </Button>
            </div>

            <div className="overflow-x-auto border border-[#f0f2e8] rounded-md">
              <table className="w-full text-left">
                <thead className="bg-[#f9faf6] text-[10px] uppercase tracking-widest border-b border-[#f0f2e8]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Label</th>
                    <th className="px-4 py-3 font-bold">Price (₹)</th>
                    <th className="px-4 py-3 font-bold">Stock</th>
                    <th className="px-4 py-3 font-bold">SKU</th>
                    <th className="px-4 py-3 font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2e8]">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="p-2">
                        <Input 
                          {...form.register(`variants.${index}.label`)} 
                          placeholder="400g"
                          className="h-8 border-none bg-transparent focus-visible:ring-0 text-xs font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number"
                          {...form.register(`variants.${index}.price`)} 
                          className="h-8 border-none bg-transparent focus-visible:ring-0 text-xs font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number"
                          {...form.register(`variants.${index}.stock`)} 
                          className="h-8 border-none bg-transparent focus-visible:ring-0 text-xs font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          {...form.register(`variants.${index}.sku`)} 
                          placeholder="SKU-123"
                          className="h-8 border-none bg-transparent focus-visible:ring-0 text-[10px] font-mono"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-[#A32D2D]"
                          onClick={() => remove(index)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Taxation & Packaging Fees */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a]">Taxation & Packaging Fees</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px]">GST Rate (%)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  {...form.register('gstRate')} 
                  placeholder="e.g. 5"
                  className="h-10 border-[#d4d9b8] focus-visible:ring-[#3d5a2e]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px]">HSN Code</Label>
                <Input 
                  {...form.register('hsnCode')} 
                  placeholder="e.g. 1905"
                  className="h-10 border-[#d4d9b8] focus-visible:ring-[#3d5a2e]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px]">Packaging Fee Override (₹)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  {...form.register('packagingFee')} 
                  placeholder="0.00"
                  className="h-10 border-[#d4d9b8] focus-visible:ring-[#3d5a2e]"
                />
              </div>
            </div>
          </Card>

          {/* Nutritional Tags */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a]">Nutritional Tags</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {NUTRITIONAL_TAGS.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox 
                    id={tag} 
                    checked={form.watch('nutritionalTags')?.includes(tag)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('nutritionalTags') || [];
                      if (checked) {
                        form.setValue('nutritionalTags', [...current, tag]);
                      } else {
                        form.setValue('nutritionalTags', current.filter(t => t !== tag));
                      }
                    }}
                  />
                  <Label htmlFor={tag} className="text-[10px] cursor-pointer">{tag}</Label>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (40%) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Images */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a]">Product Images</h3>
            
            <Label htmlFor="product-images-upload" className="border-2 border-dashed border-[#d4d9b8] rounded-[8px] p-8 flex flex-col items-center justify-center gap-2 hover:bg-[#f9faf6] transition-colors cursor-pointer block w-full text-center">
              <div className="w-10 h-10 rounded-full bg-[#f0f2e8] flex items-center justify-center text-[#3d5a2e] mx-auto">
                <Upload size={20} />
              </div>
              <p className="text-xs font-bold text-[#1a2c1a]">Drop images here or click to upload</p>
              <p className="text-[10px] text-[#8a8a7a]">Upload multiple PNG, JPG images</p>
            </Label>
            <Input 
              id="product-images-upload" 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleImageUpload} 
              disabled={isUploading}
              className="hidden" 
            />

            {isUploading && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#c8872a]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading images...</span>
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl border border-[#d4d9b8] overflow-hidden group bg-[#f9faf6]">
                    <Image src={img} alt={`Product preview ${idx + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* SEO */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1a2c1a]">SEO Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px]">Meta Title</Label>
                <Input 
                  {...form.register('metaTitle')} 
                  placeholder="Search engine title..."
                  className="h-10 border-[#d4d9b8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Meta Description</Label>
                <Textarea 
                  {...form.register('metaDescription')} 
                  placeholder="Brief description for search results..."
                  className="min-h-[80px] border-[#d4d9b8]"
                />
              </div>
            </div>
          </Card>

          {/* Pricing Summary */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-[#1a2c1a] text-white space-y-6">
            <h3 className="text-sm font-black uppercase tracking-tight">Pricing Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-white/50">Price Range</span>
                <span className="text-sm font-black">₹{minPrice} – ₹{maxPrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-white/50">Total Stock</span>
                <span className="text-sm font-black">{totalStock} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-white/50">Active Variants</span>
                <span className="text-sm font-black">{fields.length} variants</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 md:left-[240px] right-0 h-20 bg-white border-t border-[#d4d9b8] px-4 md:px-8 flex items-center justify-between z-50">
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="border-[#d4d9b8] uppercase text-xs font-bold tracking-widest px-6"
            onClick={() => router.push('/admin/products')}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="border-[#d4d9b8] uppercase text-xs font-bold tracking-widest px-6 animate-pulse-subtle"
            onClick={async () => {
              form.setValue('status', false);
              await form.handleSubmit(onSubmit)();
            }}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && !form.getValues('status') ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save as Draft'
            )}
          </Button>
        </div>
        <Button 
          type="submit" 
          className="btn-primary px-10"
          onClick={() => {
            form.setValue('status', true);
          }}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && form.getValues('status') ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Product'
          )}
        </Button>
      </div>
    </form>
  );
}
