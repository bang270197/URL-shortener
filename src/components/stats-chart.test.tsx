import React from "react";
import { render, screen } from "@testing-library/react";

import { StatsChart } from "./stats-chart";

test("renders a readable monthly activity summary", () => {
  render(
    <StatsChart
      data={[
        { month: "2026-01", clicks: 2 },
        { month: "2026-02", clicks: 0 },
      ]}
    />,
  );

  expect(screen.getByRole("heading", { name: /monthly activity/i })).toBeInTheDocument();
  expect(screen.getByText("2026-01: 2 clicks")).toBeInTheDocument();
  expect(screen.getByText("2026-02: 0 clicks")).toBeInTheDocument();
});

test("renders an empty monthly activity state", () => {
  render(<StatsChart data={[]} />);

  expect(screen.getByText(/no monthly activity yet/i)).toBeInTheDocument();
});
