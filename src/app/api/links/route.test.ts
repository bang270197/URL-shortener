import { POST } from "./route";
import { resetLinks } from "@/lib/links-store";

beforeEach(() => {
  resetLinks();
});

test("creates a custom short link", async () => {
  const response = await POST(new Request("http://localhost/api/links", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ destinationUrl: "https://example.com/a", code: "demo-link" }) }));
  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toMatchObject({ code: "demo-link", shortUrl: "http://localhost/demo-link" });
});
