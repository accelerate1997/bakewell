import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  Truck, 
  ExternalLink,
  CheckCircle2,
  Clock,
  Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { OrderUpdateForm } from '@/components/admin/OrderUpdateForm';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: id },
        { orderNumber: id },
        { orderNumber: `#${id}` }
      ]
    },
    include: {
      user: { include: { addresses: true } },
      items: {
        include: {
          variant: { include: { product: true } }
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const address = order.user.addresses[0]?.fullAddress || "No address provided";

  const timeline = [
    { status: 'Order Placed', date: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), completed: true, current: order.status === 'PENDING' },
    { status: 'Confirmed', date: order.status !== 'PENDING' ? new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--', completed: order.status !== 'PENDING', current: order.status === 'CONFIRMED' },
    { status: 'Preparing', date: order.status === 'SHIPPED' || order.status === 'DELIVERED' ? new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--', completed: order.status === 'SHIPPED' || order.status === 'DELIVERED', current: order.status === 'SHIPPED' },
    { status: 'Shipped', date: order.status === 'SHIPPED' || order.status === 'DELIVERED' ? new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--', completed: order.status === 'SHIPPED' || order.status === 'DELIVERED', current: order.status === 'SHIPPED' },
    { status: 'Delivered', date: order.status === 'DELIVERED' ? new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--', completed: order.status === 'DELIVERED', current: order.status === 'DELIVERED' },
  ];

  const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = order.totalAmount - order.deliveryCharge + order.couponDiscount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/orders" 
            className="w-10 h-10 rounded-full border border-[#d4d9b8] flex items-center justify-center text-[#1a2c1a] hover:bg-white transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Order {order.orderNumber}</h1>
            <p className="text-[10px] text-[#8a8a7a] font-bold uppercase tracking-wider">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-[#E6F1FB] text-[#185FA5] border-none rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest">
            {order.status}
          </Badge>
          <Badge className="bg-[#EAF3DE] text-[#3B6D11] border-none rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest">
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left (65%) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Items Table */}
          <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
            <div className="p-6 border-b border-[#f0f2e8]">
              <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">Order Items ({totalQty})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f9faf6] text-[10px] uppercase tracking-widest border-b border-[#f0f2e8]">
                  <tr>
                    <th className="px-6 py-4 font-bold">Product</th>
                    <th className="px-6 py-4 font-bold text-center">Qty</th>
                    <th className="px-6 py-4 font-bold text-right">Unit Price</th>
                    <th className="px-6 py-4 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2e8]">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-[#f0f2e8] flex items-center justify-center text-xl border border-[#d4d9b8]/50 flex-shrink-0">
                            🍞
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#1a2c1a]">{item.variant.product.name}</p>
                            <p className="text-[10px] text-[#8a8a7a] font-bold uppercase">{item.variant.label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-xs font-bold">₹{item.unitPrice}</td>
                      <td className="px-6 py-4 text-right text-xs font-black text-[#1a2c1a]">₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-[#f9faf6] flex flex-col items-end gap-2">
              <div className="flex justify-between w-64 text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between w-64 text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest">
                <span>Delivery Charge</span>
                <span>₹{order.deliveryCharge}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between w-64 text-[10px] font-bold text-[#A32D2D] uppercase tracking-widest">
                  <span>Coupon Discount</span>
                  <span>-₹{order.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between w-64 pt-2 border-t border-[#d4d9b8] mt-2">
                <span className="text-sm font-black uppercase text-[#1a2c1a]">Grand Total</span>
                <span className="text-lg font-black text-[#3d5a2e]">₹{order.totalAmount}</span>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">Order Timeline</h3>
            <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#f0f2e8]">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-6 relative pl-8">
                  <div className={cn(
                    "absolute left-0 top-1 w-4 h-4 rounded-full border-2 z-10 flex items-center justify-center",
                    step.completed ? "bg-[#3B6D11] border-[#3B6D11]" : "bg-white border-[#d4d9b8]",
                    step.current && "animate-pulse ring-4 ring-[#3B6D11]/20"
                  )}>
                    {step.completed && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      step.completed ? "text-[#1a2c1a]" : "text-[#8a8a7a]"
                    )}>
                      {step.status}
                    </p>
                    <p className="text-[10px] font-bold text-[#8a8a7a]">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right (35%) */}
        <div className="space-y-8">
          
          {/* Customer Info */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#3d5a2e] flex items-center justify-center text-white text-xl font-black uppercase border border-[#3d5a2e]/20">
                {order.user.name ? order.user.name.charAt(0) : "?"}
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1a2c1a]">{order.user.name || "No name configured"}</h4>
                <p className="text-[10px] text-[#8a8a7a] font-bold uppercase">Customer</p>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {order.user.email && (
                <div className="flex items-center gap-3 text-xs text-[#1a2c1a] font-bold">
                  <Mail size={14} className="text-[#8a8a7a]" />
                  {order.user.email}
                </div>
              )}
              {order.user.phone && (
                <div className="flex items-center gap-3 text-xs text-[#1a2c1a] font-bold">
                  <Phone size={14} className="text-[#8a8a7a]" />
                  {order.user.phone}
                </div>
              )}
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#3d5a2e]" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1a2c1a]">Delivery Address</h4>
            </div>
            <p className="text-xs font-bold text-[#4a4a4a] leading-relaxed">
              {address}
            </p>
            <Link href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" className="inline-flex items-center gap-1 text-[10px] font-black text-[#3d5a2e] uppercase hover:underline">
              View on Maps <ExternalLink size={12} />
            </Link>
          </Card>

          {/* Payment Info */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[#3d5a2e]" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1a2c1a]">Payment Details</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8a8a7a] font-bold uppercase tracking-widest text-[9px]">Method</span>
                <span className="font-black text-[#1a2c1a]">{order.paymentMethod}</span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#8a8a7a] font-bold uppercase tracking-widest text-[9px]">ID</span>
                  <span className="font-mono text-[#1a2c1a]">{order.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-[#8a8a7a] font-bold uppercase tracking-widest text-[9px]">Status</span>
                <span className="text-[#3B6D11] font-black">{order.paymentStatus}</span>
              </div>
            </div>
          </Card>

          {/* Update Order */}
          <OrderUpdateForm order={order} />
        </div>
      </div>
    </div>
  );
}
