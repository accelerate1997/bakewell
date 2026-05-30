"use client"

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Clock,
  AlertCircle,
  Truck,
  PackageCheck,
  RefreshCw,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: "bg-[#FAEEDA] text-[#854F0B]",
  confirmed: "bg-[#E6F1FB] text-[#185FA5]",
  shipped: "bg-[#EEEDFE] text-[#534AB7]",
  delivered: "bg-[#EAF3DE] text-[#3B6D11]",
  cancelled: "bg-[#FCEBEB] text-[#A32D2D]",
};

const paymentStyles: Record<string, string> = {
  UPI: "bg-blue-50 text-blue-600",
  CARD: "bg-purple-50 text-purple-600",
  COD: "bg-amber-50 text-amber-600",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // More Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        toast.error('Failed to load orders');
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders match the current filters to export");
      return;
    }
    const headers = 'Order ID,Customer,Phone,Date,Items Count,Total Amount,Payment Method,Payment Status,Status\n';
    const rows = filteredOrders.map(order => {
      const orderId = order.orderNumber || '';
      const customer = order.user?.name || 'Guest';
      const phone = order.user?.phone || 'N/A';
      const date = new Date(order.createdAt).toISOString();
      const itemsCount = order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
      const totalAmount = order.totalAmount || 0;
      const paymentMethod = order.paymentMethod || '';
      const paymentStatus = order.paymentStatus || '';
      const status = order.status || '';
      
      const cleanField = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
      return `${cleanField(orderId)},${cleanField(customer)},${cleanField(phone)},${cleanField(date)},${itemsCount},${totalAmount},${cleanField(paymentMethod)},${cleanField(paymentStatus)},${cleanField(status)}`;
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `dailybake_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Successfully exported ${filteredOrders.length} orders to CSV!`);
  };

  const handleResetFilters = () => {
    setFilterPaymentMethod('all');
    setFilterMinAmount('');
    setFilterMaxAmount('');
    setFilterStartDate('');
    setFilterEndDate('');
    toast.success("Filters reset successfully");
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status.toLowerCase() === activeTab;
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.user?.phone?.includes(searchQuery);

    // Advanced filters
    const matchesPayment = filterPaymentMethod === 'all' || order.paymentMethod === filterPaymentMethod;

    const orderAmt = order.totalAmount || 0;
    const matchesMinAmt = !filterMinAmount || orderAmt >= parseFloat(filterMinAmount);
    const matchesMaxAmt = !filterMaxAmount || orderAmt <= parseFloat(filterMaxAmount);

    const orderDate = new Date(order.createdAt);
    const matchesStartDate = !filterStartDate || orderDate >= new Date(filterStartDate + "T00:00:00");
    const matchesEndDate = !filterEndDate || orderDate <= new Date(filterEndDate + "T23:59:59");

    return matchesTab && matchesSearch && matchesPayment && matchesMinAmt && matchesMaxAmt && matchesStartDate && matchesEndDate;
  });

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Orders</h1>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">Manage customer orders and fulfillment</p>
        </div>
        <Button 
          onClick={handleExportCSV}
          variant="outline" 
          className="border-[#d4d9b8] gap-2 uppercase text-xs font-bold tracking-widest h-10"
        >
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: Clock, color: "text-[#1a2c1a]" },
          { label: "Pending", value: pendingCount, icon: AlertCircle, color: "text-[#c8872a]" },
          { label: "Shipped", value: shippedCount, icon: Truck, color: "text-[#185FA5]" },
          { label: "Delivered", value: deliveredCount, icon: PackageCheck, color: "text-[#3B6D11]" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">{stat.label}</p>
              <h4 className={cn("text-xl font-black mt-0.5", stat.color)}>{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b border-[#d4d9b8] w-full justify-start rounded-none h-auto p-0 gap-8">
            {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab.toLowerCase()}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3d5a2e] data-[state=active]:bg-transparent px-0 py-3 text-xs font-bold uppercase tracking-widest text-[#8a8a7a] data-[state=active]:text-[#3d5a2e]"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
            <Input 
              placeholder="Search Order ID or customer name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-[#d4d9b8] bg-white text-sm" 
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={cn("border-[#d4d9b8] gap-2 h-10 px-6 font-bold uppercase tracking-wider text-xs bg-white text-[#1a2c1a] hover:bg-[#f0f2e8]", showFilters && "bg-[#f0f2e8]")}
            >
              <Filter size={16} />
              More Filters
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchOrders}
              className="h-10 w-10 text-[#1a2c1a] hover:bg-[#f0f2e8]"
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        {showFilters && (
          <Card className="p-4 border-[#d4d9b8] bg-[#f9faf6] rounded-[8px] shadow-none space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Payment Method</label>
                <Select value={filterPaymentMethod} onValueChange={(val: any) => setFilterPaymentMethod(val || 'all')}>
                  <SelectTrigger className="h-9 border-[#d4d9b8] bg-white text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent className="border-[#d4d9b8]">
                    <SelectItem value="all" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">All Methods</SelectItem>
                    <SelectItem value="UPI" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">UPI</SelectItem>
                    <SelectItem value="CARD" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">CARD</SelectItem>
                    <SelectItem value="COD" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">COD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Amount */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Min Amount (₹)</label>
                <Input 
                  type="number"
                  placeholder="Min"
                  value={filterMinAmount}
                  onChange={(e) => setFilterMinAmount(e.target.value)}
                  className="h-9 border-[#d4d9b8] bg-white text-xs font-semibold"
                />
              </div>

              {/* Max Amount */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Max Amount (₹)</label>
                <Input 
                  type="number"
                  placeholder="Max"
                  value={filterMaxAmount}
                  onChange={(e) => setFilterMaxAmount(e.target.value)}
                  className="h-9 border-[#d4d9b8] bg-white text-xs font-semibold"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Start Date</label>
                <Input 
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="h-9 border-[#d4d9b8] bg-white text-xs font-semibold"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">End Date</label>
                <Input 
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="h-9 border-[#d4d9b8] bg-white text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaf0e2]">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleResetFilters}
                className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a] hover:bg-[#f0f2e8]"
              >
                Reset Filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Orders Table */}
      <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-center">Items</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 font-bold text-center">Payment</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2e8]">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#8a8a7a]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3d5a2e]" />
                      <p className="text-xs font-bold uppercase tracking-wider">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs font-bold text-[#8a8a7a] uppercase tracking-wider">
                    No orders found
                  </td>
                </tr>
              ) : filteredOrders.map((order, i) => (
                <tr 
                  key={order.id} 
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", 
                    "hover:bg-[#f0f2e8]"
                  )}
                >
                  <td className="px-6 py-4 text-xs font-mono font-bold text-[#3d5a2e]">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f0f2e8] flex items-center justify-center font-bold text-xs text-[#3d5a2e]">
                        {order.user?.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#1a2c1a]">{order.user?.name || 'Guest'}</p>
                        <p className="text-[10px] text-[#8a8a7a] font-bold">{order.user?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-[#8a8a7a] font-bold">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="rounded-full border-[#d4d9b8] text-[10px] font-bold px-2 py-0">
                        {order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0} items
                      </Badge>
                      <div className="text-[10px] text-gray-600 font-semibold max-w-[180px] space-y-0.5 mt-0.5">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="truncate" title={`${item.variant?.product?.name} (${item.variant?.label}) x${item.quantity}`}>
                            {item.variant?.product?.name} ({item.variant?.label}) <span className="text-[#c8872a]">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black">₹{order.totalAmount}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge className={cn("rounded-sm border-none px-2 py-0.5 text-[9px] font-black uppercase", paymentStyles[order.paymentMethod] || "bg-gray-100 text-gray-800")}>
                      {order.paymentMethod}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={cn("rounded-full border-none px-3 py-0.5 text-[10px] font-bold uppercase", statusStyles[order.status.toLowerCase()] || "bg-gray-100 text-gray-800")}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1a2c1a] hover:bg-[#f0f2e8]">
                          <Eye size={14} />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
