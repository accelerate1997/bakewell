"use client"

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowUpDown, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products').then(res => res.json()),
      fetch('/api/admin/categories').then(res => res.json())
    ]).then(([prodData, catData]) => {
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(catData)) setCategories(catData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredProducts = products
    .filter((p: any) => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || p.category?.slug === selectedCategory;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && p.status === 'ACTIVE') || 
        (statusFilter === 'inactive' && p.status === 'INACTIVE');
      return matchesSearch && matchesCat && matchesStatus;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      const getPrice = (p: any) => {
        const prices = p.variants?.map((v: any) => v.price) || [0];
        return prices.length > 0 ? Math.min(...prices) : 0;
      };
      
      const priceA = getPrice(a);
      const priceB = getPrice(b);
      
      if (sortBy === 'price-high') {
        return priceB - priceA;
      }
      if (sortBy === 'price-low') {
        return priceA - priceB;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Products</h1>
            <Badge className="bg-[#3d5a2e]/10 text-[#3d5a2e] hover:bg-[#3d5a2e]/10 border-none rounded-full px-2 py-0">
              {products.length} products
            </Badge>
          </div>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">Manage your bakery and FMCG catalog</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="btn-primary gap-2">
            <Plus size={18} />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
            <Input 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-[#d4d9b8]" 
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={(val: any) => setSelectedCategory(val || 'all')}>
            <SelectTrigger className="h-10 border-[#d4d9b8]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val || 'all')}>
            <SelectTrigger className="h-10 border-[#d4d9b8]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val || 'newest')}>
            <SelectTrigger className="h-10 border-[#d4d9b8]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold text-center">Variants</th>
                <th className="px-6 py-4 font-bold">Price Range</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2e8]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#8a8a7a]">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#8a8a7a]">No products found</td>
                </tr>
              ) : filteredProducts.map((product: any, i: number) => {
                const prices = product.variants?.map((v: any) => v.price) || [0];
                const minPrice = Math.min(...prices, 0);
                const maxPrice = Math.max(...prices, 0);
                const priceStr = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} – ₹${maxPrice}`;
                const totalStock = product.variants?.reduce((acc: number, v: any) => acc + v.stock, 0) || 0;
                const skuStr = product.variants?.[0]?.sku || 'N/A';
                const catName = product.category?.name || 'Uncategorized';
                const emoji = product.slug?.includes("bread") ? "🍞" : product.slug?.includes("cake") ? "🍰" : product.slug?.includes("cookie") ? "🍪" : "🥖";
                const thumbUrl = product.images?.[0] || null;

                return (
                  <tr 
                    key={product.id} 
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", 
                      "hover:bg-[#f0f2e8]"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-[#e8ead8] flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span
                            className="w-full h-full flex items-center justify-center text-xl"
                            style={{ display: thumbUrl ? 'none' : 'flex' }}
                          >
                            {emoji}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#1a2c1a]">{product.name}</p>
                          <p className="text-[10px] text-[#8a8a7a] font-mono">{product.sku || skuStr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-[#e8ead8] text-[#3d5a2e] hover:bg-[#e8ead8] border-none rounded-full px-3 py-0.5 text-[10px] font-bold uppercase">
                        {catName}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-[#1a2c1a]">{product.variants?.length || 0} variants</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#1a2c1a]">{priceStr}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-xs font-black",
                          totalStock < 5 ? "text-[#A32D2D]" : totalStock < 10 ? "text-[#c8872a]" : "text-[#3B6D11]"
                        )}>
                          {totalStock}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-[#8a8a7a]">in stock</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "rounded-full border-none px-3 py-0.5 text-[10px] font-bold uppercase",
                        product.status === 'ACTIVE' ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-[#F5F5F5] text-[#8a8a7a]"
                      )}>
                        {product.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1a2c1a] hover:bg-[#f0f2e8]">
                            <Pencil size={14} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A32D2D] hover:bg-[#FCEBEB]">
                          <Trash2 size={14} />
                        </Button>
                        <Link href={`/product/${product.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8a8a7a] hover:bg-[#f0f2e8]">
                            <ExternalLink size={14} />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-[#f0f2e8] flex items-center justify-between">
          <p className="text-[10px] text-[#8a8a7a] font-bold uppercase">Showing {filteredProducts.length} products</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-[#d4d9b8]">Previous</Button>
            <Button variant="default" size="sm" className="h-8 w-8 text-[10px] font-bold bg-[#3d5a2e] text-white border-[#3d5a2e]">1</Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-[#d4d9b8]">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
