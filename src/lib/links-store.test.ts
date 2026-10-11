import { createLink, getLink, resetLinks } from "./links-store";

beforeEach(() => {
  resetLinks();
});

test("keeps created links in the process-global store", () => {
  createLink("shared-link", "https://example.com/");

  expect(globalThis.__shortlyLinks?.get("shared-link")).toEqual(getLink("shared-link"));
});
