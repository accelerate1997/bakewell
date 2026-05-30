import { prisma } from '@/lib/prisma';
import { CustomersClientView } from '@/components/admin/CustomersClientView';

export const revalidate = 0;

export default async function CustomersPage() {
  const dbCustomers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
    },
    include: {
      orders: {
        select: {
          totalAmount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const customers = dbCustomers.map((c) => {
    const ordersCount = c.orders.length;
    const spend = c.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lastOrderDate = c.orders[0]?.createdAt;
    let lastOrder = 'No orders';
    if (lastOrderDate) {
      const diffDays = Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) lastOrder = 'Today';
      else if (diffDays === 1) lastOrder = 'Yesterday';
      else lastOrder = `${diffDays} days ago`;
    }

    let segment = 'New';
    if (ordersCount >= 6) segment = 'Loyal';
    else if (ordersCount >= 2) segment = 'Repeat';

    return {
      id: c.id,
      name: c.name || 'Unnamed Customer',
      email: c.email || 'No email',
      phone: c.phone || 'No phone',
      orders: ordersCount,
      spend,
      lastOrder,
      segment,
    };
  });

  const totalCustomers = customers.length;
  const newThisMonth = dbCustomers.filter(c => {
    const now = new Date();
    const created = new Date(c.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const repeatCustomers = customers.filter(c => c.orders >= 2).length;
  const avgLifetimeValue = totalCustomers > 0 ? Math.round(customers.reduce((sum, c) => sum + c.spend, 0) / totalCustomers) : 0;

  return (
    <CustomersClientView 
      customers={customers} 
      stats={{
        totalCustomers,
        newThisMonth,
        repeatCustomers,
        avgLifetimeValue
      }} 
    />
  );
}
