import { vi } from "vitest";

const shortLink = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("./db", () => ({ prisma: { shortLink } }));

import { getPublicLinkAnalytics } from "./analytics";

const link = {
  id: "link_123",
  code: "demo-link",
  destinationUrl: "https://example.com/",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

beforeEach(() => {
  shortLink.findUnique.mockReset();
});

test("aggregates and zero-fills non-contiguous UTC months", async () => {
  shortLink.findUnique.mockResolvedValue({
    ...link,
    clickEvents: [
      { clickedAt: new Date("2026-01-10T12:00:00.000Z"), deviceType: "desktop", browser: "Chrome" },
      { clickedAt: new Date("2026-01-31T23:59:00.000Z"), deviceType: "desktop", browser: "Chrome" },
      { clickedAt: new Date("2026-03-01T00:00:00.000Z"), deviceType: "mobile", browser: "Safari" },
      { clickedAt: new Date("2026-03-15T00:00:00.000Z"), deviceType: "other", browser: "Firefox" },
    ],
  });

  await expect(getPublicLinkAnalytics("Demo-Link", new Date("2026-03-20T00:00:00.000Z"))).resolves.toEqual({
    code: "demo-link",
    totalClicks: 4,
    monthlyClicks: [
      { month: "2026-01", clicks: 2 },
      { month: "2026-02", clicks: 0 },
      { month: "2026-03", clicks: 2 },
    ],
    devices: [
      { label: "desktop", clicks: 2 },
      { label: "mobile", clicks: 1 },
      { label: "other", clicks: 1 },
      { label: "tablet", clicks: 0 },
    ],
    browsers: [
      { label: "Chrome", clicks: 2 },
      { label: "Firefox", clicks: 1 },
      { label: "Safari", clicks: 1 },
    ],
  });
});

test("returns null for an unknown code", async () => {
  shortLink.findUnique.mockResolvedValue(null);

  await expect(getPublicLinkAnalytics("missing")).resolves.toBeNull();
});

test("returns a useful empty aggregate for a known link with no clicks", async () => {
  shortLink.findUnique.mockResolvedValue({ ...link, clickEvents: [] });

  await expect(getPublicLinkAnalytics("demo-link", new Date("2026-03-20T00:00:00.000Z"))).resolves.toEqual({
    code: "demo-link",
    totalClicks: 0,
    monthlyClicks: [],
    devices: [
      { label: "desktop", clicks: 0 },
      { label: "mobile", clicks: 0 },
      { label: "other", clicks: 0 },
      { label: "tablet", clicks: 0 },
    ],
    browsers: [],
  });
});
