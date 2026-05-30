import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    const normalizedRole = userRole?.toUpperCase();
    const isAuthorized = normalizedRole === "ADMIN" || normalizedRole === "STAFF";
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
    if (startDateParam) {
      startDate = new Date(startDateParam);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    let endDate = new Date();
    if (endDateParam) {
      endDate = new Date(endDateParam);
    } else {
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch all orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    category: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const completedOrders = orders.filter(o => o.status !== "CANCELLED");
    const cancelledOrders = orders.filter(o => o.status === "CANCELLED");

    const totalOrdersCount = completedOrders.length;
    const cancelledOrdersCount = cancelledOrders.length;

    let grossSales = 0;
    completedOrders.forEach(o => {
      o.items.forEach(item => {
        grossSales += item.totalPrice;
      });
    });

    const totalCouponDiscount = completedOrders.reduce((sum, o) => sum + o.couponDiscount, 0);
    const totalDeliveryCharge = completedOrders.reduce((sum, o) => sum + o.deliveryCharge, 0);
    const totalPackagingFee = completedOrders.reduce((sum, o) => sum + o.packagingFee, 0);
    const totalTax = completedOrders.reduce((sum, o) => sum + o.totalTax, 0);
    const totalCgst = completedOrders.reduce((sum, o) => sum + o.cgstAmount, 0);
    const totalSgst = completedOrders.reduce((sum, o) => sum + o.sgstAmount, 0);
    const totalIgst = completedOrders.reduce((sum, o) => sum + o.igstAmount, 0);
    
    const netSales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueLostCancelled = cancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const avgOrderValue = totalOrdersCount > 0 ? netSales / totalOrdersCount : 0;

    // 2. Daily Sales Trends
    const dailyMap = new Map<string, { date: string; gross: number; net: number; orders: number }>();
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 90) {
      for (let i = 0; i <= diffDays; i++) {
        const tempDate = new Date(startDate);
        tempDate.setDate(startDate.getDate() + i);
        const dateKey = tempDate.toISOString().split("T")[0];
        dailyMap.set(dateKey, {
          date: dateKey,
          gross: 0,
          net: 0,
          orders: 0
        });
      }
    }

    completedOrders.forEach(o => {
      const dateKey = new Date(o.createdAt).toISOString().split("T")[0];
      const existing = dailyMap.get(dateKey) || { date: dateKey, gross: 0, net: 0, orders: 0 };
      
      let orderGross = 0;
      o.items.forEach(item => { orderGross += item.totalPrice; });

      dailyMap.set(dateKey, {
        date: dateKey,
        gross: existing.gross + orderGross,
        net: existing.net + o.totalAmount,
        orders: existing.orders + 1
      });
    });

    const dailySales = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Product & Category Breakdown
    const productMap = new Map<string, { id: string; name: string; variant: string; quantity: number; revenue: number }>();
    const categoryMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    completedOrders.forEach(o => {
      o.items.forEach(item => {
        const variantId = item.variantId;
        const productName = item.variant?.product?.name || "Unknown Product";
        const variantLabel = item.variant?.label || "Standard";
        const categoryName = item.variant?.product?.category?.name || "Uncategorized";

        const prodKey = `${variantId}`;
        const existingProd = productMap.get(prodKey) || {
          id: variantId,
          name: productName,
          variant: variantLabel,
          quantity: 0,
          revenue: 0
        };
        productMap.set(prodKey, {
          ...existingProd,
          quantity: existingProd.quantity + item.quantity,
          revenue: existingProd.revenue + item.totalPrice
        });

        const existingCat = categoryMap.get(categoryName) || {
          name: categoryName,
          quantity: 0,
          revenue: 0
        };
        categoryMap.set(categoryName, {
          name: categoryName,
          quantity: existingCat.quantity + item.quantity,
          revenue: existingCat.revenue + item.totalPrice
        });
      });
    });

    const productSales = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    const categorySales = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);

    // 4. Payment Method Breakdown
    const paymentMap = new Map<string, { method: string; count: number; total: number }>();
    ["UPI", "CARD", "COD"].forEach(method => {
      paymentMap.set(method, { method, count: 0, total: 0 });
    });

    completedOrders.forEach(o => {
      const method = o.paymentMethod;
      const existing = paymentMap.get(method) || { method, count: 0, total: 0 };
      paymentMap.set(method, {
        method,
        count: existing.count + 1,
        total: existing.total + o.totalAmount
      });
    });

    const paymentBreakdown = Array.from(paymentMap.values());

    // 5. Tax Ledger (GST Detail)
    const taxLedger = completedOrders.map(o => {
      let orderSubtotal = 0;
      o.items.forEach(item => {
        orderSubtotal += item.totalPrice;
      });

      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        date: o.createdAt,
        customerName: o.user?.name || "Guest",
        customerEmail: o.user?.email || "",
        subtotal: orderSubtotal,
        couponDiscount: o.couponDiscount,
        deliveryCharge: o.deliveryCharge,
        packagingFee: o.packagingFee,
        cgst: o.cgstAmount,
        sgst: o.sgstAmount,
        igst: o.igstAmount,
        totalTax: o.totalTax,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus
      };
    });

    return NextResponse.json({
      summary: {
        grossSales,
        totalCouponDiscount,
        totalDeliveryCharge,
        totalPackagingFee,
        totalTax,
        totalCgst,
        totalSgst,
        totalIgst,
        netSales,
        avgOrderValue,
        totalOrdersCount,
        cancelledOrdersCount,
        revenueLostCancelled
      },
      dailySales,
      productSales,
      categorySales,
      paymentBreakdown,
      taxLedger
    });
  } catch (error) {
    console.error("GET reports statistics error:", error);
    return NextResponse.json({ error: "Failed to generate report statistics" }, { status: 500 });
  }
}
