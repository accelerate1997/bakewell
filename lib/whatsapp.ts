import { prisma } from "@/lib/prisma";

export interface WhatsAppTemplateParam {
  type: "text" | "currency" | "date_time";
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
}

export interface SendWhatsAppTemplateOptions {
  to: string; // Recipient phone number
  templateName: string;
  languageCode?: string; // Default: 'en' or 'en_US'
  bodyParameters?: (string | number)[];
  buttonUrlParameter?: string;
}

export interface SendWhatsAppTextOptions {
  to: string;
  message: string;
}

/**
 * Normalizes phone numbers to Meta WhatsApp international format (e.g. 919876543210).
 * Handles Indian numbers with leading 0, +91, 91, or bare 10 digits.
 */
export function normalizeWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove spaces, hyphens, parentheses, and '+'
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "").trim();

  // If starts with '0' followed by 10 digits (e.g. 09876543210) -> 919876543210
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `91${cleaned.substring(1)}`;
  }

  // If standard 10-digit Indian mobile number -> prefix 91
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `91${cleaned}`;
  }

  // If already contains country code (e.g. 919876543210)
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  // If international number with 10-15 digits
  if (/^\d{10,15}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Sends a WhatsApp Template message via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = "en",
  bodyParameters = [],
  buttonUrlParameter,
}: SendWhatsAppTemplateOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN || process.env.META_WA_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_NUMBER_ID;

  const normalizedTo = normalizeWhatsAppNumber(to);
  if (!normalizedTo) {
    console.warn(`[WhatsApp] Invalid phone number skipped: "${to}"`);
    return { success: false, error: `Invalid recipient phone number: ${to}` };
  }

  if (!token || !phoneNumberId) {
    console.warn(
      `[WhatsApp] Cloud API credentials not configured (WHATSAPP_CLOUD_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing). Notification skipped for ${normalizedTo}.`
    );
    return { success: false, error: "Meta WhatsApp Cloud API credentials missing" };
  }

  try {
    const components: any[] = [];

    if (bodyParameters.length > 0) {
      components.push({
        type: "body",
        parameters: bodyParameters.map((param) => ({
          type: "text",
          text: String(param),
        })),
      });
    }

    if (buttonUrlParameter) {
      components.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          {
            type: "text",
            text: buttonUrlParameter,
          },
        ],
      });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: components.length > 0 ? components : undefined,
      },
    };

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[WhatsApp API Error] ${response.status}:`, data);
      return { success: false, error: data?.error?.message || "Meta API error", data };
    }

    console.log(`[WhatsApp Success] Template "${templateName}" sent to ${normalizedTo}`);
    return { success: true, data };
  } catch (error: any) {
    console.error("[WhatsApp Send Exception]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a direct text message (ideal for admin alerts or test messages)
 */
export async function sendWhatsAppText({
  to,
  message,
}: SendWhatsAppTextOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN || process.env.META_WA_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_NUMBER_ID;

  const normalizedTo = normalizeWhatsAppNumber(to);
  if (!normalizedTo) return { success: false, error: `Invalid recipient phone number: ${to}` };

  if (!token || !phoneNumberId) {
    console.warn(`[WhatsApp] Credentials missing for text message to ${normalizedTo}`);
    return { success: false, error: "Credentials missing" };
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "text",
      text: {
        preview_url: true,
        body: message,
      },
    };

    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[WhatsApp Text Error] ${response.status}:`, data);
      return { success: false, error: data?.error?.message || "Meta API error", data };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("[WhatsApp Text Exception]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Dispatches WhatsApp Order Confirmation Notification to the Customer and Store Admin
 */
export async function sendOrderConfirmationWhatsApp(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        deliverySlot: true,
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      console.warn(`[WhatsApp] Order not found for id: ${orderId}`);
      return;
    }

    const customerPhone = order.user?.phone;
    const customerName = order.user?.name || "Customer";
    const orderNumber = order.orderNumber;
    const totalAmount = `₹${order.totalAmount.toFixed(0)}`;
    const deliveryDateStr = order.deliveryDate
      ? new Date(order.deliveryDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Upcoming slot";

    const slotLabel = order.deliverySlot?.label ? ` (${order.deliverySlot.label})` : "";
    const fullDeliveryInfo = `${deliveryDateStr}${slotLabel}`;

    const itemsSummary = order.items
      .map(
        (it) =>
          `• ${it.variant?.product?.name || "Item"} (${it.variant?.label || ""}) x ${it.quantity}`
      )
      .join("\n");

    // 1. Send Customer Notification
    if (customerPhone) {
      const templateName =
        process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMATION || "bakewell_order_confirmation";
      const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

      // Try sending official template
      const res = await sendWhatsAppTemplate({
        to: customerPhone,
        templateName,
        languageCode,
        bodyParameters: [
          customerName, // {{1}} Customer Name
          orderNumber, // {{2}} Order Number
          totalAmount, // {{3}} Amount
          fullDeliveryInfo, // {{4}} Delivery date/slot
        ],
      });

      // If template fails due to non-approved template in sandbox, attempt direct text fallback
      if (!res.success && process.env.WHATSAPP_ENABLE_TEXT_FALLBACK === "true") {
        const textMsg = `🍞 *Bakewell Order Confirmed!*\n\nHi ${customerName},\nThank you for ordering with Bakewell! Your order *${orderNumber}* for *${totalAmount}* has been confirmed.\n\n*Delivery:* ${fullDeliveryInfo}\n\n*Items:*\n${itemsSummary}\n\nTrack your order here: https://bakewellbreads.com/account\n\n_Bakewell - No Maida. No Compromise._`;
        await sendWhatsAppText({ to: customerPhone, message: textMsg });
      }
    }

    // 2. Send Admin Alert (if configured)
    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
    if (adminPhone) {
      const adminMsg = `🚨 *New Bakewell Order Alert!*\n\n*Order:* ${orderNumber}\n*Customer:* ${customerName} (${customerPhone || order.user?.email || "N/A"})\n*Amount:* ${totalAmount}\n*Payment:* ${order.paymentMethod} (${order.paymentStatus})\n*Delivery:* ${fullDeliveryInfo}\n\n*Items:*\n${itemsSummary}\n\nView in Admin: https://bakewellbreads.com/admin/orders/${order.id}`;
      await sendWhatsAppText({ to: adminPhone, message: adminMsg });
    }
  } catch (error) {
    console.error("[WhatsApp Order Confirmation Error]", error);
  }
}

/**
 * Dispatches WhatsApp Order Status Update (Confirmed, Shipped, Delivered, Cancelled)
 */
export async function sendOrderStatusWhatsApp(
  orderId: string,
  newStatus: string,
  trackingNumber?: string
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, phone: true } },
      },
    });

    if (!order || !order.user?.phone) return;

    const customerPhone = order.user.phone;
    const customerName = order.user.name || "Customer";
    const orderNumber = order.orderNumber;

    let statusDisplay = newStatus;
    let statusEmoji = "📦";

    if (newStatus === "CONFIRMED") {
      statusDisplay = "Confirmed & Baking Fresh";
      statusEmoji = "🍞";
    } else if (newStatus === "SHIPPED") {
      statusDisplay = "Out for Delivery";
      statusEmoji = "🚚";
    } else if (newStatus === "DELIVERED") {
      statusDisplay = "Delivered";
      statusEmoji = "🎉";
    } else if (newStatus === "CANCELLED") {
      statusDisplay = "Cancelled";
      statusEmoji = "❌";
    }

    const templateName =
      process.env.WHATSAPP_TEMPLATE_ORDER_STATUS || "bakewell_order_status_update";
    const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

    const res = await sendWhatsAppTemplate({
      to: customerPhone,
      templateName,
      languageCode,
      bodyParameters: [
        customerName, // {{1}}
        orderNumber, // {{2}}
        statusDisplay, // {{3}}
        trackingNumber || "N/A", // {{4}}
      ],
    });

    if (!res.success && process.env.WHATSAPP_ENABLE_TEXT_FALLBACK === "true") {
      const trackingMsg = trackingNumber ? `\n*Tracking:* ${trackingNumber}` : "";
      const textMsg = `${statusEmoji} *Bakewell Order Update*\n\nHi ${customerName},\nYour order *${orderNumber}* status is now: *${statusDisplay}*.${trackingMsg}\n\nTrack order details: https://bakewellbreads.com/account\n\nThank you for choosing Bakewell!`;
      await sendWhatsAppText({ to: customerPhone, message: textMsg });
    }
  } catch (error) {
    console.error("[WhatsApp Status Update Error]", error);
  }
}
