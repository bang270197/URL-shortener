import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { CreateLinkForm } from "./create-link-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

test("uses a Chromium-compatible custom-code pattern", () => {
  render(<CreateLinkForm />);
  expect(screen.getByLabelText("Custom code")).toHaveAttribute("pattern", "(?:[A-Za-z0-9]|-){3,50}");
});

test("links to analytics for the short link that was just created", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ code: "demo-link", shortUrl: "http://localhost:3000/demo-link" }),
  }));

  render(<CreateLinkForm />);
  fireEvent.change(screen.getByLabelText("Destination URL"), { target: { value: "https://example.com" } });
  fireEvent.change(screen.getByLabelText("Custom code"), { target: { value: "demo-link" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create short link" }).closest("form")!);

  expect(await screen.findByRole("link", { name: "View analytics" })).toHaveAttribute("href", "/stats/demo-link");
});
