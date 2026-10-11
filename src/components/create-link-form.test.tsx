import React from "react";
import { render, screen } from "@testing-library/react";
import { CreateLinkForm } from "./create-link-form";

test("uses a browser-safe custom-code pattern", () => {
  render(<CreateLinkForm />);
  expect(screen.getByLabelText("Custom code")).toHaveAttribute("pattern", "[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*");
});
