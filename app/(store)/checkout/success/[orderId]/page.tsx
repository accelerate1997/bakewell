import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CheckCircle2, Package, Truck, ArrowRight, MapPin, Calendar } from "lucide-react";

export const revalidate = 0; // Don't cache success page

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        include: { addresses: true },
      },
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const address = order.user.addresses[0]?.fullAddress || "No address provided";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Success Header Card */}
      <div className="bg-[#1a2c1a] rounded-3xl p-8 sm:p-16 text-white text-center relative overflow-hidden shadow-xl space-y-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c8872a_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="w-20 h-20 bg-[#c8872a] rounded-full flex items-center justify-center mx-auto shadow-lg relative z-10">
          <CheckCircle2 className="w-12 h-12 text-[#1a2c1a]" />
        </div>

        <div className="relative z-10 space-y-2">
          <span className="bg-[#3d5a2e] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block">
            Order Confirmed
          </span>
          <h1 className="font-playfair font-black text-3xl sm:text-5xl uppercase tracking-tight">
            Thank You For Your Order!
          </h1>
          <p className="text-[#e8ead8] text-sm sm:text-base max-w-lg mx-auto">
            We have received your order and our master bakers are already prepping your fresh batch.
          </p>
        </div>

        {/* Order Number Strip */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md mx-auto flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#e8ead8] block">Order Tracking Number</span>
            <span className="font-mono font-bold text-2xl text-[#c8872a]">{order.orderNumber}</span>
          </div>
          <div className="text-right border-l border-white/20 pl-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#e8ead8] block">Payment Method</span>
            <span className="font-bold text-lg text-white uppercase">{order.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Two Column Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Order Summary */}
        <div className="bg-white border border-[#d4d9b8] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-playfair font-bold text-xl text-[#1a2c1a] uppercase tracking-wider border-b border-[#f0f2e8] pb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#c8872a]" />
            Items Ordered ({order.items.reduce((acc, item) => acc + item.quantity, 0)})
          </h3>

          <div className="space-y-4 divide-y divide-[#f0f2e8]">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                <div className="relative w-16 h-16 rounded-lg bg-[#f0f2e8] overflow-hidden flex-shrink-0 border border-[#d4d9b8]">
                  {item.variant.product.images[0] ? (
                    <Image src={item.variant.product.images[0]} alt={item.variant.product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🍞</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-[#1a2c1a] text-sm leading-tight">{item.variant.product.name}</h4>
                    <p className="text-xs font-semibold text-[#c8872a] mt-0.5">{item.variant.label}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-[#4a4a4a]">
                    <span>Qty: {item.quantity}</span>
                    <span className="text-[#1a2c1a] text-sm">₹{item.totalPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-[#f0f2e8] space-y-3 text-sm text-[#4a4a4a]">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-bold text-[#1a2c1a]">₹{order.totalAmount - order.deliveryCharge + order.couponDiscount}</span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between items-center text-[#3d5a2e] font-bold">
                <span>Coupon Discount</span>
                <span>- ₹{order.couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Delivery Charges</span>
              <span className="font-bold text-[#1a2c1a]">
                {order.deliveryCharge === 0 ? <span className="text-[#3d5a2e]">FREE</span> : `₹${order.deliveryCharge}`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-[#d4d9b8] text-[#1a2c1a]">
              <span className="text-base font-bold uppercase tracking-wider">Total Paid / Payable</span>
              <span className="font-playfair font-black text-3xl text-[#1a2c1a]">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Shipping Details */}
        <div className="space-y-8">
          <div className="bg-white border border-[#d4d9b8] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-playfair font-bold text-xl text-[#1a2c1a] uppercase tracking-wider border-b border-[#f0f2e8] pb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#c8872a]" />
              Delivery Information
            </h3>

            <div className="space-y-4 text-sm text-[#4a4a4a]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#3d5a2e] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1a2c1a] block mb-0.5">{order.user.name || "Customer"}</span>
                  <p className="leading-relaxed">{address}</p>
                  {order.user.phone && <p className="text-xs text-[#8a8a7a] mt-1">Phone: {order.user.phone}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#f0f2e8]">
                <Calendar className="w-5 h-5 text-[#3d5a2e] flex-shrink-0" />
                <div>
                  <span className="font-bold text-[#1a2c1a] block mb-0.5">Estimated Delivery</span>
                  <p className="text-xs text-[#8a8a7a]">Today, within 2-3 hours of fresh batch baking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-[#3d5a2e] rounded-2xl p-8 text-white text-center space-y-4 shadow-lg">
            <h4 className="font-playfair font-black text-2xl uppercase tracking-tight">Craving More Fresh Bakes?</h4>
            <p className="text-xs text-[#e8ead8] max-w-xs mx-auto">Explore our other categories for upcoming evening batches and weekend specials.</p>
            <Link href="/products" className="inline-block pt-2">
              <Button className="bg-[#c8872a] hover:bg-[#e8a845] text-[#1a2c1a] font-black uppercase tracking-widest px-8 py-6 rounded-full shadow-lg transition-all">
                Continue Shopping <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
