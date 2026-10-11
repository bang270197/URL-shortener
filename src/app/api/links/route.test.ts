import { vi } from "vitest";

const links = vi.hoisted(() => {
  class DuplicateCodeError extends Error {}

  return { createShortLink: vi.fn(), DuplicateCodeError };
});

vi.mock("@/lib/links", () => links);

import { POST } from "./route";

function createRequest(body: string) {
  return new Request("http://localhost/api/links", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://short.ly";
  links.createShortLink.mockReset();
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

test("creates a link and returns the configured canonical short URL", async () => {
  links.createShortLink.mockResolvedValue({
    id: "link_123",
    code: "demo-link",
    destinationUrl: "https://example.com/a",
    createdAt: new Date(),
  });

  const response = await POST(
    createRequest(JSON.stringify({ destinationUrl: "https://example.com/a", code: "Demo-Link" })),
  );

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({
    code: "demo-link",
    destinationUrl: "https://example.com/a",
    shortUrl: "https://short.ly/demo-link",
  });
});

test("rejects malformed JSON as invalid input", async () => {
  const response = await POST(createRequest("not JSON"));

  expect(response.status).toBe(400);
});

test("returns conflict when the custom code already exists", async () => {
  links.createShortLink.mockRejectedValue(new links.DuplicateCodeError());

  const response = await POST(
    createRequest(JSON.stringify({ destinationUrl: "https://example.com/a", code: "demo-link" })),
  );

  expect(response.status).toBe(409);
});

test("returns a safe server error for an unexpected persistence failure", async () => {
  links.createShortLink.mockRejectedValue(new Error("database unavailable"));

  const response = await POST(
    createRequest(JSON.stringify({ destinationUrl: "https://example.com/a", code: "demo-link" })),
  );

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({ error: "Unable to create the short link." });
});
