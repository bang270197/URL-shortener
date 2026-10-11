import { parseCreateLinkInput } from "./validation";

describe("parseCreateLinkInput", () => {
  test("normalizes a custom code and canonicalizes an HTTPS destination", () => {
    expect(
      parseCreateLinkInput({
        code: "  My-Link  ",
        destinationUrl: "https://example.com/a",
      }),
    ).toEqual({ code: "my-link", destinationUrl: "https://example.com/a" });
  });

  test.each(["abc", "a".repeat(50)])("accepts a code at a valid length: %s", (code) => {
    expect(
      parseCreateLinkInput({ code, destinationUrl: "http://example.com" }).code,
    ).toBe(code);
  });

  test.each(["ab", "a".repeat(51), "with space", "under_score", "api", "stats", "favicon.ico"])(
    "rejects an invalid or reserved code: %s",
    (code) => {
      expect(() =>
        parseCreateLinkInput({ code, destinationUrl: "https://example.com" }),
      ).toThrow();
    },
  );

  test.each(["http://example.com", "https://example.com/path"])(
    "accepts an absolute HTTP(S) destination: %s",
    (destinationUrl) => {
      expect(parseCreateLinkInput({ code: "valid-code", destinationUrl }).destinationUrl).toBe(
        new URL(destinationUrl).toString(),
      );
    },
  );

  test.each(["javascript:alert(1)", "ftp://example.com", "/relative-path"])(
    "rejects a non-HTTP(S) or relative destination: %s",
    (destinationUrl) => {
      expect(() => parseCreateLinkInput({ code: "valid-code", destinationUrl })).toThrow();
    },
  );
});
