import { expect, test, type Page } from "@playwright/test";

async function horizontalOverflow(page: Page) {
  return page.locator("body *").evaluateAll((elements) =>
    elements
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          element: `${element.tagName.toLowerCase()}.${element.className}`,
          left: Math.round(bounds.left),
          right: Math.round(bounds.right),
          width: Math.round(bounds.width),
        };
      })
      .filter(
        ({ left, right, width }) =>
          width > 0 && (left < -1 || right > window.innerWidth + 1),
      )
      .slice(0, 20),
  );
}

function relativeLuminance(hex: string) {
  const channels = hex
    .match(/[a-f\d]{2}/gi)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

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

test("public shell provides a keyboard entry point and managed mobile menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Əsas məzmuna keç" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main-content")).toBeFocused();

  const menuButton = page.getByRole("button", { name: "Menyu" });
  const menuBounds = await menuButton.boundingBox();
  expect(menuBounds?.width).toBeGreaterThanOrEqual(44);
  expect(menuBounds?.height).toBeGreaterThanOrEqual(44);
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  const currentHomeLink = page
    .getByRole("navigation", { name: "Menyu" })
    .last()
    .getByRole("link", { name: "Ana səhifə" });
  await expect(currentHomeLink).toBeFocused();
  await expect(currentHomeLink).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
});

test("public catalog meets discovery target, contrast, and reflow contracts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/listings");

  await expect(page.locator("a button")).toHaveCount(0);
  const controls = [
    page.getByLabel("Ad, müəllif və ya ISBN ilə axtar"),
    page.getByLabel("Məkana görə filtrlə"),
    page.getByLabel("Vəziyyətə görə filtrlə"),
    page.getByLabel("AZN ilə maksimum qiymət"),
    page.getByLabel("Elanları sırala"),
  ];
  for (const control of controls) {
    const bounds = await control.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }

  await controls[0].fill("kitab");
  const clearSearch = page.getByRole("button", {
    name: "Kataloq axtarışını təmizlə",
  });
  const clearBounds = await clearSearch.boundingBox();
  expect(clearBounds?.width).toBeGreaterThanOrEqual(44);
  expect(clearBounds?.height).toBeGreaterThanOrEqual(44);

  const colors = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      orange: styles.getPropertyValue("--orange").trim(),
      muted: styles.getPropertyValue("--muted").trim(),
      line: styles.getPropertyValue("--line").trim(),
      paper: styles.getPropertyValue("--paper").trim(),
    };
  });
  expect(contrastRatio(colors.orange, colors.paper)).toBeGreaterThanOrEqual(
    4.5,
  );
  expect(contrastRatio(colors.muted, "#e8decd")).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(colors.line, "#fffdf8")).toBeGreaterThanOrEqual(3);

  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
});

test("public discovery honors reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Növbəti kitabını tap.*Oxuduğuna ikinci həyat ver/i,
    }),
  ).toBeVisible();
  const longAnimations = await page.evaluate(() =>
    document
      .getAnimations()
      .map((animation) => animation.effect?.getComputedTiming().duration)
      .filter((duration) => typeof duration === "number" && duration > 1),
  );
  expect(longAnimations).toHaveLength(0);
});

test("listing detail exposes accessible seller actions and constrained reflow", async ({
  page,
}) => {
  const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const sellerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route("**/api/listings**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === `/api/listings/${listingId}`) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: listingId,
            title: "UzunbaşlıqlarlaMəhdudEnSınağı Azərbaycan dilində kitab",
            author: "Sınaq müəllifi",
            description:
              "Oxucunun yazdığı təsvir dar görünüşdə və böyüdülmüş mətndə də itmir.",
            isbn: "978-99999-1234567890",
            price: 17.5,
            originalPrice: 22,
            images: ["/icon.svg", "/icon-maskable.svg"],
            category: "Fiction",
            condition: "Very good",
            city: "Baku",
            status: "active",
            sellerId,
            seller: {
              id: sellerId,
              name: "Uzun adlı BookSwap oxucusu",
              initials: "BO",
              city: "Baku",
            },
            reviews: [],
          },
        }),
      });
      return;
    }
    if (url.pathname === "/api/listings") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [], nextCursor: null } }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`/listings/${listingId}`);
  await expect(
    page.getByRole("heading", {
      name: /UzunbaşlıqlarlaMəhdudEnSınağı Azərbaycan dilində kitab/,
    }),
  ).toBeVisible();

  const gallery = page.getByRole("region", { name: "Kitab şəkilləri" });
  const firstPhoto = gallery.getByRole("button", { name: "Şəkil 1" });
  const secondPhoto = gallery.getByRole("button", { name: "Şəkil 2" });
  await expect(firstPhoto).toHaveAttribute("aria-pressed", "true");
  await secondPhoto.click();
  await expect(firstPhoto).toHaveAttribute("aria-pressed", "false");
  await expect(secondPhoto).toHaveAttribute("aria-pressed", "true");

  const favorite = page.getByRole("button", {
    name: "Kitabı seçilmişlərə əlavə et",
  });
  await expect(favorite).toHaveAttribute("aria-pressed", "false");

  const summary = page.locator("summary");
  const summaryBounds = await summary.boundingBox();
  expect(summaryBounds?.height).toBeGreaterThanOrEqual(44);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details")).toHaveAttribute("open", "");
  await expect(page.getByLabel("Şikayətin səbəbi")).toBeVisible();

  const primaryTargets = [
    page.getByRole("link", { name: "Kitab rəflərinə qayıt" }),
    favorite,
    page.getByRole("button", { name: "Satıcıya yaz" }),
    page.getByRole("link", { name: "Təhlükəsizlik tövsiyələrini oxu" }),
  ];
  for (const target of primaryTargets) {
    const bounds = await target.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }

  const undersizedControls = await page
    .locator(
      "main a, main button, main input, main select, main textarea, main summary",
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return (
            bounds.width > 0 &&
            bounds.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none"
          );
        })
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          return {
            name: element.getAttribute("aria-label") ?? element.textContent,
            width: bounds.width,
            height: bounds.height,
          };
        })
        .filter(({ width, height }) => width < 24 || height < 24),
    );
  expect(undersizedControls).toEqual([]);
  await expect(page.locator("a button, button a")).toHaveCount(0);
  expect(await horizontalOverflow(page)).toEqual([]);

  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
});

test("safety and user rights guidance is publicly reachable", async ({
  page,
}) => {
  await page.goto("/faq");
  await expect(page).toHaveTitle(/Tez-tez verilən suallar/i);
  await expect(
    page.getByRole("heading", { name: /Tez-tez verilən suallar/i }),
  ).toBeVisible();
  await page
    .getByText("BookSwap ödənişi və təhvili idarə edirmi?", { exact: true })
    .click();
  await expect(page.getByText(/alıcı müdafiəsi təqdim etmir/i)).toBeVisible();
  await page
    .getByRole("link", { name: "Təhlükəsizlik bələdçisini aç" })
    .click();
  await expect(page).toHaveURL(/\/safety$/);
  await expect(
    page.getByRole("heading", { name: /Alış və satışda təhlükəsizlik/i }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/Təhlükəsizlik mərkəzi/i);
  await expect(
    page.getByRole("heading", { name: "BookSwap-ın rolu" }),
  ).toBeVisible();
  await expect(page.getByText(/bütün iddialarını təsdiqləmir/i)).toBeVisible();
  const privacyRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/privacy-requests"))
      privacyRequests.push(request.url());
  });
  await page.goto("/user-rights");
  await expect(
    page.getByRole("heading", { name: /Məlumatın, seçimin/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Məxfilik sorğusu üçün daxil ol/i }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/İstifadəçi hüquqları/i);
  await expect(
    page.getByRole("link", { name: "Daxil ol", exact: true }).last(),
  ).toBeVisible();
  expect(privacyRequests).toHaveLength(0);
});

test("profile exposes a localized private sign-in state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const profileRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/profile"))
      profileRequests.push(request.url());
  });
  await page.goto("/profile");
  await expect(page.locator("h1")).toHaveText("Kabinetə baxmaq üçün daxil ol.");
  await expect(page).toHaveTitle(/Oxucu kabineti/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );
  await expect(
    page.getByRole("link", { name: "Daxil ol", exact: true }).last(),
  ).toBeVisible();
  expect(profileRequests).toHaveLength(0);
});

test("messages, chat, and notifications keep protected reads signed out", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const protectedRequests: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().includes("/api/chat/") ||
      request.url().includes("/api/notifications")
    )
      protectedRequests.push(request.url());
  });

  await page.goto("/messages");
  await expect(page.locator("h1")).toHaveText(
    "Mesajlara baxmaq üçün daxil ol.",
  );
  await expect(page).toHaveTitle(/Mesajlar/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );

  await page.goto("/notifications");
  await expect(page.locator("h1")).toHaveText(
    "Bildirişlərə baxmaq üçün daxil ol.",
  );
  await expect(page).toHaveTitle(/Bildirişlər/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );

  await page.goto("/chat/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  await expect(page.locator("h1")).toHaveText("Söhbətə baxmaq üçün daxil ol.");
  await expect(page).toHaveTitle(/Məxfi söhbət/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );
  expect(protectedRequests).toHaveLength(0);
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

test("direct API validation errors are Azerbaijani and keep machine codes", async ({
  request,
}) => {
  const invalidFilter = await request.get(
    "/api/listings?category=UnsupportedCategory",
  );
  expect(invalidFilter.status()).toBe(400);
  expect(await invalidFilter.json()).toEqual({
    error: "Filtr dəyəri etibarlı deyil.",
    code: "INVALID_FILTER",
  });

  const invalidSeller = await request.get("/api/sellers/not-a-uuid");
  expect(invalidSeller.status()).toBe(400);
  expect(await invalidSeller.json()).toEqual({
    error: "İdentifikator etibarlı deyil.",
    code: "INVALID_ID",
  });

  const invalidReview = await request.post("/api/review", {
    data: { listingId: "provider detail" },
  });
  expect(invalidReview.status()).toBe(422);
  const invalidReviewBody = (await invalidReview.json()) as {
    error: string;
    code: string;
    details: Record<string, string[]>;
  };
  expect(invalidReviewBody.error).toBe("Sorğudakı məlumatlar etibarlı deyil.");
  expect(invalidReviewBody.code).toBe("VALIDATION_ERROR");
  expect(new Set(Object.values(invalidReviewBody.details).flat())).toEqual(
    new Set(["Bu sahədəki məlumatı yoxla."]),
  );
});
