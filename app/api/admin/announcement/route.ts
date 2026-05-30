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

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["ANNOUNCEMENT_TEXT", "ANNOUNCEMENT_HIGHLIGHT", "ANNOUNCEMENT_LINK"],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      text: settingsMap["ANNOUNCEMENT_TEXT"] || "Get 10% OFF on your first order! Use code: FRESHBAKE",
      highlightText: settingsMap["ANNOUNCEMENT_HIGHLIGHT"] || "FRESHBAKE",
      linkUrl: settingsMap["ANNOUNCEMENT_LINK"] || "/shop",
    });
  } catch (error) {
    console.error("GET admin announcement error:", error);
    return NextResponse.json({ error: "Failed to fetch announcement settings" }, { status: 500 });
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
    const { text, highlightText, linkUrl } = body;

    const updates = [
      { key: "ANNOUNCEMENT_TEXT", value: text || "" },
      { key: "ANNOUNCEMENT_HIGHLIGHT", value: highlightText || "" },
      { key: "ANNOUNCEMENT_LINK", value: linkUrl || "" },
    ];

    for (const update of updates) {
      await prisma.systemSetting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST admin announcement error:", error);
    return NextResponse.json({ error: "Failed to save announcement settings" }, { status: 500 });
  }
}
