import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.code !== undefined) {
      const cleanCode = body.code.trim().toUpperCase();
      if (!cleanCode) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
      }
      
      // Check uniqueness if changed
      const existing = await prisma.coupon.findUnique({
        where: { code: cleanCode }
      });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
      }
      updateData.code = cleanCode;
    }

    if (body.type !== undefined) {
      if (body.type !== 'PERCENTAGE' && body.type !== 'FIXED_AMOUNT') {
        return NextResponse.json({ error: 'Invalid coupon type' }, { status: 400 });
      }
      updateData.type = body.type;
    }

    if (body.value !== undefined) {
      const valNum = parseFloat(body.value);
      if (isNaN(valNum) || valNum <= 0) {
        return NextResponse.json({ error: 'Coupon value must be a positive number' }, { status: 400 });
      }
      updateData.value = valNum;
    }

    if (body.minOrderAmount !== undefined) {
      const minOrder = parseFloat(body.minOrderAmount);
      updateData.minOrderAmount = isNaN(minOrder) ? 0 : minOrder;
    }

    if (body.maxUses !== undefined) {
      updateData.maxUses = body.maxUses ? parseInt(body.maxUses) : null;
    }

    if (body.perUserLimit !== undefined) {
      updateData.perUserLimit = body.perUserLimit ? parseInt(body.perUserLimit) : 1;
    }

    if (body.expiryDate !== undefined) {
      updateData.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT admin coupon error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin coupon error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
