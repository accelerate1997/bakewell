import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ pincode: string }> }
) {
  try {
    const { pincode } = await params;

    if (!pincode || pincode.trim().length === 0) {
      return NextResponse.json({ error: 'Pincode is required' }, { status: 400 });
    }

    // Look for active serviceable pincode
    const record = await prisma.serviceablePincode.findUnique({
      where: { pincode: pincode.trim() },
    });

    if (record && record.isActive) {
      return NextResponse.json({
        serviceable: true,
        city: record.city,
        state: record.state,
        deliveryDays: record.deliveryDays,
        deliveryCharge: record.deliveryCharge,
        codAvailable: record.codAvailable,
      });
    }

    // Fallback behavior: If there are ZERO configured pincodes in the database,
    // we allow shipping to all areas so the storefront doesn't get locked out.
    const totalPincodesCount = await prisma.serviceablePincode.count({
      where: { isActive: true },
    });

    if (totalPincodesCount === 0) {
      return NextResponse.json({
        serviceable: true,
        city: 'Delivery Area',
        state: '',
        deliveryDays: 3,
        deliveryCharge: 0,
        codAvailable: true,
        isFallback: true,
      });
    }

    // Otherwise, it's not serviceable
    return NextResponse.json({ serviceable: false });
  } catch (error) {
    console.error('Error checking pincode serviceability:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
