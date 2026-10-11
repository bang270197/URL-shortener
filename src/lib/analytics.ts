import { DeviceType } from "@prisma/client";
import { UAParser } from "ua-parser-js";

import { prisma } from "./db";
import { normalizeCode } from "./validation";

const BOT_PATTERN = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|preview/i;

export type UserAgentClassification = {
  isBot: boolean;
  deviceType: DeviceType;
  browser: string;
};

function normalizeBrowser(name: string | undefined): string {
  if (!name) return "Other";
  if (/edge/i.test(name)) return "Edge";
  if (/chrome|chromium/i.test(name)) return "Chrome";
  if (/firefox/i.test(name)) return "Firefox";
  if (/safari/i.test(name)) return "Safari";
  return "Other";
}

function normalizeDevice(type: string | undefined, userAgent: string): DeviceType {
  if (type === "mobile") return DeviceType.mobile;
  if (type === "tablet" || /\btablet\b|\biPad\b/i.test(userAgent)) return DeviceType.tablet;
  return userAgent ? DeviceType.desktop : DeviceType.other;
}

export function classifyUserAgent(userAgent: string | null): UserAgentClassification {
  const value = userAgent ?? "";
  const parsed = new UAParser(value);

  return {
    isBot: BOT_PATTERN.test(value),
    deviceType: normalizeDevice(parsed.getDevice().type, value),
    browser: normalizeBrowser(parsed.getBrowser().name),
  };
}

export async function recordClick(shortLinkId: string, userAgent: string | null): Promise<void> {
  const classification = classifyUserAgent(userAgent);
  if (classification.isBot) return;

  await prisma.clickEvent.create({
    data: {
      shortLinkId,
      deviceType: classification.deviceType,
      browser: classification.browser,
    },
  });
}

export type AnalyticsBreakdown = {
  label: string;
  clicks: number;
};

export type PublicLinkAnalytics = {
  code: string;
  totalClicks: number;
  monthlyClicks: Array<{ month: string; clicks: number }>;
  devices: AnalyticsBreakdown[];
  browsers: AnalyticsBreakdown[];
};

function sortBreakdown(counts: Map<string, number>): AnalyticsBreakdown[] {
  return [...counts.entries()]
    .map(([label, clicks]) => ({ label, clicks }))
    .sort((left, right) => right.clicks - left.clicks || left.label.localeCompare(right.label));
}

function getMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function createMonthlySeries(counts: Map<string, number>, now: Date) {
  const firstMonth = [...counts.keys()].sort()[0];
  if (!firstMonth) return [];

  const [year, month] = firstMonth.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, 1));
  const finalMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const series: Array<{ month: string; clicks: number }> = [];

  while (cursor <= finalMonth) {
    const key = getMonthKey(cursor);
    series.push({ month: key, clicks: counts.get(key) ?? 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return series;
}

export async function getPublicLinkAnalytics(
  code: string,
  now = new Date(),
): Promise<PublicLinkAnalytics | null> {
  const link = await prisma.shortLink.findUnique({
    where: { code: normalizeCode(code) },
    include: {
      clickEvents: {
        select: { clickedAt: true, deviceType: true, browser: true },
      },
    },
  });

  if (!link) return null;

  const monthlyCounts = new Map<string, number>();
  const deviceCounts = new Map<string, number>(Object.values(DeviceType).map((type) => [type, 0]));
  const browserCounts = new Map<string, number>();

  for (const event of link.clickEvents) {
    const month = getMonthKey(event.clickedAt);
    monthlyCounts.set(month, (monthlyCounts.get(month) ?? 0) + 1);
    deviceCounts.set(event.deviceType, (deviceCounts.get(event.deviceType) ?? 0) + 1);
    browserCounts.set(event.browser, (browserCounts.get(event.browser) ?? 0) + 1);
  }

  return {
    code: link.code,
    totalClicks: link.clickEvents.length,
    monthlyClicks: createMonthlySeries(monthlyCounts, now),
    devices: sortBreakdown(deviceCounts),
    browsers: sortBreakdown(browserCounts),
  };
}
