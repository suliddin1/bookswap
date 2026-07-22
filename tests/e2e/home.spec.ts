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

async function installAuthenticatedUiFixture(page: Page) {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    aud: "authenticated",
    role: "authenticated",
    email: "reader@example.invalid",
    email_confirmed_at: "2026-07-19T10:00:00.000Z",
    confirmed_at: "2026-07-19T10:00:00.000Z",
    last_sign_in_at: "2026-07-19T10:00:00.000Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { name: "Sınaq oxucusu" },
    identities: [],
    created_at: "2026-07-19T10:00:00.000Z",
    updated_at: "2026-07-19T10:00:00.000Z",
  };
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const session = {
    access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
      aud: "authenticated",
      exp: now + 3600,
      iat: now,
      iss: "fixture",
      role: "authenticated",
      sub: user.id,
      email: user.email,
    })}.fixture`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: "fixture-refresh-token",
    user,
  };

  await page.addInitScript((fixtureSession) => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function getFixtureSession(key: string) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token"))
        return JSON.stringify(fixtureSession);
      return originalGetItem.call(this, key);
    };

    class FixtureWebSocket {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;
      readonly CONNECTING = 0;
      readonly OPEN = 1;
      readonly CLOSING = 2;
      readonly CLOSED = 3;
      readyState = FixtureWebSocket.OPEN;
      bufferedAmount = 0;
      extensions = "";
      protocol = "";
      binaryType: BinaryType = "blob";
      url: string;
      onopen: ((event: Event) => void) | null = null;
      onclose: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onmessage: ((event: Event) => void) | null = null;
      private listeners = new Map<string, Set<(event: Event) => void>>();

      constructor(url: string | URL) {
        this.url = String(url);
        setTimeout(() => this.emit("open", new Event("open")), 0);
      }

      addEventListener(type: string, listener: (event: Event) => void) {
        const listeners = this.listeners.get(type) ?? new Set();
        listeners.add(listener);
        this.listeners.set(type, listeners);
      }

      removeEventListener(type: string, listener: (event: Event) => void) {
        this.listeners.get(type)?.delete(listener);
      }

      dispatchEvent(event: Event) {
        this.emit(event.type, event);
        return true;
      }

      send() {}

      close() {
        this.readyState = FixtureWebSocket.CLOSED;
        this.emit("close", new Event("close"));
      }

      private emit(type: string, event: Event) {
        const handler = this[`on${type}` as "onopen" | "onclose"];
        handler?.(event);
        this.listeners.get(type)?.forEach((listener) => listener(event));
      }
    }

    Object.defineProperty(window, "WebSocket", {
      configurable: true,
      value: FixtureWebSocket,
    });
  }, session);

  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(user),
    });
  });
  await page.route("**/rest/v1/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: "[]",
    });
  });
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

test("profile and privacy controls expose keyboard focus and 200% reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await installAuthenticatedUiFixture(page);
  const listingId = "22222222-2222-4222-8222-222222222222";
  const longName = "ÇoxUzunFasiləsizOxucuAdıÇoxUzunFasiləsizOxucuAdı";
  let profileGetCount = 0;
  let privacyGetCount = 0;
  await page.route("**/api/profile", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: { name: "Yenilənmiş oxucu", city: "Baku", phone: null },
        }),
      });
      return;
    }
    profileGetCount += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          profile: { name: longName, city: "Baku", phone: null },
          favoriteCount: 2,
          listings: [
            {
              id: listingId,
              title: "Dar görünüş üçün uzun Azərbaycan kitab başlığı",
              author: "Sınaq müəllifi",
              description: "Sınaq təsviri",
              price: 17.5,
              images: ["/icon.svg"],
              category: "Fiction",
              condition: "Very good",
              city: "Baku",
              status: "active",
              sellerId: "11111111-1111-4111-8111-111111111111",
              seller: {
                id: "11111111-1111-4111-8111-111111111111",
                name: longName,
              },
            },
          ],
        },
      }),
    });
  });
  await page.route("**/api/privacy-requests", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "44444444-4444-4444-8444-444444444444",
            type: "access",
            status: "open",
            created_at: "2026-07-19T18:05:00.000Z",
          },
        }),
      });
      return;
    }
    privacyGetCount += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            type: "correction",
            status: "in_progress",
            created_at: "2026-07-19T18:05:00.000Z",
          },
        ],
      }),
    });
  });

  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: /Xoş gəldin/i }),
  ).toBeVisible();
  expect(profileGetCount).toBe(1);
  await expect(page.locator("main")).toHaveCount(1);
  const menuButton = page.getByRole("button", { name: "Menyu" });
  await menuButton.click();
  await expect(page.getByRole("button", { name: "Çıxış et" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();
  const tablist = page.getByRole("tablist", { name: "Kabinet bölmələri" });
  await expect(tablist).toBeVisible();
  const listingsTab = page.getByRole("tab", { name: "Elanlarım" });
  await expect(listingsTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    "profile-tab-listings",
  );
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);

  await listingsTab.focus();
  await page.keyboard.press("End");
  const profileTab = page.getByRole("tab", { name: "Profil" });
  await expect(profileTab).toBeFocused();
  await expect(profileTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    "profile-tab-profile",
  );
  const nameInput = page.getByLabel("Ad", { exact: true });
  await nameInput.fill("A");
  await page.getByRole("button", { name: "Profili yadda saxla" }).click();
  await expect(nameInput).toBeFocused();
  await expect(nameInput).toHaveAttribute("aria-invalid", "true");
  await expect(nameInput).toHaveAttribute(
    "aria-describedby",
    "profile-dashboard-feedback",
  );
  await nameInput.fill("Yenilənmiş oxucu");
  await page.getByRole("button", { name: "Profili yadda saxla" }).click();
  await expect(
    page
      .locator('p[role="status"]')
      .filter({ hasText: "Profil yadda saxlanıldı." }),
  ).toBeFocused();
  expect(await horizontalOverflow(page)).toEqual([]);

  await page.goto("/user-rights");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(
    page.getByRole("list", { name: "Son sorğuların" }),
  ).toBeVisible();
  expect(privacyGetCount).toBe(1);
  const details = page.getByLabel("Ətraflı məlumat");
  await details.fill("qısa");
  await page.getByRole("button", { name: "Təhlükəsiz sorğu göndər" }).click();
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute("aria-invalid", "true");
  await expect(details).toHaveAttribute(
    "aria-describedby",
    "privacy-request-details-help privacy-request-status",
  );
  await details.fill("Məlumatlarımın surətini təqdim etməyinizi xahiş edirəm.");
  const submitRequest = page.getByRole("button", {
    name: "Təhlükəsiz sorğu göndər",
  });
  const submitBounds = await submitRequest.boundingBox();
  expect(submitBounds?.height).toBeGreaterThanOrEqual(44);
  await submitRequest.click();
  await expect(
    page
      .locator('p[role="status"]')
      .filter({ hasText: "Sorğun qeydə alındı." }),
  ).toBeFocused();
  await expect(
    page.getByRole("list", { name: "Son sorğuların" }),
  ).toContainText("Məlumatlarıma çıxış");
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
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

test("messaging and notification controls keep focus, context, and 200% reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await installAuthenticatedUiFixture(page);

  const userId = "11111111-1111-4111-8111-111111111111";
  const roomId = "22222222-2222-4222-8222-222222222222";
  const sellerId = "33333333-3333-4333-8333-333333333333";
  const listingId = "44444444-4444-4444-8444-444444444444";
  const timestamp = "2026-07-14T18:05:00.000Z";
  const longSellerName =
    "Nigar MəmmədovaÇoxUzunOxucuAdıSınağıSətirdənKənaraÇıxmamalıdır";
  const longListingTitle =
    "Azərbaycan ədəbiyyatından çox uzun kitab adı və xüsusi nəşr məlumatı";
  const seller = {
    id: sellerId,
    name: longSellerName,
    city: "Baku",
    created_at: timestamp,
  };
  const buyer = {
    id: userId,
    name: "Sınaq oxucusu",
    city: "Ganja",
    created_at: timestamp,
  };
  const listing = {
    id: listingId,
    title: longListingTitle,
    author: "Əbdürrəhim bəy Haqverdiyev",
    description: "Yaxşı saxlanmış fiziki kitab nüsxəsi.",
    price: 17.5,
    category: "Fiction",
    condition: "Very good",
    city: "Baku",
    status: "active",
    seller,
    images: [],
  };
  const room = {
    id: roomId,
    currentUserId: userId,
    buyer,
    seller,
    listing,
    unreadCount: 2,
    last_message_at: timestamp,
  };
  const messages = Array.from({ length: 18 }, (_, index) => ({
    id: `message-${index}`,
    sender_id: index % 2 ? userId : sellerId,
    text:
      index === 0
        ? "Kitab hələ satışdadır və vəziyyəti elandakı təsvirə uyğundur."
        : `Söhbət mesajı ${index + 1}`,
    created_at: timestamp,
  }));
  const notifications = [
    {
      id: "55555555-5555-4555-8555-555555555555",
      type: "MESSAGE",
      payload: { roomId, preview: "Kitab hələ satışdadır." },
      read: false,
      created_at: timestamp,
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      type: "SYSTEM",
      payload: { listingId, event: "listing.approved" },
      read: true,
      created_at: timestamp,
    },
  ];

  let roomListGets = 0;
  let roomDetailGets = 0;
  let notificationGets = 0;
  let notificationPatches = 0;
  let messagePosts = 0;

  await page.route("**/api/chat/rooms", async (route) => {
    roomListGets += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: [room] }),
    });
  });
  await page.route(`**/api/chat/rooms/${roomId}`, async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { roomId } }),
      });
      return;
    }
    roomDetailGets += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { ...room, messages } }),
    });
  });
  await page.route("**/api/chat/message", async (route) => {
    messagePosts += 1;
    const submitted = route.request().postDataJSON() as {
      roomId: string;
      text: string;
    };
    expect(submitted).toEqual({ roomId, text: "Salam, kitabı görmək istərdim." });
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "77777777-7777-4777-8777-777777777777",
          sender_id: userId,
          text: submitted.text,
          created_at: timestamp,
        },
      }),
    });
  });
  await page.route("**/api/notifications", async (route) => {
    if (route.request().method() === "PATCH") {
      notificationPatches += 1;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { updated: 1 } }),
      });
      return;
    }
    notificationGets += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: notifications }),
    });
  });

  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: "Mesajlar." })).toBeVisible();
  const conversationList = page.getByRole("list", { name: "Söhbətlər" });
  await expect(conversationList).toContainText(longSellerName);
  await expect(conversationList).toContainText(longListingTitle);
  await expect(conversationList).toContainText("14 iyl 2026, 22:05");
  await expect.poll(() => roomListGets).toBe(1);
  expect(
    await conversationList.locator("time").first().evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    ),
  ).toBeGreaterThanOrEqual(12);
  expect(
    await conversationList.locator("b").first().evaluate((element) =>
      getComputedStyle(element).textOverflow,
    ),
  ).not.toBe("ellipsis");
  expect(await horizontalOverflow(page)).toEqual([]);
  const messagesResizeStyle = await page.addStyleTag({
    content: "html { font-size: 200% !important; }",
  });
  expect(await horizontalOverflow(page)).toEqual([]);
  await messagesResizeStyle.evaluate((element) =>
    element.parentNode?.removeChild(element),
  );

  await page.goto("/notifications");
  await expect(
    page.getByRole("heading", { name: "Bildirişlər." }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Bildirişlər siyahısı" }),
  ).toContainText("14 iyl 2026, 22:05");
  await expect.poll(() => notificationGets).toBe(1);
  const markAll = page.getByRole("button", { name: "Hamısını oxunmuş et" });
  const markAllBounds = await markAll.boundingBox();
  expect(markAllBounds?.height).toBeGreaterThanOrEqual(44);
  await markAll.click();
  await expect.poll(() => notificationPatches).toBe(1);
  const markedStatus = page.getByText(
    "Bütün bildirişlər oxunmuş kimi qeyd edildi.",
    { exact: true },
  );
  await expect(markedStatus).toBeFocused();
  await expect(page.getByText("Oxunmayıb", { exact: true })).toHaveCount(0);
  expect(await horizontalOverflow(page)).toEqual([]);
  const notificationsResizeStyle = await page.addStyleTag({
    content: "html { font-size: 200% !important; }",
  });
  expect(await horizontalOverflow(page)).toEqual([]);
  await notificationsResizeStyle.evaluate((element) =>
    element.parentNode?.removeChild(element),
  );

  await page.goto(`/chat/${roomId}`);
  await expect(page.getByRole("heading", { name: longSellerName })).toBeVisible();
  const transcript = page.getByRole("log", { name: "BookSwap söhbəti" });
  await expect(transcript).toContainText(`${longSellerName}:`);
  await expect(transcript).toContainText("Siz:");
  await transcript.focus();
  await expect(transcript).toBeFocused();
  expect(
    await transcript.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).outlineWidth),
    ),
  ).toBeGreaterThanOrEqual(3);
  expect(
    await transcript.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  await expect.poll(() => roomDetailGets).toBe(1);
  const listingLink = page.getByRole("link", { name: longListingTitle }).first();
  const listingLinkBounds = await listingLink.boundingBox();
  expect(listingLinkBounds?.height).toBeGreaterThanOrEqual(24);

  const composer = page.getByLabel("Mesaj", { exact: true });
  await composer.fill("Birinci sətir");
  await composer.press("Shift+Enter");
  await expect(composer).toHaveValue("Birinci sətir\n");
  expect(messagePosts).toBe(0);
  await composer.fill("Salam, kitabı görmək istərdim.");
  const sendButton = page.getByRole("button", { name: "Mesaj göndər" });
  const sendBounds = await sendButton.boundingBox();
  expect(sendBounds?.height).toBeGreaterThanOrEqual(44);
  await composer.press("Enter");
  await expect.poll(() => messagePosts).toBe(1);
  await expect(composer).toHaveValue("");
  await expect(composer).toBeFocused();
  await expect(transcript).toContainText("Salam, kitabı görmək istərdim.");
  expect(await horizontalOverflow(page)).toEqual([]);
  const chatResizeStyle = await page.addStyleTag({
    content: "html { font-size: 200% !important; }",
  });
  expect(await horizontalOverflow(page)).toEqual([]);
  await chatResizeStyle.evaluate((element) =>
    element.parentNode?.removeChild(element),
  );
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
  await page.setViewportSize({ width: 320, height: 800 });
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
  const progress = page.getByRole("list", {
    name: "Elan yaratma addımları",
  });
  await expect(progress).toBeVisible();
  await expect(progress.getByLabel("1/4: Kitab məlumatları")).toHaveAttribute(
    "aria-current",
    "step",
  );
  const titleInput = page.getByLabel("Kitabın adı");
  await page.getByRole("button", { name: "Davam et" }).click();
  await expect(titleInput).toBeFocused();
  await expect(titleInput).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#listing-form-error")).toContainText(
    "Kitabın adını ən azı 2 simvolla yaz.",
  );
  await titleInput.fill("Sınaq kitabı");
  await page.getByLabel("Müəllif / mövzu").fill("Sınaq müəllifi");
  await page
    .getByLabel("Təsvir")
    .fill("Kitabın vəziyyəti haqqında kifayət qədər ətraflı qeyd.");
  await page.getByRole("button", { name: "Davam et" }).click();
  await expect(
    page.getByRole("heading", { name: "Kitabın vəziyyəti necədir?" }),
  ).toBeFocused();
  await expect(page.getByRole("button", { name: "Çox yaxşı" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const conditionBounds = await page
    .getByRole("button", { name: "Çox yaxşı" })
    .boundingBox();
  expect(conditionBounds?.height).toBeGreaterThanOrEqual(44);
  await page.getByRole("button", { name: "Davam et" }).click();
  const photosHeading = page.getByRole("heading", {
    name: "Kitabın real nüsxəsini göstər.",
  });
  await expect(photosHeading).toBeFocused();
  await expect(page.getByLabel("Qiymət (AZN)")).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.focus();
  const pickerOutline = await fileInput
    .locator("..")
    .evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(pickerOutline).not.toBe("none");
  await fileInput.setInputFiles({
    name: "kitab.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  const imageError = page.locator("#listing-form-error");
  await expect(imageError).toBeVisible();
  await expect(fileInput).toBeFocused();
  await expect(fileInput).toHaveAttribute("aria-invalid", "true");

  const authoringTargets = [
    page.getByRole("link", { name: "Ləğv et" }),
    page.getByRole("button", { name: "Geri" }),
    page.getByRole("button", { name: "Davam et" }),
  ];
  for (const target of authoringTargets) {
    const bounds = await target.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
});

test("listing editing exposes named loading, photos, targets, and reflow", async ({
  page,
}) => {
  const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const sellerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route(`**/api/listings/${listingId}`, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: listingId,
          title: "Dar görünüş üçün uzun Azərbaycan kitab başlığı",
          author: "Sınaq müəllifi",
          description:
            "Kitabın vəziyyətini və nəşr məlumatını aydın izah edən təsvir.",
          price: 17.5,
          images: ["/icon.svg"],
          category: "Fiction",
          condition: "Very good",
          city: "Baku",
          status: "active",
          sellerId,
          seller: { id: sellerId, name: "Sınaq oxucusu" },
        },
      }),
    });
  });

  await page.goto(`/listings/${listingId}/edit`);
  await expect(
    page.getByRole("heading", {
      name: "Kitab məlumatlarını redaktə et.",
    }),
  ).toBeVisible();
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "false");
  await expect(
    page.getByRole("group", { name: "Elanın şəkilləri" }),
  ).toBeVisible();

  const editTargets = [
    page.getByRole("link", { name: "Kitab rəfim" }),
    page.getByRole("button", { name: "Cari şəkli sil 1" }),
    page.getByRole("button", { name: "Dəyişiklikləri yadda saxla" }),
  ];
  for (const target of editTargets) {
    const bounds = await target.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
});

test("authentication modes and password validation are Azerbaijani", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
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
  const signupHeading = page.getByRole("heading", {
    name: "Yeni hekayələrə yer aç.",
  });
  await expect(signupHeading).toBeFocused();
  await expect(page.getByLabel("Ad", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Ad", { exact: true })).toHaveAttribute(
    "autocomplete",
    "name",
  );
  await expect(page.getByLabel("E-poçt ünvanı")).toHaveAttribute(
    "autocomplete",
    "email",
  );
  await expect(page.getByLabel("Parol", { exact: true })).toHaveAttribute(
    "autocomplete",
    "new-password",
  );
  await page.getByRole("button", { name: "Hesabın var? Daxil ol" }).click();
  await expect(
    page.getByRole("heading", { name: "Kitab rəfinə daxil ol." }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Parolu unutmusunuz?" }).click();
  const recoveryHeading = page.getByRole("heading", {
    name: "Parolunu yenilə.",
  });
  await expect(recoveryHeading).toBeFocused();
  await expect(page.getByLabel("Parol", { exact: true })).toHaveCount(0);
  const recoveryAction = page.getByRole("button", {
    name: "Bərpa keçidini göndər",
  });
  const recoveryBounds = await recoveryAction.boundingBox();
  expect(recoveryBounds?.height).toBeGreaterThanOrEqual(44);
  expect(await horizontalOverflow(page)).toEqual([]);

  await page.goto("/reset-password");
  await page.getByLabel("Yeni parol").fill("abcdefgh");
  await page.getByLabel("Parolu təkrar et").fill("abcdEFGH");
  await page.getByRole("button", { name: "Parolu yenilə" }).click();
  await expect(
    page.getByText("Parollar eyni deyil.", { exact: true }),
  ).toBeVisible();
  const confirmation = page.getByLabel("Parolu təkrar et");
  await expect(confirmation).toBeFocused();
  await expect(confirmation).toHaveAttribute("aria-invalid", "true");
  await expect(confirmation).toHaveAttribute(
    "aria-describedby",
    "reset-password-status",
  );
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
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
