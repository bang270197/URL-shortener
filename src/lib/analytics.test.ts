import { classifyUserAgent } from "./analytics";

test("classifies Chrome on desktop", () => {
  expect(
    classifyUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ),
  ).toEqual({ isBot: false, deviceType: "desktop", browser: "Chrome" });
});

test("classifies Safari on iPhone", () => {
  expect(
    classifyUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Version/18.1 Mobile/15E148 Safari/604.1",
    ),
  ).toEqual({ isBot: false, deviceType: "mobile", browser: "Safari" });
});

test("classifies Firefox on an Android tablet", () => {
  expect(
    classifyUserAgent(
      "Mozilla/5.0 (Android 14; Tablet; rv:132.0) Gecko/132.0 Firefox/132.0",
    ),
  ).toEqual({ isBot: false, deviceType: "tablet", browser: "Firefox" });
});

test("excludes Googlebot from analytics", () => {
  expect(
    classifyUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ).isBot,
  ).toBe(true);
});

test("uses privacy-safe fallback labels without a User-Agent", () => {
  expect(classifyUserAgent(null)).toEqual({ isBot: false, deviceType: "other", browser: "Other" });
});
