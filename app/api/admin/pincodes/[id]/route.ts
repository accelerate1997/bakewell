import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || (role !== 'ADMIN' && role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = await prisma.serviceablePincode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pincode record not found' }, { status: 404 });
    }

    await prisma.serviceablePincode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin pincode error:', error);
    return NextResponse.json({ error: 'Failed to delete pincode' }, { status: 500 });
  }
}
