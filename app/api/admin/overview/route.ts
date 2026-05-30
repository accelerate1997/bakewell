import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") || "30D";

    // 1. Calculate General Stats
    const allOrders = await prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { totalAmount: true },
    });
    const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrdersCount = await prisma.order.count();
    const totalCustomersCount = await prisma.user.count({
      where: { role: "CUSTOMER" },
    });
    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    // 2. Calculate comparison deltas (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: "CANCELLED" },
      },
      select: { totalAmount: true },
    });
    const currentRevenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const currentOrdersCount = currentOrders.length;

    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: { not: "CANCELLED" },
      },
      select: { totalAmount: true },
    });
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const previousOrdersCount = previousOrders.length;

    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const ordersChange = previousOrdersCount > 0 
      ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100 
      : 0;

    // Customers comparison
    const currentCustomersCount = await prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: thirtyDaysAgo } },
    });
    const previousCustomersCount = await prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const customersChange = previousCustomersCount > 0
      ? ((currentCustomersCount - previousCustomersCount) / previousCustomersCount) * 100
      : 0;

    // Avg Order Value comparison
    const currentAvg = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0;
    const previousAvg = previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0;
    const avgValueChange = previousAvg > 0
      ? ((currentAvg - previousAvg) / previousAvg) * 100
      : 0;

    // 3. Fetch Recent Orders (last 5)
    const recentOrdersDb = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const recentOrders = recentOrdersDb.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.user?.name || "Guest",
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: order.totalAmount,
      status: order.status.toLowerCase(),
      date: new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    // 4. Fetch Low Stock Items (variants with stock < 10)
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: { lt: 10 },
        product: { status: "ACTIVE" },
      },
      take: 5,
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { stock: "asc" },
    });

    const lowStockItems = lowStockVariants.map(variant => ({
      name: variant.product.name,
      variant: variant.label,
      stock: variant.stock,
      status: variant.stock === 0 ? "out" : variant.stock < 5 ? "critical" : "low"
    }));

    // Count of all low stock variants in the database
    const totalLowStockCount = await prisma.productVariant.count({
      where: {
        stock: { lt: 10 },
        product: { status: "ACTIVE" },
      }
    });

    // 5. Generate Chart Data
    let daysToFetch = 30;
    if (rangeParam === "7D") daysToFetch = 7;
    else if (rangeParam === "90D") daysToFetch = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);

    const ordersForChart = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: "CANCELLED" },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const chartDataMap = new Map<string, number>();
    
    // Initialize dates
    for (let i = daysToFetch - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      chartDataMap.set(dateString, 0);
    }

    ordersForChart.forEach(o => {
      const dateString = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (chartDataMap.has(dateString)) {
        const currentVal = chartDataMap.get(dateString) || 0;
        chartDataMap.set(dateString, currentVal + o.totalAmount);
      }
    });

    const chartData = Array.from(chartDataMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return NextResponse.json({
      revenue: totalRevenue,
      orders: totalOrdersCount,
      customers: totalCustomersCount,
      avgOrderValue,
      revenueChange,
      ordersChange,
      customersChange,
      avgValueChange,
      recentOrders,
      lowStockItems,
      totalLowStockCount,
      chartData,
    });
  } catch (error) {
    console.error("GET overview stats error:", error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
