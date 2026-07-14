import { expect, test } from "@playwright/test";

test("reader can browse from home to catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "az");
  await expect(page).toHaveTitle(/Kitabına ikinci həyat ver/i);
  await expect(
    page.getByRole("heading", {
      name: /Növbəti kitabını tap.*Oxuduğuna ikinci həyat ver/i,
    }),
  ).toBeVisible();
  const fictionShelf = page
    .getByRole("link", { name: "Bədii ədəbiyyat", exact: true })
    .first();
  await expect(fictionShelf).toHaveAttribute("href", /category=Fiction/);
  await page
    .getByRole("link", { name: "Kitablar", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: /Satışdakı kitablar/i }),
  ).toBeVisible();
  await expect(page.getByText(/200.*₼-dək/)).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("premium navigation remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Növbəti kitabını tap.*Oxuduğuna ikinci həyat ver/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Menyu" }).click();
  await expect(
    page.getByRole("link", { name: "Kitab sat", exact: true }).last(),
  ).toBeVisible();
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

test("favorites exposes a localized private sign-in state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/favorites");
  await expect(page.locator("h1")).toHaveText(
    "Seçilmişlərə baxmaq üçün daxil ol.",
  );
  await expect(page).toHaveTitle(/Seçilmiş kitablar/i);
  await expect(
    page.getByText("Seçilmişlərə baxmaq üçün daxil ol.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Daxil ol", exact: true }).last(),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );
});

test("listing authoring keeps localized labels and stable wire values", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/listings/new");
  await expect(
    page.getByRole("heading", { name: "Kitab elanı yarat." }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/Kitab elanı yarat/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );
  await expect(page.getByLabel("Kateqoriya")).toHaveValue("Fiction");
  await expect(
    page.getByLabel("Kateqoriya").locator("option:checked"),
  ).toHaveText("Bədii ədəbiyyat");
  await expect(page.getByLabel("Məkan")).toHaveValue("Baku");
  await page.getByLabel("Kitabın adı").fill("Sınaq kitabı");
  await page.getByLabel("Müəllif / mövzu").fill("Sınaq müəllifi");
  await page
    .getByLabel("Təsvir")
    .fill("Kitabın vəziyyəti haqqında kifayət qədər ətraflı qeyd.");
  await page.getByRole("button", { name: "Davam et" }).click();
  await expect(page.getByRole("button", { name: "Çox yaxşı" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Davam et" }).click();
  await expect(
    page.getByRole("heading", { name: "Kitabın real nüsxəsini göstər." }),
  ).toBeVisible();
  await expect(page.getByLabel("Qiymət (AZN)")).toBeVisible();
});

test("authentication modes and password validation are Azerbaijani", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Kitab rəfinə daxil ol." }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/Daxil ol və ya hesab yarat/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );
  await page.getByRole("button", { name: "Yeni hesab yarat" }).click();
  await expect(
    page.getByRole("heading", { name: "Yeni hekayələrə yer aç." }),
  ).toBeVisible();
  await expect(page.getByLabel("Ad")).toBeVisible();
  await page.getByRole("button", { name: "Hesabın var? Daxil ol" }).click();
  await page.getByRole("button", { name: "Parolu unutmusunuz?" }).click();
  await expect(
    page.getByRole("heading", { name: "Parolunu yenilə." }),
  ).toBeVisible();
  await expect(page.getByLabel("Parol")).toHaveCount(0);

  await page.goto("/reset-password");
  await page.getByLabel("Yeni parol").fill("abcdefgh");
  await page.getByLabel("Parolu təkrar et").fill("abcdEFGH");
  await page.getByRole("button", { name: "Parolu yenilə" }).click();
  await expect(
    page.getByText("Parollar eyni deyil.", { exact: true }),
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
