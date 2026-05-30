"use client"

import { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/admin/StatCard';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: "bg-[#FAEEDA] text-[#854F0B]",
  confirmed: "bg-[#E6F1FB] text-[#185FA5]",
  shipped: "bg-[#EEEDFE] text-[#534AB7]",
  delivered: "bg-[#EAF3DE] text-[#3B6D11]",
  cancelled: "bg-[#FCEBEB] text-[#A32D2D]",
};

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState('30D');

  const fetchOverview = async (range: string) => {
    try {
      const res = await fetch(`/api/admin/overview?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to load overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(chartRange);
  }, [chartRange]);

  const handleRangeChange = (newRange: string) => {
    setChartRange(newRange);
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#3d5a2e]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#8a8a7a]">Loading dashboard metrics...</p>
      </div>
    );
  }

  const formatDelta = (val: number) => {
    if (!val) return "0%";
    return val >= 0 ? `+${val.toFixed(0)}%` : `${val.toFixed(0)}%`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Revenue"
          value={`₹${(data?.revenue || 0).toLocaleString('en-IN')}`}
          delta={formatDelta(data?.revenueChange)}
          isPositive={data?.revenueChange >= 0}
          icon={IndianRupee}
          iconBg="#EAF3DE"
          iconColor="#3B6D11"
          title="Revenue"
        />
        <StatCard 
          label="Total Orders"
          value={(data?.orders || 0).toString()}
          delta={formatDelta(data?.ordersChange)}
          isPositive={data?.ordersChange >= 0}
          icon={ShoppingCart}
          iconBg="#E6F1FB"
          iconColor="#185FA5"
          title="Orders"
        />
        <StatCard 
          label="Total Customers"
          value={(data?.customers || 0).toString()}
          delta={formatDelta(data?.customersChange)}
          isPositive={data?.customersChange >= 0}
          icon={Users}
          iconBg="#FAEEDA"
          iconColor="#854F0B"
          title="Customers"
        />
        <StatCard 
          label="Avg Order Value"
          value={`₹${Math.round(data?.avgOrderValue || 0)}`}
          delta={formatDelta(data?.avgValueChange)}
          isPositive={data?.avgValueChange >= 0}
          icon={TrendingUp}
          iconBg="#EEEDFE"
          iconColor="#534AB7"
          title="Avg Value"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        <RevenueChart 
          data={data?.chartData || []} 
          range={chartRange}
          onRangeChange={handleRangeChange}
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-3 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex flex-col">
          <div className="p-6 border-b border-[#f0f2e8] flex items-center justify-between">
            <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs font-bold text-[#3d5a2e] hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3 font-bold">Order ID</th>
                  <th className="px-6 py-3 font-bold">Customer</th>
                  <th className="px-6 py-3 font-bold">Total</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2e8]">
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order: any, i: number) => (
                    <tr key={order.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", "hover:bg-[#f0f2e8] transition-colors")}>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-[#3d5a2e]">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-xs font-bold text-[#1a2c1a]">{order.customer}</td>
                      <td className="px-6 py-4 text-xs font-bold">₹{order.total}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn("rounded-full border-none px-3 py-0.5 text-[10px] font-bold uppercase", statusStyles[order.status] || "bg-gray-100 text-gray-800")}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-[#8a8a7a] font-bold">{order.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-[#8a8a7a] font-bold uppercase">No recent orders placed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="lg:col-span-2 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
          <div className="p-6 border-b border-[#f0f2e8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">Low Stock Alerts</h3>
              {data?.totalLowStockCount > 0 && (
                <Badge className="bg-[#A32D2D] text-white rounded-full px-2 py-0.5 text-[10px]">
                  {data.totalLowStockCount}
                </Badge>
              )}
            </div>
            <Link href="/admin/inventory" className="text-xs font-bold text-[#3d5a2e] hover:underline">
              Inventory
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {data?.lowStockItems && data.lowStockItems.length > 0 ? (
              data.lowStockItems.map((item: any) => (
                <div key={`${item.name}-${item.variant}`} className="flex items-center justify-between p-3 rounded-md bg-[#f9faf6] border border-[#f0f2e8]">
                  <div>
                    <p className="text-xs font-bold text-[#1a2c1a]">{item.name}</p>
                    <p className="text-[10px] text-[#8a8a7a]">{item.variant}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-black",
                        item.stock < 5 ? "text-[#A32D2D]" : "text-[#c8872a]"
                      )}>
                        {item.stock}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-[#8a8a7a]">In Stock</p>
                    </div>
                    <Link href="/admin/inventory">
                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-[#3d5a2e] text-[#3d5a2e] hover:bg-[#3d5a2e] hover:text-white">
                        Update
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#8a8a7a] font-bold uppercase">All inventory is fully stocked! 🎉</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
