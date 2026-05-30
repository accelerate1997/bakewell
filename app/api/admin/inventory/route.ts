import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { variantId, stock } = body;

    if (!variantId || typeof stock !== 'number') {
      return NextResponse.json({ error: 'Invalid variant ID or stock value' }, { status: 400 });
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: Math.max(0, Number(stock)) },
    });

    return NextResponse.json(updatedVariant);
  } catch (error) {
    console.error('Error updating inventory stock:', error);
    return NextResponse.json({ error: 'Failed to update inventory stock' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json(); // Array of { sku: string, stock: number }
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid body, expected an array of inventory updates' }, { status: 400 });
    }

    const updates = [];
    for (const item of body) {
      const { sku, stock } = item;
      if (!sku || typeof stock !== 'number') {
        return NextResponse.json({ error: `Invalid SKU or stock value for item: ${JSON.stringify(item)}` }, { status: 400 });
      }

      // Check if variant exists
      const existing = await prisma.productVariant.findUnique({
        where: { sku: sku.trim() },
      });

      if (!existing) {
        return NextResponse.json({ error: `Product variant with SKU "${sku}" not found` }, { status: 404 });
      }

      updates.push(
        prisma.productVariant.update({
          where: { sku: sku.trim() },
          data: { stock: Math.max(0, stock) },
        })
      );
    }

    // Run updates in transaction
    const results = await prisma.$transaction(updates);

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Error bulk updating inventory stock:', error);
    return NextResponse.json({ error: 'Failed to bulk update inventory stock' }, { status: 500 });
  }
}
