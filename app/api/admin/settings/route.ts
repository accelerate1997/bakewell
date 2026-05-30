import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const responseData = {
      razorpayEnable: settingsMap["RAZORPAY_ENABLE"] === "true",
      razorpayKeyId: settingsMap["RAZORPAY_KEY_ID"] || "",
      razorpayKeySecret: settingsMap["RAZORPAY_KEY_SECRET"] ? "••••••••••••••••" : "",
      razorpayKeySecretConfigured: !!settingsMap["RAZORPAY_KEY_SECRET"],

      stripeEnable: settingsMap["STRIPE_ENABLE"] === "true",
      stripeKeyPublishable: settingsMap["STRIPE_KEY_PUBLISHABLE"] || "",
      stripeKeySecret: settingsMap["STRIPE_KEY_SECRET"] ? "••••••••••••••••" : "",
      stripeKeySecretConfigured: !!settingsMap["STRIPE_KEY_SECRET"],

      codEnable: settingsMap["COD_ENABLE"] !== "false", // Default to true if not configured
      storeState: settingsMap["STORE_STATE"] || "Karnataka",
      storeGstin: settingsMap["STORE_GSTIN"] || "",
      defaultPackagingFee: settingsMap["DEFAULT_PACKAGING_FEE"] || "0",
      freeDeliveryThreshold: settingsMap["FREE_DELIVERY_THRESHOLD"] || "499",
      subscriptionDiscount: settingsMap["SUBSCRIPTION_DISCOUNT"] || "10",
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET admin settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role?.toUpperCase();
    if (!isDev && (!session || role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpayEnable,
      razorpayKeyId,
      razorpayKeySecret,
      stripeEnable,
      stripeKeyPublishable,
      stripeKeySecret,
      codEnable,
      storeState,
      storeGstin,
      defaultPackagingFee,
      freeDeliveryThreshold,
      subscriptionDiscount,
    } = body;

    const updates: { key: string; value: string }[] = [
      { key: "RAZORPAY_ENABLE", value: String(!!razorpayEnable) },
      { key: "RAZORPAY_KEY_ID", value: razorpayKeyId || "" },
      { key: "STRIPE_ENABLE", value: String(!!stripeEnable) },
      { key: "STRIPE_KEY_PUBLISHABLE", value: stripeKeyPublishable || "" },
      { key: "COD_ENABLE", value: String(codEnable !== false) },
      { key: "STORE_STATE", value: storeState || "Karnataka" },
      { key: "STORE_GSTIN", value: storeGstin || "" },
      { key: "DEFAULT_PACKAGING_FEE", value: defaultPackagingFee || "0" },
      { key: "FREE_DELIVERY_THRESHOLD", value: freeDeliveryThreshold || "499" },
      { key: "SUBSCRIPTION_DISCOUNT", value: subscriptionDiscount || "10" },
    ];

    // Mask check: Only update secret if it does not contain bullet markers (meaning the user updated it)
    if (razorpayKeySecret && !razorpayKeySecret.includes("••") && !razorpayKeySecret.includes("••")) {
      updates.push({ key: "RAZORPAY_KEY_SECRET", value: razorpayKeySecret });
    }
    if (stripeKeySecret && !stripeKeySecret.includes("••") && !stripeKeySecret.includes("••")) {
      updates.push({ key: "STRIPE_KEY_SECRET", value: stripeKeySecret });
    }

    // Save settings to database
    for (const update of updates) {
      await prisma.systemSetting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST admin settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
