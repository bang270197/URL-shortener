import React from "react";
import { render, screen } from "@testing-library/react";

import { StatsBreakdown } from "./stats-breakdown";

test("renders semantic device and browser breakdown lists", () => {
  render(
    <StatsBreakdown
      devices={[
        { label: "desktop", clicks: 3 },
        { label: "mobile", clicks: 1 },
      ]}
      browsers={[{ label: "Chrome", clicks: 4 }]}
    />,
  );

  expect(screen.getByRole("heading", { name: /devices/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /browsers/i })).toBeInTheDocument();
  expect(screen.getByRole("list", { name: /device click distribution/i })).toHaveTextContent("desktop");
  expect(screen.getByRole("list", { name: /browser click distribution/i })).toHaveTextContent("Chrome");
});
