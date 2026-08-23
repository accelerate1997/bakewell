import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderStatusWhatsApp } from '@/lib/whatsapp';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber, notes } = body;

    const previousOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    const newStatusUpper = status ? status.toUpperCase() : undefined;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: newStatusUpper,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    if (newStatusUpper && previousOrder?.status !== newStatusUpper) {
      sendOrderStatusWhatsApp(id, newStatusUpper, trackingNumber).catch((waErr) =>
        console.error('[WhatsApp Status Update Error]:', waErr)
      );
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
