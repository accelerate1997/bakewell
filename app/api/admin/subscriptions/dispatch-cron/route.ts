import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const cronSecret = process.env.NEXTAUTH_SECRET || "f33d4e5f6g7h8i9j0k1l2m3n4o5p6q7r";

    // Simple security validation for cron executions
    if (key !== cronSecret && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: "Unauthorized cron execution key" }, { status: 401 });
    }

    const targetDateParam = searchParams.get('date');
    const targetDate = targetDateParam ? new Date(targetDateParam) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid target date" }, { status: 400 });
    }

    const todayStart = new Date(targetDate);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(targetDate);
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Fetch all active subscription deliveries scheduled for today
    const pendingDeliveries = await prisma.subscriptionDelivery.findMany({
      where: {
        status: "PENDING",
        deliveryDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        subscription: {
          status: "ACTIVE",
        },
      },
      include: {
        subscription: {
          include: {
            items: {
              include: {
                variant: {
                  include: { product: true }
                }
              }
            }
          }
        }
      }
    });

    let successCount = 0;
    const errors = [];

    for (const delivery of pendingDeliveries) {
      try {
        const sub = delivery.subscription;
        
        let subtotal = 0;
        const orderItems: any[] = [];

        for (const item of sub.items) {
          const itemSub = item.pricePerUnit * item.quantity;
          subtotal += itemSub;
          
          const gstRate = item.variant.product.gstRate ?? 5;
          const itemGst = itemSub * (gstRate / 100);

          orderItems.push({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.pricePerUnit,
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

        // Process order and stock decrement in single transaction
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              orderNumber,
              userId: sub.userId,
              totalAmount,
              deliveryCharge: 0,
              couponDiscount: 0,
              packagingFee: 0,
              cgstAmount,
              sgstAmount,
              totalTax: cgstAmount + sgstAmount,
              deliveryDate: delivery.deliveryDate,
              deliverySlotId: sub.deliverySlotId,
              paymentMethod: "UPI",
              paymentStatus: "PAID",
              paymentId: sub.razorpaySubscriptionId,
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

          // Mark delivery log as generated
          await tx.subscriptionDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "GENERATED",
              orderId: order.id,
            },
          });

          // Decrement variant inventory levels
          for (const item of orderItems) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        });

        successCount++;
      } catch (err: any) {
        console.error(`Failed to dispatch subscription delivery ${delivery.id}:`, err);
        errors.push({ id: delivery.id, error: err.message || "Unknown transaction error" });
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingDeliveries.length,
      dispatched: successCount,
      failures: errors.length,
      errors
    });
  } catch (error: any) {
    console.error("Cron subscription dispatcher error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch subscription orders" }, { status: 500 });
  }
}
export const POST = GET;
