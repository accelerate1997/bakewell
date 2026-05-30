import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const { name, email, phone, fullAddress, pincode, paymentMethod, couponCode, items, deliveryDate, deliverySlotId, quoteOnly } = body;

    if (!quoteOnly && (!name || !phone || !fullAddress || !items || items.length === 0)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (quoteOnly && (!items || items.length === 0)) {
      return NextResponse.json({ error: "Missing items in bag" }, { status: 400 });
    }

    // Validate delivery slot if provided
    let parsedDeliveryDate: Date | null = null;
    if (deliveryDate && deliverySlotId) {
      parsedDeliveryDate = new Date(deliveryDate);
      if (isNaN(parsedDeliveryDate.getTime())) {
        return NextResponse.json({ error: "Invalid delivery date" }, { status: 400 });
      }

      // Check slot existence and active status
      const slot = await prisma.deliverySlot.findUnique({
        where: { id: deliverySlotId },
      });

      if (!slot || !slot.isActive) {
        return NextResponse.json({ error: "Selected delivery slot is inactive or invalid" }, { status: 400 });
      }

    }

    // Verify that all variantIds exist in the database. If an old localStorage item has an invalid/mock variantId, find a fallback valid variant to prevent 500 error
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

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of cleanItems) {
      subtotal += item.price * item.quantity;
    }

    // Check coupon discount
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
    if (pincode) {
      const cleanPincode = pincode.trim();
      pinRecord = await prisma.serviceablePincode.findUnique({
        where: { pincode: cleanPincode },
      });
      if (pinRecord) {
        customerState = pinRecord.state;
      }
    }

    // Determine delivery charge based on pincode serviceability
    let deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : 50;
    if (pincode) {
      if (pinRecord && pinRecord.isActive) {
        deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : pinRecord.deliveryCharge;
        if (paymentMethod === "COD" && !pinRecord.codAvailable) {
          return NextResponse.json({ error: "Cash on Delivery is not available for this pincode" }, { status: 400 });
        }
      } else {
        const activeCount = await prisma.serviceablePincode.count({
          where: { isActive: true },
        });
        if (activeCount === 0) {
          deliveryCharge = 0; // fallback mode free delivery
        } else {
          return NextResponse.json({ error: "Shipping pincode is not serviceable" }, { status: 400 });
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

    if (quoteOnly) {
      return NextResponse.json({
        success: true,
        subtotal,
        couponDiscount,
        deliveryCharge,
        packagingFee: totalPackagingFee,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalTax,
        totalAmount,
        customerState,
        storeState,
      });
    }

    // Generate unique order number
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

    // Create Address linked to User (if it doesn't already exist for this user)
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

    // Create Order with Items linked to User
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
        paymentMethod: paymentMethod || "COD",
        paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
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

    // Decrement stock for variants
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
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 });
  }
}
