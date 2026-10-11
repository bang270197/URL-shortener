import { POST } from "@/app/api/links/route";
import { getLink, resetLinks } from "@/lib/links-store";
import { GET } from "./route";

beforeEach(() => {
  resetLinks();
});

test("redirects a short link and records its click", async () => {
  await POST(
    new Request("http://localhost/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationUrl: "https://example.com/",
        code: "redirect-test",
      }),
    }),
  );

  const response = await GET(new Request("http://localhost/redirect-test"), {
    params: Promise.resolve({ code: "redirect-test" }),
  });

  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("https://example.com/");
  expect(getLink("redirect-test")?.clickCount).toBe(1);
});
