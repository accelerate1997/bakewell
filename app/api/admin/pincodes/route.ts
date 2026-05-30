import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Get list of serviceable pincodes
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let whereClause = {};
    if (search.trim()) {
      whereClause = {
        OR: [
          { pincode: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { state: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const pincodes = await prisma.serviceablePincode.findMany({
      where: whereClause,
      orderBy: { pincode: 'asc' },
    });

    return NextResponse.json(pincodes);
  } catch (error) {
    console.error('GET admin pincodes error:', error);
    return NextResponse.json({ error: 'Failed to fetch pincodes' }, { status: 500 });
  }
}

// Add a single serviceable pincode
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pincode, city, state, deliveryDays, deliveryCharge, codAvailable } = body;

    if (!pincode || !city || !state) {
      return NextResponse.json({ error: 'Pincode, City, and State are required' }, { status: 400 });
    }

    // Check if pincode already exists
    const existing = await prisma.serviceablePincode.findUnique({
      where: { pincode: pincode.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Pincode already configured' }, { status: 400 });
    }

    const newPincode = await prisma.serviceablePincode.create({
      data: {
        pincode: pincode.trim(),
        city: city.trim(),
        state: state.trim(),
        deliveryDays: deliveryDays ? parseInt(deliveryDays) : 2,
        deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : 0,
        codAvailable: codAvailable !== false,
      },
    });

    return NextResponse.json(newPincode);
  } catch (error) {
    console.error('POST admin pincode error:', error);
    return NextResponse.json({ error: 'Failed to create pincode' }, { status: 500 });
  }
}

// Bulk upsert/import pincodes from JSON list
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid data format. Expected an array of pincodes' }, { status: 400 });
    }

    let successCount = 0;

    // Process them in a single batch transaction or sequence
    for (const item of body) {
      const { pincode, city, state, deliveryDays, deliveryCharge, codAvailable } = item;
      if (!pincode || !city || !state) continue;

      const p = String(pincode).trim();
      await prisma.serviceablePincode.upsert({
        where: { pincode: p },
        update: {
          city: String(city).trim(),
          state: String(state).trim(),
          deliveryDays: deliveryDays ? parseInt(deliveryDays) : 2,
          deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : 0,
          codAvailable: codAvailable !== false,
          isActive: true,
        },
        create: {
          pincode: p,
          city: String(city).trim(),
          state: String(state).trim(),
          deliveryDays: deliveryDays ? parseInt(deliveryDays) : 2,
          deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : 0,
          codAvailable: codAvailable !== false,
          isActive: true,
        },
      });
      successCount++;
    }

    return NextResponse.json({ success: true, count: successCount });
  } catch (error) {
    console.error('PUT bulk admin pincodes error:', error);
    return NextResponse.json({ error: 'Failed to bulk import pincodes' }, { status: 500 });
  }
}
