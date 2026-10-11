import { vi } from "vitest";

const links = vi.hoisted(() => ({ findShortLinkByCode: vi.fn() }));
const analytics = vi.hoisted(() => ({
  classifyUserAgent: vi.fn(),
  recordClick: vi.fn(),
}));

vi.mock("@/lib/links", () => links);
vi.mock("@/lib/analytics", () => analytics);

import { GET } from "./route";

const link = {
  id: "link_123",
  code: "redirect-test",
  destinationUrl: "https://example.com/target",
  createdAt: new Date(),
};

function getRedirect(code = "redirect-test", userAgent = "Mozilla/5.0") {
  return GET(new Request(`http://localhost/${code}`, { headers: { "user-agent": userAgent } }), {
    params: Promise.resolve({ code }),
  });
}

beforeEach(() => {
  links.findShortLinkByCode.mockReset();
  analytics.classifyUserAgent.mockReset();
  analytics.recordClick.mockReset();
  analytics.classifyUserAgent.mockReturnValue({ isBot: false });
  analytics.recordClick.mockResolvedValue(undefined);
});

test("redirects a mixed-case known code with HTTP 302 and records one human click", async () => {
  links.findShortLinkByCode.mockResolvedValue(link);

  const response = await getRedirect("Redirect-Test", "human-agent");

  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("https://example.com/target");
  expect(links.findShortLinkByCode).toHaveBeenCalledWith("Redirect-Test");
  expect(analytics.recordClick).toHaveBeenCalledWith("link_123", "human-agent");
});

test("returns 404 for an unknown short code", async () => {
  links.findShortLinkByCode.mockResolvedValue(null);

  const response = await getRedirect("unknown-code");

  expect(response.status).toBe(404);
  expect(analytics.recordClick).not.toHaveBeenCalled();
});

test("does not record bot traffic", async () => {
  links.findShortLinkByCode.mockResolvedValue(link);
  analytics.classifyUserAgent.mockReturnValue({ isBot: true });

  const response = await getRedirect("redirect-test", "Googlebot/2.1");

  expect(response.status).toBe(302);
  expect(analytics.recordClick).not.toHaveBeenCalled();
});

test("still redirects when click persistence rejects", async () => {
  links.findShortLinkByCode.mockResolvedValue(link);
  analytics.recordClick.mockRejectedValue(new Error("database unavailable"));
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  const response = await getRedirect();

  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("https://example.com/target");
  consoleErrorSpy.mockRestore();
});
