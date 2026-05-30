import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // 1. Get existing variants of this product to figure out deletions/updates
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: id },
    });

    const incomingSkus = body.variants.map((v: any) => v.sku);
    const variantsToDelete = existingVariants.filter(v => !incomingSkus.includes(v.sku));

    // 2. Perform a transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Delete variants not in incoming list (if any)
      if (variantsToDelete.length > 0) {
        // Find if any variant has order items
        const variantsWithOrders = await tx.orderItem.findFirst({
          where: {
            variantId: { in: variantsToDelete.map(v => v.id) }
          }
        });
        if (variantsWithOrders) {
          throw new Error('Cannot delete variants that have already been ordered.');
        }
        await tx.productVariant.deleteMany({
          where: { id: { in: variantsToDelete.map(v => v.id) } }
        });
      }

      // Update/Create variants
      for (const variant of body.variants) {
        const existing = existingVariants.find(ev => ev.sku === variant.sku);
        if (existing) {
          await tx.productVariant.update({
            where: { id: existing.id },
            data: {
              label: variant.label,
              price: Number(variant.price),
              stock: Number(variant.stock),
            }
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              sku: variant.sku,
              label: variant.label,
              price: Number(variant.price),
              stock: Number(variant.stock),
            }
          });
        }
      }

      // Update the product itself
      return await tx.product.update({
        where: { id },
        data: {
          name: body.name,
          slug: body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: body.description || null,
          category: {
            connect: { slug: body.category }
          },
          status: body.status ? "ACTIVE" : "INACTIVE",
          metaTitle: body.metaTitle || null,
          metaDescription: body.metaDescription || null,
          nutritionTags: body.nutritionalTags || [],
          images: body.images || [],
          gstRate: Number(body.gstRate ?? 5),
          hsnCode: body.hsnCode || null,
          packagingFee: Number(body.packagingFee ?? 0),
        },
        include: {
          variants: true,
        }
      });
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if any product variant is ordered
    const orderedVariant = await prisma.orderItem.findFirst({
      where: {
        variant: {
          productId: id
        }
      }
    });

    if (orderedVariant) {
      return NextResponse.json({ error: 'Cannot delete product because its variants have active/past orders.' }, { status: 400 });
    }

    // Delete variants and the product (Prisma onDelete: Cascade on product variant will delete them)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
