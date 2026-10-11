import { expect, test } from "playwright/test";

const baseUrl = process.env.E2E_BASE_URL;

test.describe("database-backed URL shortener", () => {
  test.skip(!baseUrl, "Set E2E_BASE_URL only for a disposable test deployment/database.");

  test("creates, redirects, and displays one recorded click", async ({ page }) => {
    const code = `e2e-${Date.now()}`;

    await page.goto(baseUrl!);
    await page.getByLabel("Destination URL").fill(baseUrl!);
    await page.getByLabel("Custom code").fill(code);
    await page.getByRole("button", { name: "Create short link" }).click();
    await expect(page.getByText("Ready to share")).toBeVisible();

    await page.goto(`${baseUrl}/${code}`);
    await expect(page).toHaveURL(new RegExp(`${baseUrl!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`));

    await page.goto(`${baseUrl}/stats/${code}`);
    await expect(page.getByText("Total clicks")).toBeVisible();
    await expect(page.locator(".stats-card strong")).toHaveText("1");
  });

  test("returns 404 for an unknown code", async ({ page }) => {
    await page.goto(`${baseUrl}/missing-e2e-code`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
