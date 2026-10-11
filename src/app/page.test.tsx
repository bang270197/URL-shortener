import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "./page";

test("renders the short-link creation heading", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /create a short link/i })).toBeInTheDocument();
});
