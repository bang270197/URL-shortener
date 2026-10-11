import { DeviceType } from "@prisma/client";
import { UAParser } from "ua-parser-js";

import { prisma } from "./db";

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
