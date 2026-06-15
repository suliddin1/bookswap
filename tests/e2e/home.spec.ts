import { expect, test } from "@playwright/test";

test("reader can browse from home to catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Find your next book.*Give yours a second life/i })).toBeVisible();
  await page.getByRole("link", { name: "Browse", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: /Books for sale/i })).toBeVisible();
});

test("premium navigation remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Find your next book.*Give yours a second life/i })).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("link", { name: /Sell/i }).last()).toBeVisible();
});
