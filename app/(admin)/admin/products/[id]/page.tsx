import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductForm } from '@/components/admin/ProductForm';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'new';

  let product = null;
  if (!isNew) {
    product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product) {
      notFound();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/products" 
          className="w-10 h-10 rounded-full border border-[#d4d9b8] flex items-center justify-center text-[#1a2c1a] hover:bg-white transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">
            {isNew ? 'Add New Product' : 'Edit Product'}
          </h1>
          <p className="text-[10px] text-[#8a8a7a] font-bold uppercase tracking-wider">
            {isNew ? 'Create a new listing in your catalog' : `Editing Product: ${product?.name}`}
          </p>
        </div>
      </div>

      <ProductForm initialData={product} />
    </div>
  );
}
