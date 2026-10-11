import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const analytics = vi.hoisted(() => ({ getPublicLinkAnalytics: vi.fn() }));
const navigation = vi.hoisted(() => ({ notFound: vi.fn(() => { throw new Error("not found"); }) }));

vi.mock("@/lib/analytics", () => analytics);
vi.mock("next/navigation", () => navigation);

import StatsPage from "./page";

const zeroAnalytics = {
  code: "demo",
  totalClicks: 0,
  monthlyClicks: [],
  devices: [
    { label: "desktop", clicks: 0 },
    { label: "mobile", clicks: 0 },
    { label: "other", clicks: 0 },
    { label: "tablet", clicks: 0 },
  ],
  browsers: [],
};

beforeEach(() => {
  analytics.getPublicLinkAnalytics.mockReset();
  navigation.notFound.mockClear();
});

test("renders code, total, chart summary, and device/browser lists", async () => {
  analytics.getPublicLinkAnalytics.mockResolvedValue({
    ...zeroAnalytics,
    totalClicks: 4,
    monthlyClicks: [{ month: "2026-03", clicks: 4 }],
    devices: [{ label: "desktop", clicks: 4 }],
    browsers: [{ label: "Chrome", clicks: 4 }],
  });

  render(await StatsPage({ params: Promise.resolve({ code: "demo" }) }));

  expect(screen.getByRole("heading", { name: /analytics for demo/i })).toBeInTheDocument();
  expect(screen.getByText("Total clicks").parentElement).toHaveTextContent("4");
  expect(screen.getByText("2026-03: 4 clicks")).toBeInTheDocument();
  expect(screen.getByRole("list", { name: /device click distribution/i })).toBeInTheDocument();
  expect(screen.getByRole("list", { name: /browser click distribution/i })).toBeInTheDocument();
});

test("renders a zero-event state for a known link", async () => {
  analytics.getPublicLinkAnalytics.mockResolvedValue(zeroAnalytics);

  render(await StatsPage({ params: Promise.resolve({ code: "demo" }) }));

  expect(screen.getByText(/no clicks yet/i)).toBeInTheDocument();
});

test("uses Next notFound for an unknown code", async () => {
  analytics.getPublicLinkAnalytics.mockResolvedValue(null);

  await expect(StatsPage({ params: Promise.resolve({ code: "missing" }) })).rejects.toThrow("not found");
  expect(navigation.notFound).toHaveBeenCalledOnce();
});
