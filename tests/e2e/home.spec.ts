import { expect, test } from "@playwright/test";

test("reader can browse from home to catalog", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Find your next book.*Give yours a second life/i,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Browse", exact: true }).first().click();
  await expect(
    page.getByRole("heading", { name: /Books for sale/i }),
  ).toBeVisible();
});

test("premium navigation remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Find your next book.*Give yours a second life/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("link", { name: /Sell/i }).last()).toBeVisible();
});

test("safety and user rights guidance is publicly reachable", async ({
  page,
}) => {
  await page.goto("/safety");
  await expect(
    page.getByRole("heading", { name: /Təhlükəsiz al, təhlükəsiz sat/i }),
  ).toBeVisible();
  await page.goto("/user-rights");
  await expect(
    page.getByRole("heading", { name: /Sizin məlumatınız/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Submit secure request/i }),
  ).toBeVisible();
});

test("responses include baseline security headers", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});
