import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "RAZORPAY_ENABLE",
            "RAZORPAY_KEY_ID",
            "STRIPE_ENABLE",
            "STRIPE_KEY_PUBLISHABLE",
            "COD_ENABLE",
            "FREE_DELIVERY_THRESHOLD",
            "SUBSCRIPTION_DISCOUNT",
          ],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const responseData = {
      razorpayEnable: settingsMap["RAZORPAY_ENABLE"] === "true",
      razorpayKeyId: settingsMap["RAZORPAY_KEY_ID"] || process.env.RAZORPAY_KEY_ID || "",
      stripeEnable: settingsMap["STRIPE_ENABLE"] === "true",
      stripeKeyPublishable: settingsMap["STRIPE_KEY_PUBLISHABLE"] || process.env.STRIPE_KEY_PUBLISHABLE || "",
      codEnable: settingsMap["COD_ENABLE"] !== "false", // Default to true if not configured
      freeDeliveryThreshold: parseFloat(settingsMap["FREE_DELIVERY_THRESHOLD"] || "499"),
      subscriptionDiscount: parseFloat(settingsMap["SUBSCRIPTION_DISCOUNT"] || "10"),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET payment config error:", error);
    return NextResponse.json({ error: "Failed to fetch payment config" }, { status: 500 });
  }
}
