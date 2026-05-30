import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      name,
      email,
      phone,
      fullAddress,
      pincode,
      deliveryDate,
      deliverySlotId,
      paymentMethod,
      couponCode,
      items,
      mode,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !name || !phone || !fullAddress || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required verification data" }, { status: 400 });
    }

    // 1. Payment Verification
    if (mode === "live") {
      // Fetch Razorpay credentials from database or process.env
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

      // Cryptographically verify Razorpay signature
      const hash = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (hash !== razorpaySignature) {
        console.error("Razorpay Signature mismatch!");
        return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
      }
    } else {
      // In simulation mode, we skip signature checks and proceed
      console.log("Verified simulated payment:", razorpayPaymentId);
    }

    // 2. Order Finalization
    let parsedDeliveryDate: Date | null = null;
    if (deliveryDate && deliverySlotId) {
      parsedDeliveryDate = new Date(deliveryDate);
    }

    // Resolve valid variant IDs
    const validVariants = await prisma.productVariant.findMany({
      where: { id: { in: items.map((i: any) => i.variantId) } }
    });
    const validVariantIds = new Set(validVariants.map(v => v.id));

    let fallbackVariant = null;
    if (items.some((i: any) => !validVariantIds.has(i.variantId))) {
      fallbackVariant = await prisma.productVariant.findFirst();
    }

    const cleanItems = items.map((item: any) => {
      const isValid = validVariantIds.has(item.variantId);
      const chosenVariantId = isValid ? item.variantId : (fallbackVariant?.id || item.variantId);
      return {
        ...item,
        variantId: chosenVariantId,
      };
    });

    // Calculate subtotal
    let subtotal = 0;
    for (const item of cleanItems) {
      subtotal += item.price * item.quantity;
    }

    // Validate coupon
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) >= new Date())) {
        // Validate user usage limit
        const usageCount = await prisma.order.count({
          where: {
            userId,
            couponCode: coupon.code,
            status: { not: "CANCELLED" }
          }
        });
        if (usageCount >= coupon.perUserLimit) {
          return NextResponse.json({ error: "You have already used this coupon code" }, { status: 400 });
        }

        if (coupon.type === "PERCENTAGE") {
          couponDiscount = Math.round((subtotal * coupon.value) / 100);
        } else {
          couponDiscount = coupon.value;
        }

        // Increment coupon used count
        await prisma.coupon.update({
          where: { code: coupon.code },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Fetch store settings for tax & packaging
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const storeState = settingsMap["STORE_STATE"] || "Karnataka";
    const globalPackagingFee = parseFloat(settingsMap["DEFAULT_PACKAGING_FEE"] || "0");
    const freeDeliveryThreshold = parseFloat(settingsMap["FREE_DELIVERY_THRESHOLD"] || "499");

    // Fetch product variants and product info for tax and packaging fee overrides
    const variantsWithProducts = await prisma.productVariant.findMany({
      where: { id: { in: cleanItems.map((i: any) => i.variantId) } },
      include: { product: true }
    });
    const variantProductMap = new Map(variantsWithProducts.map(v => [v.id, v]));

    // Determine customer state from pincode or address analysis
    let customerState = "Karnataka";
    let pinRecord = null;
    let resolvedPincode = pincode;

    if (!resolvedPincode && fullAddress) {
      // Try to parse 6-digit pincode from address
      const matches = fullAddress.match(/\b\d{6}\b/);
      if (matches) {
        resolvedPincode = matches[0];
      }
    }

    if (resolvedPincode) {
      const cleanPincode = resolvedPincode.trim();
      pinRecord = await prisma.serviceablePincode.findUnique({
        where: { pincode: cleanPincode },
      });
      if (pinRecord) {
        customerState = pinRecord.state;
      }
    }

    // Determine delivery charge based on pincode serviceability
    let deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : 50;
    if (resolvedPincode) {
      if (pinRecord && pinRecord.isActive) {
        deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : pinRecord.deliveryCharge;
      } else {
        const activeCount = await prisma.serviceablePincode.count({
          where: { isActive: true },
        });
        if (activeCount === 0) {
          deliveryCharge = 0; // fallback mode free delivery
        }
      }
    }

    // Calculate packaging fee and tax breakdown per item
    let totalPackagingFee = globalPackagingFee;
    let totalTax = 0;

    const enrichedItems = cleanItems.map((item: any) => {
      const v = variantProductMap.get(item.variantId);
      const gstRate = v?.product?.gstRate ?? 5;
      const productPackagingFee = v?.product?.packagingFee ?? 0;

      const itemSubtotal = item.price * item.quantity;
      const itemPackagingFee = productPackagingFee * item.quantity;
      const itemGstAmount = itemSubtotal * (gstRate / 100);

      totalPackagingFee += itemPackagingFee;
      totalTax += itemGstAmount;

      return {
        ...item,
        gstRateApplied: gstRate,
        gstAmount: itemGstAmount,
      };
    });

    // GST split calculation
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (customerState.trim().toLowerCase() === storeState.trim().toLowerCase()) {
      cgstAmount = Math.round(totalTax * 100) / 100 / 2;
      sgstAmount = Math.round(totalTax * 100) / 100 / 2;
      totalTax = cgstAmount + sgstAmount;
    } else {
      igstAmount = Math.round(totalTax * 100) / 100;
      totalTax = igstAmount;
    }

    const totalAmount = subtotal - couponDiscount + deliveryCharge + totalPackagingFee + totalTax;
    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update user's name/phone if not already set (without conflicting with other users)
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (currentUser) {
      const updateData: any = {};
      if (!currentUser.name && name) updateData.name = name;
      if (!currentUser.phone && phone) {
        const phoneExists = await prisma.user.findUnique({ where: { phone } });
        if (!phoneExists) {
          updateData.phone = phone;
        }
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });
      }
    }

    // Record Delivery Address linked to User (if it doesn't already exist for this user)
    const normalizedNewAddress = fullAddress.trim().replace(/\s+/g, ' ').toLowerCase();
    const existingAddresses = await prisma.address.findMany({
      where: { userId },
    });
    const matchingAddress = existingAddresses.find(addr => 
      addr.fullAddress.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedNewAddress
    );

    if (!matchingAddress) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
      await prisma.address.create({
        data: {
          userId,
          fullAddress: fullAddress.trim(),
          isDefault: true,
        },
      });
    } else if (!matchingAddress.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
      await prisma.address.update({
        where: { id: matchingAddress.id },
        data: { isDefault: true },
      });
    }

    // Write Order and Items linked to User
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        totalAmount,
        deliveryCharge,
        couponDiscount,
        couponCode: couponCode ? couponCode.toUpperCase() : null,
        packagingFee: totalPackagingFee,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalTax,
        deliveryDate: parsedDeliveryDate,
        deliverySlotId: deliverySlotId || null,
        paymentMethod: paymentMethod || "CARD",
        paymentStatus: "PAID",
        paymentId: razorpayPaymentId,
        status: "PENDING",
        items: {
          create: enrichedItems.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            gstRateApplied: item.gstRateApplied,
            gstAmount: item.gstAmount,
          })),
        },
      },
    });

    // Decrement inventory stock
    for (const item of cleanItems) {
      try {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } catch (stockErr) {
        console.warn(`Could not decrement stock for variant ${item.variantId}`, stockErr);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Verification and finalize checkout error:", error);
    return NextResponse.json({ error: "Failed to finalize order verification" }, { status: 500 });
  }
}
