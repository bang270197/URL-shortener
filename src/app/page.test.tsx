import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const links = vi.hoisted(() => ({ listRecentShortLinks: vi.fn() }));

vi.mock("@/lib/links", () => links);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import Home from "./page";

beforeEach(() => {
  links.listRecentShortLinks.mockResolvedValue([]);
});

test("renders the short-link creation heading", async () => {
  render(await Home());
  expect(screen.getByRole("heading", { name: /create a short link/i })).toBeInTheDocument();
});

test("does not link the header to a hard-coded analytics code", async () => {
  render(await Home());
  expect(screen.queryByRole("link", { name: /view stats/i })).not.toBeInTheDocument();
});

test("shows recent links with their analytics pages", async () => {
  links.listRecentShortLinks.mockResolvedValue([
    { id: "link_123", code: "latest-link", destinationUrl: "https://example.com/latest", createdAt: new Date("2026-10-11T00:00:00.000Z") },
  ]);

  render(await Home());

  expect(screen.getByRole("heading", { name: "Recent links" })).toBeInTheDocument();
  expect(screen.getByText("latest-link")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View analytics for latest-link" })).toHaveAttribute("href", "/stats/latest-link");
});
