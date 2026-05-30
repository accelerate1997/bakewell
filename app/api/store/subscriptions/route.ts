import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        },
        deliverySlot: true,
        deliveries: {
          orderBy: { deliveryDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("GET user subscriptions error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    console.log("POST /api/store/subscriptions called with body:", JSON.stringify(body, null, 2));
    const { 
      frequency, 
      customDays, 
      deliverySlotId, 
      startDate, 
      endDate, 
      items,
      razorpaySubscriptionId,
      razorpayPlanId,
      razorpayPaymentId,
      razorpaySignature,
      mode
    } = body;

    if (!frequency || !deliverySlotId || !startDate || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify Payment
    if (!razorpaySubscriptionId || !razorpayPaymentId) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    if (mode === "live") {
      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ["RAZORPAY_ENABLE", "RAZORPAY_KEY_SECRET"] } }
      });
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      let keySecret = settingsMap["RAZORPAY_KEY_SECRET"];
      if (!keySecret) {
        keySecret = process.env.RAZORPAY_KEY_SECRET || "";
      }

      if (!keySecret) {
        return NextResponse.json({ error: "Payment gateway misconfigured" }, { status: 500 });
      }

      const hash = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
        .digest("hex");

      if (hash !== razorpaySignature) {
        console.error("Subscription payment verification failed!");
        return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
      }
    } else {
      console.log("Verified simulated subscription payment:", razorpayPaymentId);
    }

    const validFrequencies = ['DAILY', 'ALTERNATING', 'WEEKLY', 'CUSTOM_DAYS'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json({ error: "Invalid subscription frequency" }, { status: 400 });
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }

    const end = endDate ? new Date(endDate) : null;
    if (end && isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
    }

    // Generate delivery schedule for up to 90 days or until endDate
    const maxHorizon = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    const limitEnd = (end && end < maxHorizon) ? end : maxHorizon;

    const deliveryDates: Date[] = [];
    let current = new Date(start);
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

    // Set time to midnight UTC for clean date comparisons
    current.setUTCHours(0, 0, 0, 0);
    limitEnd.setUTCHours(23, 59, 59, 999);

    if (frequency === 'DAILY') {
      while (current <= limitEnd) {
        deliveryDates.push(new Date(current));
        current.setUTCDate(current.getUTCDate() + 1);
      }
    } else if (frequency === 'ALTERNATING') {
      while (current <= limitEnd) {
        deliveryDates.push(new Date(current));
        current.setUTCDate(current.getUTCDate() + 2);
      }
    } else if (frequency === 'WEEKLY') {
      const targetDay = start.getUTCDay();
      while (current <= limitEnd) {
        if (current.getUTCDay() === targetDay) {
          deliveryDates.push(new Date(current));
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    } else if (frequency === 'CUSTOM_DAYS') {
      if (!Array.isArray(customDays) || customDays.length === 0) {
        return NextResponse.json({ error: "customDays list is required for CUSTOM_DAYS frequency" }, { status: 400 });
      }
      const formattedCustomDays = customDays.map(d => d.trim().toUpperCase());
      while (current <= limitEnd) {
        const dayName = dayNames[current.getUTCDay()];
        if (formattedCustomDays.includes(dayName)) {
          deliveryDates.push(new Date(current));
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    if (deliveryDates.length === 0) {
      return NextResponse.json({ error: "No delivery dates generated for the chosen schedule" }, { status: 400 });
    }

    // Verify variants and resolve items
    const variantIds = items.map((i: any) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true }
    });

    const variantMap = new Map(variants.map(v => [v.id, v]));
    if (variants.length !== variantIds.length) {
      return NextResponse.json({ error: "One or more selected products are invalid" }, { status: 400 });
    }

    // Fetch subscription discount from settings
    const discountSetting = await prisma.systemSetting.findUnique({
      where: { key: "SUBSCRIPTION_DISCOUNT" }
    });
    const subDiscount = discountSetting ? parseFloat(discountSetting.value) : 10;
    const discountFactor = (100 - subDiscount) / 100;

    // Resolve first delivery date and subsequent delivery dates
    const firstDeliveryDate = deliveryDates[0];
    const subsequentDeliveryDates = deliveryDates.slice(1);

    // Calculate subtotal, taxes, etc. for the first order
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const v = variantMap.get(item.variantId)!;
      const pricePerUnit = v.price * discountFactor;
      const quantity = parseInt(item.quantity) || 1;
      const itemSub = pricePerUnit * quantity;
      subtotal += itemSub;
      
      const gstRate = v.product?.gstRate ?? 5;
      const itemGst = itemSub * (gstRate / 100);

      orderItems.push({
        variantId: v.id,
        quantity,
        unitPrice: pricePerUnit,
        totalPrice: itemSub,
        gstRateApplied: gstRate,
        gstAmount: itemGst,
      });
    }

    const totalTax = orderItems.reduce((acc, item) => acc + item.gstAmount, 0);
    const cgstAmount = Math.round(totalTax * 100) / 100 / 2;
    const sgstAmount = Math.round(totalTax * 100) / 100 / 2;
    const totalAmount = subtotal + cgstAmount + sgstAmount;

    const orderNumber = `#SUB-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create Subscription and first Order in a transaction
    const subscription = await prisma.$transaction(async (tx) => {
      // 1. Create Subscription
      const sub = await tx.subscription.create({
        data: {
          userId,
          frequency,
          customDays: frequency === 'CUSTOM_DAYS' ? customDays.map((d: string) => d.trim().toUpperCase()) : [],
          deliverySlotId,
          startDate: start,
          endDate: end,
          razorpaySubscriptionId: razorpaySubscriptionId || null,
          razorpayPlanId: razorpayPlanId || null,
          items: {
            create: items.map((item: any) => {
              const v = variantMap.get(item.variantId)!;
              return {
                variantId: item.variantId,
                quantity: parseInt(item.quantity) || 1,
                pricePerUnit: v.price * discountFactor,
              };
            }),
          },
          deliveries: {
            create: [
              {
                deliveryDate: firstDeliveryDate,
                status: "GENERATED", // First delivery order generated immediately
              },
              ...subsequentDeliveryDates.map(date => ({
                deliveryDate: date,
                status: "PENDING",
              })),
            ],
          },
        },
        include: {
          deliveries: true,
        },
      });

      // Find the first delivery record to associate the order ID
      const firstDelivery = sub.deliveries.find(
        d => d.deliveryDate.getTime() === firstDeliveryDate.getTime()
      )!;

      // 2. Create the first Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount,
          deliveryCharge: 0,
          couponDiscount: 0,
          packagingFee: 0,
          cgstAmount,
          sgstAmount,
          totalTax: cgstAmount + sgstAmount,
          deliveryDate: firstDeliveryDate,
          deliverySlotId,
          paymentMethod: "UPI",
          paymentStatus: "PAID",
          paymentId: razorpaySubscriptionId || `sub_sim_${Math.floor(100000 + Math.random() * 900000)}`,
          status: "CONFIRMED",
          items: {
            create: orderItems.map(item => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              gstRateApplied: item.gstRateApplied,
              gstAmount: item.gstAmount,
            })),
          },
        },
      });

      // 3. Link first delivery to the created Order
      await tx.subscriptionDelivery.update({
        where: { id: firstDelivery.id },
        data: {
          orderId: order.id,
        },
      });

      // 4. Decrement variant inventory levels for the first delivery items
      for (const item of orderItems) {
        try {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } catch (stockErr) {
          console.warn(`Could not decrement stock for variant ${item.variantId}`, stockErr);
        }
      }

      return sub;
    });

    return NextResponse.json({ success: true, subscriptionId: subscription.id });
  } catch (error) {
    console.error("POST create subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
