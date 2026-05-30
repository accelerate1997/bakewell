import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Create product with variants
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        category: {
          connect: { slug: body.category }
        },
        status: body.status ? "ACTIVE" : "INACTIVE",
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        nutritionTags: body.nutritionalTags,
        images: body.images || [],
        gstRate: Number(body.gstRate ?? 5),
        hsnCode: body.hsnCode || null,
        packagingFee: Number(body.packagingFee ?? 0),
        variants: {
          create: body.variants.map((v: any) => ({
            label: v.label,
            price: Number(v.price),
            stock: Number(v.stock),
            sku: v.sku,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: {
          include: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
