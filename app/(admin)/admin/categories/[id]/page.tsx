import React from 'react';
import { prisma } from '@/lib/prisma';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { notFound } from 'next/navigation';

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  return <CategoryForm initialData={category} />;
}
