import { expect, test, type Page, type Route } from "@playwright/test";
import { AZ_COPY } from "../../lib/i18n";

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
  await page.goto("/listings", { waitUntil: "domcontentloaded" });

  await expect(page.locator("a button")).toHaveCount(0);
  const controls = [
    page.getByLabel("Ad, müəllif və ya ISBN ilə axtar"),
    page.getByLabel("Məkana görə filtrlə"),
    page.getByLabel("Vəziyyətə görə filtrlə"),
    page.getByLabel("AZN ilə maksimum qiymət"),
    page.getByLabel("Elanları sırala"),
  ];
  for (const control of controls) {
    await expect(control).toBeVisible();
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

test("public marketplace failures stay localized and runtime safe", async ({
  page,
}) => {
  const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const sellerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const apiRequests: string[] = [];
  let scenario: "home" | "catalog" | "detail" | "seller" = "home";

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("Failed to load resource")
    )
      consoleErrors.push(message.text());
  });
  await page.route("**/api/listings**", async (route) => {
    const url = new URL(route.request().url());
    apiRequests.push(`${scenario}:${url.pathname}`);
    if (scenario === "home") {
      await route.fulfill({
        status: 503,
        contentType: "text/plain",
        body: "provider stack detail must stay private",
      });
      return;
    }
    if (scenario === "catalog") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { items: {}, nextCursor: null } }),
      });
      return;
    }
    if (url.pathname === `/api/listings/${listingId}`) {
      await route.fulfill({
        contentType: "application/json",
        body: "{invalid-json",
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { items: [], nextCursor: null } }),
    });
  });
  await page.route("**/api/sellers/**", async (route) => {
    apiRequests.push(`${scenario}:${new URL(route.request().url()).pathname}`);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: { seller: { id: sellerId }, items: [], nextCursor: null },
      }),
    });
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: AZ_COPY.home.featuredEmptyTitle }),
  ).toBeVisible();
  await expect(
    page.getByText(AZ_COPY.global.listingsUnavailable, { exact: true }),
  ).toBeVisible();

  scenario = "catalog";
  await page.goto("/listings");
  await expect(
    page.getByRole("heading", { name: AZ_COPY.catalog.emptyTitle }),
  ).toBeVisible();
  await expect(
    page.getByText(AZ_COPY.global.listingsUnavailable, { exact: true }),
  ).toBeVisible();

  scenario = "detail";
  await page.goto(`/listings/${listingId}`);
  await expect(
    page.getByRole("heading", {
      name: AZ_COPY.listingDetail.unavailableTitle,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(AZ_COPY.listingDetail.unavailableBody, { exact: true }),
  ).toBeVisible();

  scenario = "seller";
  await page.goto(`/sellers/${sellerId}`);
  await expect(
    page.getByRole("heading", {
      name: AZ_COPY.seller.unavailableTitle,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(AZ_COPY.seller.unavailable, { exact: true }),
  ).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain("provider stack detail");
  expect(bodyText).not.toContain("invalid-json");
  expect(bodyText).not.toContain("Unexpected token");
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(apiRequests.sort()).toEqual(
    [
      "home:/api/listings",
      "catalog:/api/listings",
      `detail:/api/listings/${listingId}`,
      "detail:/api/listings",
      `seller:/api/sellers/${sellerId}`,
    ].sort(),
  );

  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
});

test("marketplace covers use responsive lazy optimizer candidates", async ({
  page,
}) => {
  const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01";
  const remoteCover =
    "https://fixture.supabase.co/storage/v1/object/public/listing-images/reader/cover.jpg";
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );

  await page.route("**/api/listings**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          items: [
            {
              id: listingId,
              title: "Optimallaşdırılmış kitab üz qabığı",
              author: "Sınaq müəllifi",
              description: "Performans sınağı",
              price: 20,
              category: "Fiction",
              condition: "Like new",
              city: "Baku",
              status: "active",
              sellerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              seller: {
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                name: "Sınaq satıcısı",
              },
              color: "#6a3327",
              accent: "#e6cb8a",
              images: [remoteCover],
            },
          ],
          nextCursor: null,
        },
      }),
    });
  });
  await page.route("**/_next/image**", async (route) => {
    await route.fulfill({ contentType: "image/png", body: onePixelPng });
  });

  await page.goto("/listings", { waitUntil: "domcontentloaded" });
  const cover = page.locator(".book-card img").first();
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("loading", "lazy");
  await expect(cover).toHaveAttribute("sizes", /42vw/);
  await expect(cover).toHaveAttribute("srcset", /_next\/image\?url=/);
});

test("shared listing-card favorite failures stay context bound", async ({
  page,
}) => {
  const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const otherListingId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const favoriteRequests: Array<{ method: string; body: unknown }> = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  let releaseFavorite!: () => void;
  const favoriteResponseHeld = new Promise<void>((resolve) => {
    releaseFavorite = resolve;
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await installAuthenticatedUiFixture(page);
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.route("**/api/listings**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          items: [
            {
              id: listingId,
              title: "Kart cavab sərhədi sınağı",
              author: "Sınaq müəllifi",
              description: "Yanlış resurs cavabı vəziyyəti dəyişməməlidir.",
              price: 18.5,
              category: "Fiction",
              condition: "Very good",
              city: "Baku",
              status: "active",
              sellerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              seller: {
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                name: "Sınaq satıcısı",
              },
              images: [],
            },
          ],
          nextCursor: null,
        },
      }),
    });
  });
  await page.route("**/api/favorites", async (route) => {
    const request = route.request();
    favoriteRequests.push({
      method: request.method(),
      body: request.postDataJSON(),
    });
    await favoriteResponseHeld;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: { listingId: otherListingId, saved: true },
        diagnostic: "provider-secret-detail",
      }),
    });
  });

  await page.goto("/listings", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Kart cavab sərhədi sınağı" }),
  ).toBeVisible();
  const favorite = page.getByRole("button", {
    name: AZ_COPY.listingCard.save,
  });
  await expect(favorite).toHaveAttribute("aria-pressed", "false");
  await favorite.click();
  await expect(favorite).toBeFocused();
  await expect(favorite).toHaveAttribute("aria-busy", "true");
  await favorite.dispatchEvent("click");
  await expect.poll(() => favoriteRequests.length).toBe(1);
  releaseFavorite();

  await expect(
    page
      .getByRole("status")
      .filter({ hasText: AZ_COPY.listingCard.favoriteFailed }),
  ).toBeVisible();
  await expect(favorite).toBeFocused();
  await expect(favorite).toHaveAttribute("aria-pressed", "false");
  await expect(favorite).toHaveAttribute("aria-busy", "false");
  await expect(page).toHaveURL(/\/listings$/);
  await expect(page.locator("body")).not.toContainText(
    "provider-secret-detail",
  );
  expect(favoriteRequests).toEqual([{ method: "POST", body: { listingId } }]);
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
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
  await expect(
    page.getByRole("button", { name: AZ_COPY.listingDetail.markSold }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: AZ_COPY.listingDetail.deleteListing }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: AZ_COPY.listingDetail.editListing }),
  ).toHaveCount(0);

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

test("listing owner can confirm sold, relist, and safely remove without double submission", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAuthenticatedUiFixture(page);
  const ownerId = "11111111-1111-4111-8111-111111111111";
  const listingId = "44444444-4444-4444-8444-444444444444";
  const lifecycleRequests: Array<{ method: string; body: unknown }> = [];
  const confirmations: string[] = [];
  const confirmationChoices: boolean[] = [];
  let currentStatus: "active" | "sold" = "active";
  let releaseDeletion!: () => void;
  const deletionGate = new Promise<void>((resolve) => {
    releaseDeletion = resolve;
  });
  const listing = () => ({
    id: listingId,
    title: "Sahib həyat dövrü kitabı",
    author: "Sınaq müəllifi",
    description: "Sahib əməliyyatlarını yoxlamaq üçün etibarlı elan təsviri.",
    price: 19,
    images: ["/icon.svg"],
    category: "Fiction",
    condition: "Good",
    city: "Baku",
    status: currentStatus,
    sellerId: ownerId,
    seller: {
      id: ownerId,
      name: "Sınaq oxucusu",
      initials: "SO",
      city: "Baku",
    },
    reviews: [],
  });

  page.on("dialog", (dialog) => {
    confirmations.push(dialog.message());
    const shouldAccept = confirmationChoices.shift() ?? false;
    void (shouldAccept ? dialog.accept() : dialog.dismiss());
  });
  await page.route("**/api/listings**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === `/api/listings/${listingId}`) {
      if (request.method() === "GET") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ data: listing() }),
        });
        return;
      }
      if (request.method() === "PATCH") {
        const body = request.postDataJSON() as { status: "active" | "sold" };
        lifecycleRequests.push({ method: "PATCH", body });
        currentStatus = body.status;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            data: listing(),
            imageCleanupPending: false,
          }),
        });
        return;
      }
      if (request.method() === "DELETE") {
        lifecycleRequests.push({ method: "DELETE", body: null });
        await deletionGate;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            listingId,
            removed: true,
            retainedForIntegrity: true,
          }),
        });
        return;
      }
    }
    if (url.pathname === "/api/listings") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [], nextCursor: null } }),
      });
      return;
    }
    await route.fallback();
  });
  await page.route("**/api/favorites**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { listingId, saved: false } }),
    });
  });

  await page.goto(`/listings/${listingId}`);
  await expect(page.getByRole("link", { name: "Redaktə et" })).toBeVisible();
  const soldAction = page.getByRole("button", { name: "Satıldı" });
  confirmationChoices.push(false);
  await soldAction.click();
  expect(lifecycleRequests).toHaveLength(0);
  expect(confirmations).toEqual([AZ_COPY.listingDetail.soldConfirm]);

  confirmationChoices.push(true);
  await soldAction.click();
  await expect(
    page.getByRole("button", { name: "Yenidən satışa çıxar" }),
  ).toBeVisible();
  await expect(page.getByText("Satılıb", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Redaktə et" })).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({
      hasText: AZ_COPY.listingDetail.soldComplete,
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Yenidən satışa çıxar" }).click();
  await expect(page.getByRole("button", { name: "Satıldı" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Redaktə et" })).toBeVisible();

  const deleteAction = page.getByRole("button", { name: "Elanı sil" });
  confirmationChoices.push(false);
  await deleteAction.click();
  expect(
    lifecycleRequests.filter((item) => item.method === "DELETE"),
  ).toHaveLength(0);
  expect(confirmations.at(-1)).toBe(AZ_COPY.listingDetail.deleteConfirm);

  confirmationChoices.push(true);
  await deleteAction.click();
  await expect(deleteAction).toBeDisabled();
  await deleteAction.dispatchEvent("click");
  await expect
    .poll(
      () => lifecycleRequests.filter((item) => item.method === "DELETE").length,
    )
    .toBe(1);
  releaseDeletion();
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingDetail.removedTitle }),
  ).toBeVisible();
  await expect(
    page.getByText(AZ_COPY.listingDetail.deleteComplete),
  ).toBeVisible();
  expect(lifecycleRequests).toEqual([
    { method: "PATCH", body: { status: "sold" } },
    { method: "PATCH", body: { status: "active" } },
    { method: "DELETE", body: null },
  ]);
  expect(await horizontalOverflow(page)).toEqual([]);
});

test("listing detail rejects cross-resource action acknowledgements without false success", async ({
  page,
}) => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const sellerId = "22222222-2222-4222-8222-222222222222";
  const otherId = "33333333-3333-4333-8333-333333333333";
  const activeListingId = "44444444-4444-4444-8444-444444444444";
  const soldListingId = "55555555-5555-4555-8555-555555555555";
  const actionRequests: Array<{
    method: string;
    path: string;
    body: unknown;
  }> = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await installAuthenticatedUiFixture(page);

  const listingData = (listingId: string, status: "active" | "sold") => ({
    id: listingId,
    title:
      status === "active"
        ? "Cavab sərhədi sınaq kitabı"
        : "Satılmış cavab sərhədi kitabı",
    author: "Sınaq müəllifi",
    description:
      "Autentifikasiya olunmuş əməliyyatların cavab sərhədini yoxlayan təsvir.",
    price: 18,
    images: ["/icon.svg"],
    category: "Fiction",
    condition: "Good",
    city: "Baku",
    status,
    sellerId,
    seller: {
      id: sellerId,
      name: "Sınaq satıcısı",
      initials: "SS",
      city: "Baku",
    },
    reviews: [],
  });

  await page.route("**/api/listings**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === `/api/listings/${activeListingId}`) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: listingData(activeListingId, "active") }),
      });
      return;
    }
    if (url.pathname === `/api/listings/${soldListingId}`) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: listingData(soldListingId, "sold") }),
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
  await page.route("**/api/favorites**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const body = request.postDataJSON?.() ?? null;
    actionRequests.push({
      method: request.method(),
      path: url.pathname,
      body,
    });
    const listingId = url.searchParams.get("listingId");
    if (request.method() === "GET" && listingId === activeListingId) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: { listingId: activeListingId, saved: false },
        }),
      });
      return;
    }
    if (request.method() === "GET" && listingId === soldListingId) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: { listingId: soldListingId, saved: "false" },
          diagnostic: "provider-secret-detail",
        }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: { listingId: otherId, saved: true },
        diagnostic: "provider-secret-detail",
      }),
    });
  });
  await page.route("**/api/chat/rooms", async (route) => {
    actionRequests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "66666666-6666-4666-8666-666666666666",
          listing_id: activeListingId,
          buyer_id: userId,
          seller_id: otherId,
        },
        diagnostic: "provider-secret-detail",
      }),
    });
  });
  await page.route("**/api/reports", async (route) => {
    actionRequests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "77777777-7777-4777-8777-777777777777",
          listing_id: activeListingId,
          reporter_id: otherId,
          status: "open",
          created_at: "2026-07-26T10:00:00.000Z",
        },
        diagnostic: "provider-secret-detail",
      }),
    });
  });
  await page.route("**/api/review", async (route) => {
    actionRequests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "88888888-8888-4888-8888-888888888888",
          listing_id: otherId,
          author_id: userId,
          rating: 4,
          comment: "Sərhəd sınağı rəyi",
          created_at: "2026-07-26T10:00:00.000Z",
        },
        diagnostic: "provider-secret-detail",
      }),
    });
  });

  await page.goto(`/listings/${activeListingId}`);
  await expect(
    page.getByRole("heading", { name: "Cavab sərhədi sınaq kitabı" }),
  ).toBeVisible();
  const favorite = page.getByRole("button", {
    name: AZ_COPY.listingDetail.save,
  });
  await expect(favorite).toBeEnabled();
  await favorite.click();
  await expect(favorite).toBeFocused();
  await expect(favorite).toHaveAttribute("aria-pressed", "false");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: AZ_COPY.listingDetail.favoriteFailed }),
  ).toBeVisible();

  const messageSeller = page.getByRole("button", {
    name: AZ_COPY.listingDetail.messageSeller,
  });
  await messageSeller.click();
  await expect(messageSeller).toBeFocused();
  await expect(
    page.getByRole("status").filter({ hasText: AZ_COPY.chat.startFailed }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/listings/${activeListingId}$`));

  await page.locator("summary").click();
  const reportReason = page.getByLabel(AZ_COPY.listingDetail.reportReason);
  const reportText = "Yanlış resursa bağlı şikayət cavabı sınağıdır.";
  await reportReason.fill(reportText);
  const reportButton = page.getByRole("button", {
    name: AZ_COPY.listingDetail.reportAction,
  });
  await reportButton.click();
  await expect(reportButton).toBeFocused();
  await expect(reportReason).toHaveValue(reportText);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: AZ_COPY.listingDetail.reportFailed }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    AZ_COPY.listingDetail.reportReceived,
  );

  await page.goto(`/listings/${soldListingId}`);
  await expect(
    page.getByRole("heading", { name: "Satılmış cavab sərhədi kitabı" }),
  ).toBeVisible();
  const unavailableFavorite = page.getByRole("button", {
    name: AZ_COPY.listingDetail.save,
  });
  await expect(unavailableFavorite).toBeDisabled();
  await expect(unavailableFavorite).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("status").filter({
      hasText: AZ_COPY.listingDetail.favoriteStateUnavailable,
    }),
  ).toBeVisible();

  await page.getByLabel(AZ_COPY.listingDetail.rating).selectOption("4");
  const reviewComment = page.getByLabel(AZ_COPY.listingDetail.comment);
  await reviewComment.fill("  Sərhəd sınağı rəyi  ");
  const reviewButton = page.getByRole("button", {
    name: AZ_COPY.listingDetail.publishReview,
  });
  await reviewButton.click();
  await expect(reviewButton).toBeFocused();
  await expect(reviewComment).toHaveValue("  Sərhəd sınağı rəyi  ");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: AZ_COPY.listingDetail.reviewFailed }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    AZ_COPY.listingDetail.reviewPublished,
  );
  await expect(
    page.locator("article").filter({ hasText: "Sərhəd sınağı rəyi" }),
  ).toHaveCount(0);

  await expect(page.locator("body")).not.toContainText(
    "provider-secret-detail",
  );
  expect(actionRequests).toEqual([
    { method: "GET", path: "/api/favorites", body: null },
    {
      method: "POST",
      path: "/api/favorites",
      body: { listingId: activeListingId },
    },
    {
      method: "POST",
      path: "/api/chat/rooms",
      body: { listingId: activeListingId },
    },
    {
      method: "POST",
      path: "/api/reports",
      body: { listingId: activeListingId, reason: reportText },
    },
    { method: "GET", path: "/api/favorites", body: null },
    {
      method: "POST",
      path: "/api/review",
      body: {
        listingId: soldListingId,
        rating: 4,
        comment: "Sərhəd sınağı rəyi",
      },
    },
  ]);
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
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

test("current legal pages and moderation appeal path are publicly reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const routes = [
    { path: "/terms", heading: /İstifadə şərtləri/i },
    {
      path: "/privacy",
      heading: /Məxfilik və fərdi məlumatların emalı siyasəti/i,
    },
    {
      path: "/marketplace-rules",
      heading: /Kitab bazarı və icma qaydaları/i,
    },
    {
      path: "/moderation-appeals",
      heading: /Moderasiya qərarına etiraz/i,
    },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator("html")).toHaveAttribute("lang", "az");
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Kitab bazarı və icma qaydaları" }).last(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Moderasiya etirazları" }).last(),
    ).toBeVisible();
    expect(await horizontalOverflow(page)).toEqual([]);
  }

  await expect(
    page.getByText(/şifrə, təsdiq kodu, kart məlumatı/i),
  ).toBeVisible();
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
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
          requesterId: "11111111-1111-4111-8111-111111111111",
          data: { name: "Yenilənmiş oxucu", city: "Bakı", phone: null },
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
          requesterId: "11111111-1111-4111-8111-111111111111",
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

test("authenticated privacy controls hydrate before interaction", async ({
  page,
}) => {
  await installAuthenticatedUiFixture(page);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  let privacyGetCount = 0;

  page.on("pageerror", (error) =>
    pageErrors.push(error.stack ?? error.message),
  );
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.route("**/api/privacy-requests", async (route) => {
    privacyGetCount += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.goto("/user-rights");
  await expect(
    page.getByRole("heading", { name: AZ_COPY.privacyRequests.recent }),
  ).toBeVisible();
  await expect(page.getByText(AZ_COPY.privacyRequests.empty)).toBeVisible();
  await expect(page.getByLabel(AZ_COPY.privacyRequests.details)).toBeEditable();

  expect(privacyGetCount).toBe(1);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("profile save and privacy submission reject cross-identity acknowledgements", async ({
  browser,
}) => {
  const ownerId = "11111111-1111-4111-8111-111111111111";
  const wrongOwnerId = "99999999-9999-4999-8999-999999999999";
  const profileRequests: Array<Record<string, unknown>> = [];
  const privacyRequests: Array<Record<string, unknown>> = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  let releaseProfile!: () => void;
  let releasePrivacy!: () => void;
  const firstProfileGate = new Promise<void>((resolve) => {
    releaseProfile = resolve;
  });
  const firstPrivacyGate = new Promise<void>((resolve) => {
    releasePrivacy = resolve;
  });
  const handleProfileRoute = async (route: Route) => {
    if (route.request().method() === "PATCH") {
      const submitted = JSON.parse(
        route.request().postData() ?? "{}",
      ) as Record<string, unknown>;
      profileRequests.push(submitted);
      if (profileRequests.length === 1) await firstProfileGate;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          requesterId: wrongOwnerId,
          data: submitted,
          diagnostic: "private profile provider detail",
        }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          profile: { name: "Sınaq oxucusu", city: "Baku", phone: null },
          favoriteCount: 0,
          listings: [],
        },
      }),
    });
  };
  const handlePrivacyRoute = async (route: Route) => {
    if (route.request().method() === "POST") {
      const submitted = JSON.parse(
        route.request().postData() ?? "{}",
      ) as Record<string, unknown>;
      privacyRequests.push(submitted);
      if (privacyRequests.length === 1) await firstPrivacyGate;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          requesterId: wrongOwnerId,
          data: {
            id: "44444444-4444-4444-8444-444444444444",
            type: submitted.type,
            status: "open",
            created_at: "2026-07-27T10:00:00.000Z",
          },
          diagnostic: "private privacy provider detail",
        }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  };

  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ];

  for (let index = 0; index < viewports.length; index += 1) {
    const viewport = viewports[index];
    const page = await browser.newPage({ viewport });
    let navigationContext = `profile viewport ${index + 1}`;
    await installAuthenticatedUiFixture(page);
    page.on("pageerror", (error) =>
      pageErrors.push(
        `${navigationContext} (${new URL(page.url()).pathname}): ${error.stack ?? error.message}`,
      ),
    );
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.route("**/api/profile", handleProfileRoute);
    await page.route("**/api/privacy-requests", handlePrivacyRoute);

    await page.goto("/profile");
    await page.getByRole("tab", { name: AZ_COPY.profile.tabs.profile }).click();
    const nameInput = page.getByLabel(AZ_COPY.profile.name, { exact: true });
    const submittedName = `Sınaq oxucusu ${index + 1}`;
    await nameInput.fill(submittedName);
    const saveButton = page
      .locator("form")
      .filter({ has: nameInput })
      .locator('button[type="submit"]');
    await saveButton.click();
    if (index === 0) {
      await expect(saveButton).toBeFocused();
      await expect(saveButton).toHaveAttribute("aria-disabled", "true");
      await saveButton.evaluate((element) => (element as HTMLElement).click());
      await expect.poll(() => profileRequests.length).toBe(1);
      releaseProfile();
    }
    const profileFeedback = page.locator("#profile-dashboard-feedback");
    await expect(profileFeedback).toHaveText(AZ_COPY.profile.profileSaveFailed);
    await expect(profileFeedback).toBeFocused();
    await expect(nameInput).toHaveValue(submittedName);
    await expect(page.getByText(AZ_COPY.profile.profileSaved)).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(
      "private profile provider detail",
    );
    await expect(saveButton).toHaveAttribute("aria-disabled", "false");
    expect(await horizontalOverflow(page)).toEqual([]);
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    expect(await horizontalOverflow(page)).toEqual([]);

    navigationContext = `privacy viewport ${index + 1}`;
    await page.goto("/user-rights");
    const details = page.getByLabel(AZ_COPY.privacyRequests.details);
    const submittedDetails = `Şəxsi məlumat sorğusu ${index + 1} üçün kifayət qədər ətraflı mətn.`;
    await details.fill(submittedDetails);
    const submitButton = page
      .locator("form")
      .filter({ has: details })
      .locator('button[type="submit"]');
    await submitButton.click();
    if (index === 0) {
      await expect(submitButton).toBeFocused();
      await expect(submitButton).toHaveAttribute("aria-disabled", "true");
      await submitButton.evaluate((element) =>
        (element as HTMLElement).click(),
      );
      await expect.poll(() => privacyRequests.length).toBe(1);
      releasePrivacy();
    }
    const privacyFeedback = page
      .locator('p[role="alert"]')
      .filter({ hasText: AZ_COPY.privacyRequests.failed });
    await expect(privacyFeedback).toBeFocused();
    await expect(details).toHaveValue(submittedDetails);
    await expect(page.getByText(AZ_COPY.privacyRequests.submitted)).toHaveCount(
      0,
    );
    await expect(page.locator("body")).not.toContainText(
      "private privacy provider detail",
    );
    await expect(submitButton).toHaveAttribute("aria-disabled", "false");
    expect(await horizontalOverflow(page)).toEqual([]);
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    expect(await horizontalOverflow(page)).toEqual([]);
    await page.close();
  }

  expect(profileRequests).toHaveLength(viewports.length);
  expect(privacyRequests).toHaveLength(viewports.length);
  for (let index = 0; index < profileRequests.length; index += 1) {
    const request = profileRequests[index];
    expect(request).toEqual({
      name: `Sınaq oxucusu ${index + 1}`,
      city: "Bakı",
      phone: null,
    });
  }
  for (let index = 0; index < privacyRequests.length; index += 1) {
    const request = privacyRequests[index];
    expect(request).toEqual({
      type: "access",
      details: `Şəxsi məlumat sorğusu ${index + 1} üçün kifayət qədər ətraflı mətn.`,
    });
  }
  expect(ownerId).not.toBe(wrongOwnerId);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("profile listing mutations reject cross-resource and malformed acknowledgements", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await installAuthenticatedUiFixture(page);
  const ownerId = "11111111-1111-4111-8111-111111111111";
  const listingId = "22222222-2222-4222-8222-222222222222";
  const wrongListingId = "33333333-3333-4333-8333-333333333333";
  const listing = {
    id: listingId,
    title: "Kabinet sərhədi kitabı",
    author: "Sınaq müəllifi",
    description: "Profil elan əməliyyatı üçün etibarlı sınaq təsviri.",
    price: 17.5,
    images: ["/icon.svg"],
    category: "Fiction",
    condition: "Very good",
    city: "Baku",
    status: "active",
    sellerId: ownerId,
    seller: { id: ownerId, name: "Sınaq oxucusu" },
  };
  const statusRequests: string[] = [];
  const deleteRequests: string[] = [];
  const confirmations: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  let releaseStatus!: () => void;
  const statusGate = new Promise<void>((resolve) => {
    releaseStatus = resolve;
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("dialog", (dialog) => {
    confirmations.push(dialog.message());
    void dialog.accept();
  });
  await page.route("**/api/profile", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          profile: { name: "Sınaq oxucusu", city: "Baku", phone: null },
          favoriteCount: 0,
          listings: [listing],
        },
      }),
    });
  });
  await page.route(`**/api/listings/${listingId}`, async (route) => {
    const method = route.request().method();
    if (method === "PATCH") {
      statusRequests.push(route.request().postData() ?? "");
      await statusGate;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: { ...listing, id: wrongListingId, status: "sold" },
          imageCleanupPending: false,
          diagnostic: "private status provider detail",
        }),
      });
      return;
    }
    if (method === "DELETE") {
      deleteRequests.push(route.request().url());
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          listingId,
          removed: true,
          retainedForIntegrity: "true",
          diagnostic: "private cleanup provider detail",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/profile");
  await expect(page.getByText(listing.title, { exact: true })).toBeVisible();
  const statusButton = page.getByRole("button", { name: "Satıldı" });
  await statusButton.click();
  await expect(statusButton).toBeFocused();
  await expect(statusButton).toHaveAttribute("aria-disabled", "true");
  await statusButton.evaluate((element) => (element as HTMLElement).click());
  await expect.poll(() => statusRequests.length).toBe(1);
  releaseStatus();
  const feedback = page.locator("#profile-dashboard-feedback");
  await expect(feedback).toHaveText(
    "Elanın vəziyyətini dəyişmək mümkün olmadı.",
  );
  await expect(feedback).toBeFocused();
  expect(statusRequests).toEqual([JSON.stringify({ status: "sold" })]);
  expect(confirmations).toEqual([AZ_COPY.profile.soldConfirm]);
  await expect(statusButton).toHaveAttribute("aria-disabled", "false");
  await expect(page.getByText(listing.title, { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/profile$/);

  await page
    .getByRole("button", { name: `Elanı sil: ${listing.title}` })
    .click();
  await expect(feedback).toHaveText("Elanı silmək mümkün olmadı.");
  await expect(feedback).toBeFocused();
  expect(deleteRequests).toHaveLength(1);
  expect(confirmations).toEqual([
    AZ_COPY.profile.soldConfirm,
    AZ_COPY.profile.deleteConfirm,
  ]);
  await expect(page.getByText(listing.title, { exact: true })).toBeVisible();
  await expect(page.getByText(/təmizləmə növbəsindədir/i)).toHaveCount(0);
  await expect(page.getByText(/private .* provider detail/i)).toHaveCount(0);
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("private account failures reject malformed success responses", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await installAuthenticatedUiFixture(page);
  const apiRequests: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      ["/api/profile", "/api/privacy-requests", "/api/favorites"].includes(
        url.pathname,
      )
    )
      apiRequests.push(url.pathname);
  });

  await page.route("**/api/profile", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          profile: { name: null, phone: null, city: "Baku" },
          listings: {},
          favoriteCount: "2",
        },
        diagnostic: "provider-secret-detail",
      }),
    });
  });
  await page.route("**/api/privacy-requests", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            type: "access",
            status: "open",
            created_at: "not-a-date",
          },
        ],
        diagnostic: "provider-secret-detail",
      }),
    });
  });
  await page.route("**/api/favorites", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {},
        diagnostic: "provider-secret-detail",
      }),
    });
  });

  await page.goto("/profile");
  const profileError = page
    .getByRole("alert")
    .filter({ hasText: AZ_COPY.profile.unavailableBody });
  await expect(
    page.getByRole("heading", {
      name: AZ_COPY.profile.unavailableTitle,
      level: 1,
    }),
  ).toBeVisible();
  await expect(profileError).toBeFocused();
  await expect(page.locator("body")).not.toContainText(
    "provider-secret-detail",
  );
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);

  await page.goto("/user-rights");
  const privacyError = page
    .locator('p[role="alert"]')
    .filter({ hasText: AZ_COPY.privacyRequests.loadFailed });
  await expect(privacyError).toBeVisible();
  await expect(privacyError).toBeFocused();
  await expect(page.locator("body")).not.toContainText("not-a-date");
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);

  await page.goto("/favorites");
  await expect(
    page.getByRole("heading", {
      name: AZ_COPY.favorites.unavailableTitle,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(AZ_COPY.favorites.unavailableBody, { exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    "provider-secret-detail",
  );
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);

  expect(apiRequests.sort()).toEqual(
    ["/api/profile", "/api/privacy-requests", "/api/favorites"].sort(),
  );
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
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
    expect(submitted).toEqual({
      roomId,
      text: "Salam, kitabı görmək istərdim.",
    });
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
    await conversationList
      .locator("time")
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      ),
  ).toBeGreaterThanOrEqual(12);
  expect(
    await conversationList
      .locator("b")
      .first()
      .evaluate((element) => getComputedStyle(element).textOverflow),
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
  await expect(
    page.getByRole("heading", { name: longSellerName }),
  ).toBeVisible();
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
  const listingLink = page
    .getByRole("link", { name: longListingTitle })
    .first();
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

test("administrator dashboard keeps protected reads signed out", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dashboardRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/admin/dashboard"))
      dashboardRequests.push(request.url());
  });

  await page.goto("/admin");
  await expect(page.locator("h1")).toHaveText(
    "İdarəetmə icazəsi tələb olunur.",
  );
  await expect(page).toHaveTitle(/İdarəetmə paneli/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );
  expect(dashboardRequests).toHaveLength(0);
});

test("administrator actions keep context, focus, targets, and 200% reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await installAuthenticatedUiFixture(page);

  const adminId = "11111111-1111-4111-8111-111111111111";
  const listingId = "22222222-2222-4222-8222-222222222222";
  const sellerId = "33333333-3333-4333-8333-333333333333";
  const reportId = "44444444-4444-4444-8444-444444444444";
  const privacyRequestId = "55555555-5555-4555-8555-555555555555";
  const moderationId = "66666666-6666-4666-8666-666666666666";
  const auditId = "77777777-7777-4777-8777-777777777777";
  const timestamp = "2026-07-14T18:05:00.000Z";
  const longReaderName =
    "NigarMəmmədovaÇoxUzunOxucuAdıSınağıSətirdənKənaraÇıxmamalıdır";
  const longListingTitle =
    "Azərbaycan ədəbiyyatından çox uzun kitab adı və xüsusi nəşr məlumatı";
  const longReportReason =
    "Elanın təsvirində fasiləsizuzunməlumatparçasıfasiləsizuzunməlumatparçası var";
  const listing = {
    id: listingId,
    title: longListingTitle,
    author: "Əbdürrəhim bəy Haqverdiyev",
    description: "Yaxşı saxlanmış fiziki kitab nüsxəsi.",
    price: 17.5,
    category: "Fiction",
    condition: "Very good",
    city: "Baku",
    status: "draft",
    seller: { id: sellerId, name: longReaderName },
    images: [],
  };
  const user = {
    id: sellerId,
    name: longReaderName,
    email: "very-long-administrator-reader-address@example.invalid",
    city: "Baku",
    banned: false,
    is_admin: false,
    created_at: timestamp,
  };
  const report = {
    id: reportId,
    listing_id: listingId,
    reason: longReportReason,
  };
  const dashboard = {
    listings: [listing],
    users: [
      {
        ...user,
        id: adminId,
        name: "Sınaq idarəçisi",
        email: "admin@example.invalid",
        is_admin: true,
      },
      user,
    ],
    reports: [report],
    privacyRequests: [
      {
        id: privacyRequestId,
        user_id: sellerId,
        type: "access",
        details:
          "Məlumatların ixracı üçün uzunməzmunuzunməzmunuzunməzmunu yoxlanmalıdır.",
        status: "open",
        created_at: timestamp,
      },
    ],
    moderationDecisions: [
      {
        id: moderationId,
        surface: "listing_create",
        target_id: listingId,
        content_type: "text",
        provider: "local_rules",
        outcome: "approved",
        reason_code: "LOCAL_RULES_CLEAR",
        categories: [],
        created_at: timestamp,
        actor: { id: adminId, name: "Sınaq idarəçisi" },
      },
    ],
    auditLog: [
      {
        id: auditId,
        actor_id: adminId,
        actor_name: "Sınaq idarəçisi",
        target_type: "report",
        target_id: reportId,
        action: "report.resolved",
        reason:
          "Sübutlara əsaslanan uzun idarəçi qərarı fasiləsizuzunsəbəbparçası ilə saxlanılıb.",
        before_state: { status: "open", resolvedAt: null },
        after_state: { status: "resolved", resolvedAt: timestamp },
        created_at: timestamp,
      },
    ],
  };

  let dashboardGets = 0;
  let reportPatches = 0;
  let actionPayload: unknown;
  await page.route("**/api/admin/dashboard", async (route) => {
    dashboardGets += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: dashboard }),
    });
  });
  await page.route("**/api/admin/reports", async (route) => {
    reportPatches += 1;
    actionPayload = route.request().postDataJSON();
    dashboard.reports = [];
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { id: reportId, status: "resolved" } }),
    });
  });

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Etibar və təhlükəsizlik." }),
  ).toBeVisible();
  await expect.poll(() => dashboardGets).toBe(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: "İdarəetmə bölmələri" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Son elanların moderasiya cədvəli",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Oxucu hesabları siyahısı" }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Açıq şikayətlər siyahısı" }),
  ).toContainText(longReportReason);

  const reason = page.getByLabel("Növbəti idarəçi əməliyyatının səbəbi");
  const resolveReport = page.getByRole("button", {
    name: `Həll et: ${longReportReason}`,
  });
  const resolveBounds = await resolveReport.boundingBox();
  expect(resolveBounds?.height).toBeGreaterThanOrEqual(44);
  await resolveReport.click();
  await expect(reason).toBeFocused();
  await expect(reason).toHaveAttribute("aria-invalid", "true");
  await expect(reason).toHaveAttribute(
    "aria-describedby",
    "admin-action-reason-help admin-action-feedback",
  );
  await expect(page.locator("#admin-action-feedback[role='alert']")).toHaveText(
    "Ən azı 10 simvoldan ibarət konkret səbəb yaz.",
  );

  const actionReason = "Şikayət sübutlarla yoxlanıldı və həll edildi.";
  await reason.fill(actionReason);
  await resolveReport.click();
  await expect.poll(() => reportPatches).toBe(1);
  expect(actionPayload).toEqual({
    reportId,
    status: "resolved",
    reason: actionReason,
  });
  await expect.poll(() => dashboardGets).toBe(2);
  await expect(page.getByText("Açıq şikayət yoxdur.")).toBeVisible();
  await expect(
    page.getByRole("status").filter({
      hasText: "İdarəçi əməliyyatı qeydə alındı.",
    }),
  ).toBeFocused();

  const moderationLink = page
    .getByRole("navigation", { name: "İdarəetmə bölmələri" })
    .getByRole("link", { name: AZ_COPY.admin.contentRuleDecisions });
  await moderationLink.click();
  const moderationHeading = page.getByRole("heading", {
    name: AZ_COPY.admin.contentRuleDecisions,
  });
  await expect(moderationHeading).toBeFocused();
  expect(
    await moderationHeading.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).outlineWidth),
    ),
  ).toBeGreaterThanOrEqual(3);

  const pageWidth = async () =>
    page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
  expect(await pageWidth()).toEqual({ client: 320, scroll: 320 });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await pageWidth()).toEqual({ client: 320, scroll: 320 });
  await expect(
    page
      .getByRole("list", { name: "Oxucu hesabları siyahısı" })
      .getByText(longReaderName, { exact: true }),
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

test("listing authoring failures reject malformed success responses", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await installAuthenticatedUiFixture(page);

  const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const otherListingId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const sellerId = "11111111-1111-4111-8111-111111111111";
  const uploadedUrl =
    "https://fixture.supabase.co/storage/v1/object/public/listing-images/11111111-1111-4111-8111-111111111111/book.png";
  const validListing = {
    id: listingId,
    title: "Cavab sərhədi kitabı",
    author: "Sınaq müəllifi",
    description: "Elan cavab sərhədini yoxlamaq üçün kifayət qədər təsvir.",
    price: 18,
    images: ["/icon.svg"],
    category: "Fiction",
    condition: "Very good",
    city: "Baku",
    status: "active",
    sellerId,
    seller: { id: sellerId, name: "Sınaq oxucusu" },
  };
  let scenario:
    | "upload-invalid-json"
    | "create-malformed"
    | "edit-load-wrong-id"
    | "edit-save-wrong-id" = "upload-invalid-json";
  let uploadPosts = 0;
  let listingPosts = 0;
  let cleanupDeletes = 0;
  let editPatches = 0;
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.route("**/api/upload", async (route) => {
    if (route.request().method() === "DELETE") {
      cleanupDeletes += 1;
      await route.fulfill({
        contentType: "application/json",
        body: "provider cleanup parser diagnostic",
      });
      return;
    }
    uploadPosts += 1;
    if (scenario === "upload-invalid-json") {
      await route.fulfill({
        contentType: "application/json",
        body: "provider upload parser diagnostic",
      });
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: [uploadedUrl] }),
    });
  });
  await page.route("**/api/listings", async (route) => {
    listingPosts += 1;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: { id: listingId },
        diagnostic: "provider create detail",
      }),
    });
  });
  await page.route(`**/api/listings/${listingId}`, async (route) => {
    if (route.request().method() === "PATCH") {
      editPatches += 1;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: { ...validListing, id: otherListingId },
          imageCleanupPending: false,
          diagnostic: "provider update detail",
        }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data:
          scenario === "edit-load-wrong-id"
            ? { ...validListing, id: otherListingId }
            : validListing,
        diagnostic: "provider load detail",
      }),
    });
  });

  async function prepareListingForPublication() {
    await page.goto("/listings/new");
    await page.getByLabel(AZ_COPY.listingForm.bookTitle).fill("Sınaq kitabı");
    await page.getByLabel(AZ_COPY.listingForm.author).fill("Sınaq müəllifi");
    await page
      .getByLabel(AZ_COPY.listingForm.description)
      .fill("Kitabın vəziyyəti haqqında kifayət qədər ətraflı sınaq qeydi.");
    await page
      .getByRole("button", { name: AZ_COPY.listingForm.continue })
      .click();
    await page
      .getByRole("button", { name: AZ_COPY.listingForm.continue })
      .click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "book.png",
      mimeType: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    });
    await page.getByLabel(AZ_COPY.listingForm.price).fill("18");
    await page
      .getByRole("button", { name: AZ_COPY.listingForm.continue })
      .click();
    await page
      .getByRole("button", { name: AZ_COPY.listingForm.publish })
      .click();
  }

  await prepareListingForPublication();
  const uploadError = page.locator("#listing-form-error");
  await expect(uploadError).toHaveText(AZ_COPY.listingForm.uploadFailed);
  await expect(uploadError).toBeFocused();
  await expect(page.locator("body")).not.toContainText(
    "provider upload parser diagnostic",
  );
  expect({ uploadPosts, listingPosts, cleanupDeletes }).toEqual({
    uploadPosts: 1,
    listingPosts: 0,
    cleanupDeletes: 0,
  });

  scenario = "create-malformed";
  await prepareListingForPublication();
  const createError = page.locator("#listing-form-error");
  await expect(createError).toContainText(AZ_COPY.listingForm.publishFailed);
  await expect(createError).toContainText(AZ_COPY.listingForm.cleanupFailed);
  await expect(createError).toBeFocused();
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingForm.publishedTitle }),
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    "provider create detail",
  );
  await expect(page.locator("body")).not.toContainText(
    "provider cleanup parser diagnostic",
  );
  expect({ uploadPosts, listingPosts, cleanupDeletes }).toEqual({
    uploadPosts: 2,
    listingPosts: 1,
    cleanupDeletes: 1,
  });

  scenario = "edit-load-wrong-id";
  await page.goto(`/listings/${listingId}/edit`);
  const loadError = page
    .getByRole("alert")
    .filter({ hasText: AZ_COPY.listingForm.editUnavailableBody });
  await expect(loadError).toContainText(
    AZ_COPY.listingForm.editUnavailableBody,
  );
  await expect(loadError).toBeFocused();
  await expect(page.locator("body")).not.toContainText("provider load detail");

  scenario = "edit-save-wrong-id";
  await page.goto(`/listings/${listingId}/edit`);
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingForm.editTitle }),
  ).toBeVisible();
  await page.getByLabel(AZ_COPY.listingForm.bookTitle).fill("Dəyişmiş başlıq");
  await page.getByRole("button", { name: AZ_COPY.listingForm.save }).click();
  const saveError = page.locator("#edit-listing-error");
  await expect(saveError).toHaveText(AZ_COPY.listingForm.saveFailed);
  await expect(saveError).toBeFocused();
  await expect(
    page.getByText(AZ_COPY.listingForm.saved, { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    "provider update detail",
  );
  expect(editPatches).toBe(1);

  expect(await horizontalOverflow(page)).toEqual([]);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await horizontalOverflow(page)).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
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
  await page.getByLabel("Yeni parol").fill("abcdefgh1234");
  await page.getByLabel("Parolu təkrar et").fill("abcdEFGH5678");
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

test("signup requires two separate current legal consents", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const signupBodies: unknown[] = [];
  await page.route("**/api/auth/signup", async (route) => {
    signupBodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ data: null, error: null, accepted: true }),
    });
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Yeni hesab yarat" }).click();
  await page.getByLabel("Ad", { exact: true }).fill("Sınaq Oxucusu");
  await page.getByLabel("E-poçt ünvanı").fill("reader@example.com");
  await page.getByLabel("Parol", { exact: true }).fill("BookSwapPass123");

  const terms = page.locator('input[name="termsAccepted"]');
  const privacy = page.locator('input[name="privacyAccepted"]');
  await expect(terms).not.toBeChecked();
  await expect(privacy).not.toBeChecked();
  await expect(terms).toHaveAttribute("required", "");
  await expect(privacy).toHaveAttribute("required", "");

  const createAccount = page.getByRole("button", { name: "Hesab yarat" });
  await createAccount.click();
  await expect(page.locator("#auth-form-error")).toContainText(
    "18+ yaş təsdiqini",
  );
  await expect(terms).toBeFocused();
  expect(signupBodies).toHaveLength(0);

  await terms.check();
  await createAccount.click();
  await expect(page.locator("#auth-form-error")).toContainText(
    "Məxfilik Siyasətini",
  );
  await expect(privacy).toBeFocused();
  expect(signupBodies).toHaveLength(0);

  await privacy.check();
  await createAccount.click();
  await expect(
    page.getByRole("heading", { name: "E-poçtunuzu yoxlayın." }),
  ).toBeVisible();
  expect(signupBodies).toEqual([
    expect.objectContaining({
      termsVersion: "2026-08-07",
      privacyVersion: "2026-08-07",
      marketplaceRulesVersion: "2026-08-07",
      age18PlusConfirmed: true,
      personalDataProcessingConsent: true,
      crossBorderTransferDisclosedAndConsented: true,
    }),
  ]);
});

test("current legal routes and footer disclosure remain reachable", async ({
  page,
  request,
}) => {
  await page.goto("/terms");
  await expect(
    page.getByRole("heading", { name: "İstifadə şərtləri" }),
  ).toBeVisible();
  await expect(page.getByText(/Versiya 2026-08-07/)).toBeVisible();
  await expect(page.locator("main")).toContainText("18 yaşı tamam olmuş");
  await expect(page.locator("main")).toContainText("satış komissiyası");
  await expect(page.locator("main")).toContainText("escrow");
  await expect(page.locator("footer")).toContainText("Suliddin Musa Əsədzadə");
  await expect(page.locator("footer")).toContainText("Suliddin677@gmail.com");

  for (const path of [
    "/terms",
    "/privacy",
    "/marketplace-rules",
    "/safety",
    "/user-rights",
    "/moderation-appeals",
  ]) {
    expect((await request.get(path)).status()).toBe(200);
  }

  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", {
      name: "Məxfilik və fərdi məlumatların emalı siyasəti",
    }),
  ).toBeVisible();
  await expect(page.getByText(/Versiya 2026-08-07/)).toBeVisible();

  await page.goto("/marketplace-rules");
  await expect(
    page.getByRole("heading", { name: "Kitab bazarı və icma qaydaları" }),
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

test("direct API validation and authentication errors keep Azerbaijani machine codes", async ({
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
  expect(invalidReview.status()).toBe(401);
  const invalidReviewBody = (await invalidReview.json()) as {
    error: string;
    code: string;
  };
  expect(invalidReviewBody.error).toBe("Davam etmək üçün daxil ol.");
  expect(invalidReviewBody.code).toBe("AUTH_REQUIRED");
});
