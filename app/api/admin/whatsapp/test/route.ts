import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendWhatsAppTemplate, sendWhatsAppText } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, type, templateName, message } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (type === 'template') {
      const template = templateName || process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMATION || 'bakewell_order_confirmation';
      const result = await sendWhatsAppTemplate({
        to: phone,
        templateName: template,
        languageCode: 'en',
        bodyParameters: ['Test User', '#ORD-TEST', '₹450', 'Tomorrow Morning'],
      });
      return NextResponse.json(result);
    } else {
      const textMsg = message || '🍞 Hello from Bakewell! This is a test notification via Meta WhatsApp Cloud API.';
      const result = await sendWhatsAppText({
        to: phone,
        message: textMsg,
      });
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('WhatsApp Test Endpoint Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
