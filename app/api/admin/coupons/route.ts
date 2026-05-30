import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all coupons
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const now = new Date();
    const activeCount = coupons.filter(c => 
      c.isActive && 
      (!c.expiryDate || new Date(c.expiryDate) > now) &&
      (!c.maxUses || c.usedCount < c.maxUses)
    ).length;

    const totalRedemptions = coupons.reduce((sum, c) => sum + c.usedCount, 0);

    // Sum coupon discount from orders
    const orderAgg = await prisma.order.aggregate({
      _sum: {
        couponDiscount: true
      }
    });
    const couponRevenue = orderAgg._sum.couponDiscount || 0;

    return NextResponse.json({
      coupons,
      stats: {
        activeCount,
        totalRedemptions,
        couponRevenue
      }
    });
  } catch (error) {
    console.error('GET admin coupons error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, type, value, minOrderAmount, maxUses, perUserLimit, expiryDate, isActive } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    if (type !== 'PERCENTAGE' && type !== 'FIXED_AMOUNT') {
      return NextResponse.json({ error: 'Invalid coupon type. Must be PERCENTAGE or FIXED_AMOUNT' }, { status: 400 });
    }

    const valNum = parseFloat(value);
    if (isNaN(valNum) || valNum <= 0) {
      return NextResponse.json({ error: 'Coupon value must be a positive number' }, { status: 400 });
    }

    // Check unique code
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode }
    });

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        type,
        value: valNum,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        maxUses: maxUses ? parseInt(maxUses) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: isActive !== false
      }
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('POST admin coupon error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
