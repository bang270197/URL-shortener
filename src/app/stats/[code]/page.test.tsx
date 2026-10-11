import React from "react";
import { render, screen } from "@testing-library/react";
import StatsPage from "./page";
import { createLink, resetLinks } from "@/lib/links-store";

beforeEach(() => {
  resetLinks();
  createLink("demo", "https://example.com/");
});

test("renders a public analytics zero state for a code", async () => {
  render(await StatsPage({ params: Promise.resolve({ code: "demo" }) }));
  expect(screen.getByRole("heading", { name: /analytics for demo/i })).toBeInTheDocument();
  expect(screen.getByText(/no clicks yet/i)).toBeInTheDocument();
});
