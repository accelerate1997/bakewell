import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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
    console.error("GET store announcement error:", error);
    return NextResponse.json({ error: "Failed to fetch announcement settings" }, { status: 500 });
  }
}
