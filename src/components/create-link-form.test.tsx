import React from "react";
import { render, screen } from "@testing-library/react";
import { CreateLinkForm } from "./create-link-form";

test("uses the same custom-code pattern as the server", () => {
  render(<CreateLinkForm />);
  expect(screen.getByLabelText("Custom code")).toHaveAttribute("pattern", "[A-Za-z0-9-]{3,50}");
});
