import { vi } from "vitest";

const shortLink = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("./db", () => ({ prisma: { shortLink } }));

import { createShortLink, DuplicateCodeError, findShortLinkByCode } from "./links";

const storedLink = {
  id: "link_123",
  code: "my-link",
  destinationUrl: "https://example.com/target",
  createdAt: new Date("2026-10-11T00:00:00.000Z"),
};

beforeEach(() => {
  shortLink.create.mockReset();
  shortLink.findUnique.mockReset();
});

test("stores a normalized custom code", async () => {
  shortLink.create.mockResolvedValue(storedLink);

  await expect(
    createShortLink({ code: "My-Link", destinationUrl: "https://example.com/target" }),
  ).resolves.toEqual(storedLink);

  expect(shortLink.create).toHaveBeenCalledWith({
    data: { code: "my-link", destinationUrl: "https://example.com/target" },
  });
});

test("finds a link with a mixed-case code", async () => {
  shortLink.findUnique.mockResolvedValue(storedLink);

  await expect(findShortLinkByCode("My-Link")).resolves.toEqual(storedLink);

  expect(shortLink.findUnique).toHaveBeenCalledWith({ where: { code: "my-link" } });
});

test("translates a database unique-constraint error to DuplicateCodeError", async () => {
  shortLink.create.mockRejectedValue({ code: "P2002" });

  await expect(
    createShortLink({ code: "my-link", destinationUrl: "https://example.com/target" }),
  ).rejects.toBeInstanceOf(DuplicateCodeError);
});

test("preserves an unexpected database error", async () => {
  const databaseError = new Error("database unavailable");
  shortLink.create.mockRejectedValue(databaseError);

  await expect(
    createShortLink({ code: "my-link", destinationUrl: "https://example.com/target" }),
  ).rejects.toBe(databaseError);
});
