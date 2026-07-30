import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, couponCode, pincode, deliveryDate, deliverySlotId, isSubscription, frequency, customDays } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in bag" }, { status: 400 });
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

    // Validate items and compute subtotal
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
        if (coupon.type === "PERCENTAGE") {
          couponDiscount = Math.round((subtotal * coupon.value) / 100);
        } else {
          couponDiscount = coupon.value;
        }
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

    // Determine customer state from pincode
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

    cleanItems.forEach((item: any) => {
      const v = variantProductMap.get(item.variantId);
      const gstRate = v?.product?.gstRate ?? 5;
      const productPackagingFee = v?.product?.packagingFee ?? 0;

      const itemSubtotal = item.price * item.quantity;
      const itemPackagingFee = productPackagingFee * item.quantity;
      const itemGstAmount = itemSubtotal * (gstRate / 100);

      totalPackagingFee += itemPackagingFee;
      totalTax += itemGstAmount;
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

    // Fetch payment settings from database
    const paymentSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ["RAZORPAY_ENABLE", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] } }
    });
    
    const paymentSettingsMap: Record<string, string> = {};
    paymentSettings.forEach((s) => {
      paymentSettingsMap[s.key] = s.value;
    });

    const isEnabled = paymentSettingsMap["RAZORPAY_ENABLE"] === "true";
    let keyId = paymentSettingsMap["RAZORPAY_KEY_ID"];
    let keySecret = paymentSettingsMap["RAZORPAY_KEY_SECRET"];

    // Fallback to process.env if db settings are missing
    if (!keyId || !keySecret) {
      keyId = process.env.RAZORPAY_KEY_ID || "";
      keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    }

    // Set subscription billing parameters if isSubscription is true
    let period = "weekly";
    let interval = 1;
    let totalCount = 13; // default to 13 weeks (approx 90 days)
    let billingAmount = totalAmount;

    if (isSubscription) {
      if (frequency === "DAILY") {
        period = "weekly";
        interval = 1;
        totalCount = 13;
        billingAmount = totalAmount * 7;
      } else if (frequency === "ALTERNATING") {
        period = "weekly";
        interval = 1;
        totalCount = 13;
        billingAmount = totalAmount * 4; // Billed weekly for 4 deliveries
      } else if (frequency === "WEEKLY") {
        period = "weekly";
        interval = 1;
        totalCount = 13;
        billingAmount = totalAmount;
      } else if (frequency === "CUSTOM_DAYS") {
        period = "weekly";
        interval = 1;
        totalCount = 13;
        const multiplier = Array.isArray(customDays) ? customDays.length : 1;
        billingAmount = totalAmount * multiplier;
      }
    }

    // If Razorpay is enabled and configured, create a real Razorpay Order or Subscription
    if (isEnabled && keyId && keySecret) {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      
      if (isSubscription) {
        try {
          // 1. Create dynamic Razorpay Plan
          const planRes = await fetch("https://api.razorpay.com/v1/plans", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${auth}`,
            },
            body: JSON.stringify({
              period,
              interval,
              item: {
                name: `Bakewell Subscription - ${frequency} (Billed Weekly)`,
                amount: Math.round(billingAmount * 100), // amount in paise
                currency: "INR",
              },
            }),
          });

          if (!planRes.ok) {
            const planErr = await planRes.text();
            console.error("Razorpay plan creation failed:", planErr);
            return NextResponse.json({ error: "Failed to create subscription plan" }, { status: 500 });
          }

          const rzpPlan = await planRes.json();

          // 2. Create Razorpay Subscription linked to the plan
          const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${auth}`,
            },
            body: JSON.stringify({
              plan_id: rzpPlan.id,
              total_count: totalCount,
              quantity: 1,
              customer_notify: 1,
            }),
          });

          if (!subRes.ok) {
            const subErr = await subRes.text();
            console.error("Razorpay subscription creation failed:", subErr);
            return NextResponse.json({ error: "Failed to initialize recurring subscription" }, { status: 500 });
          }

          const rzpSubscription = await subRes.json();

          return NextResponse.json({
            success: true,
            mode: "live",
            razorpaySubscriptionId: rzpSubscription.id,
            planId: rzpPlan.id,
            keyId: keyId,
          });
        } catch (err: any) {
          console.error("Razorpay Subscription API error:", err);
          return NextResponse.json({ error: "Razorpay Subscription API error: " + err.message }, { status: 500 });
        }
      } else {
        // Standard checkout order
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100), // amount in paise
            currency: "INR",
            receipt: `rcpt_${Math.floor(100000 + Math.random() * 900000)}`,
          }),
        });

        if (!rzpRes.ok) {
          const errorText = await rzpRes.text();
          console.error("Razorpay order creation failed:", errorText);
          return NextResponse.json({ error: "Failed to initialize payment gateway" }, { status: 500 });
        }

        const rzpOrder = await rzpRes.json();
        return NextResponse.json({
          success: true,
          mode: "live",
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: keyId,
        });
      }
    }

    // Otherwise, fallback to simulation mode for testing
    if (isSubscription) {
      return NextResponse.json({
        success: true,
        mode: "simulation",
        razorpaySubscriptionId: `sub_sim_${Math.floor(100000 + Math.random() * 900000)}`,
        planId: `plan_sim_${Math.floor(100000 + Math.random() * 900000)}`,
        keyId: "sim_key_id",
      });
    }

    return NextResponse.json({
      success: true,
      mode: "simulation",
      razorpayOrderId: `sim_order_${Math.floor(100000 + Math.random() * 900000)}`,
      amount: totalAmount * 100,
      currency: "INR",
      keyId: "sim_key_id",
    });

  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
