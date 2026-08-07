import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { AZ_COPY } from "../../lib/i18n";

const buyerId = "11111111-1111-4111-8111-111111111111";
const sellerId = "22222222-2222-4222-8222-222222222222";
const listingId = "33333333-3333-4333-8333-333333333333";
const roomId = "44444444-4444-4444-8444-444444444444";
const timestamp = "2026-08-01T18:05:00.000Z";

async function allowLocalHttpWebKit(
  context: BrowserContext,
  browserName: string,
) {
  if (browserName !== "webkit") return;
  await context.route("http://127.0.0.1:3000/**", async (route) => {
    if (route.request().resourceType() !== "document") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const headers = response.headers();
    delete headers["content-security-policy"];
    await route.fulfill({ response, headers });
  });
}

async function installAuthenticatedSession(page: Page) {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: buyerId,
    aud: "authenticated",
    role: "authenticated",
    email: "buyer@example.invalid",
    email_confirmed_at: timestamp,
    confirmed_at: timestamp,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { name: "Sınaq alıcısı" },
    identities: [],
    created_at: timestamp,
    updated_at: timestamp,
  };
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const session = {
    access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
      aud: "authenticated",
      exp: now + 3_600,
      iat: now,
      role: "authenticated",
      sub: user.id,
      email: user.email,
    })}.fixture`,
    token_type: "bearer",
    expires_in: 3_600,
    expires_at: now + 3_600,
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

function fixtureData() {
  const seller = {
    id: sellerId,
    name: "Sınaq satıcısı",
    city: null,
    created_at: timestamp,
  };
  const buyer = {
    id: buyerId,
    name: "Sınaq alıcısı",
    city: null,
    created_at: timestamp,
  };
  const listing = {
    id: listingId,
    title: "Mesajlaşma sınaq kitabı",
    author: "Sınaq müəllifi",
    description: "Mobil mesajlaşma axınını yoxlayan kifayət qədər uzun təsvir.",
    price: 18,
    images: [],
    category: "Fiction",
    condition: "Good",
    city: "Baku",
    status: "active",
    sellerId,
    seller: {
      id: seller.id,
      name: seller.name,
      city: "Baku",
    },
  };
  const room = {
    id: roomId,
    currentUserId: buyerId,
    buyer,
    seller,
    listing,
    unreadCount: 0,
    last_message_at: timestamp,
  };
  return { buyer, listing, room, seller };
}

test.beforeEach(async ({ context, browserName, page }) => {
  await allowLocalHttpWebKit(context, browserName);
  await page.setViewportSize({ width: 390, height: 844 });
  await installAuthenticatedSession(page);
});

test("mobile buyer starts, retries, opens, and messages a seller with null profile fields", async ({
  page,
}) => {
  const { listing, room } = fixtureData();
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      failedResponses.push(`${response.status()} ${response.url()}`);
  });

  let roomStarts = 0;
  let roomDetailGets = 0;
  let messagePosts = 0;
  let relatedListingsGets = 0;
  await page.addInitScript((failedRoomId) => {
    const originalFetch = window.fetch.bind(window);
    let failOnce = true;
    window.fetch = async (input, init) => {
      const request = new Request(input, init);
      if (
        failOnce &&
        request.method === "GET" &&
        new URL(request.url).pathname === `/api/chat/rooms/${failedRoomId}`
      ) {
        failOnce = false;
        return new Response(
          JSON.stringify({
            error: "Söhbət xidməti müvəqqəti əlçatan deyil.",
            code: "CHAT_UNAVAILABLE",
          }),
          {
            status: 503,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return originalFetch(input, init);
    };
  }, roomId);
  await page.route(`**/api/listings/${listingId}`, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { ...listing, reviews: [] } }),
    });
  });
  await page.route(/\/api\/listings(?:\?.*)?$/, async (route) => {
    relatedListingsGets += 1;
    expect(route.request().method()).toBe("GET");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { items: [], nextCursor: null } }),
    });
  });
  await page.route("**/api/favorites?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { listingId, saved: false } }),
    });
  });
  await page.route("**/api/chat/rooms", async (route) => {
    roomStarts += 1;
    expect(route.request().postDataJSON()).toEqual({ listingId });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: roomId,
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: sellerId,
        },
      }),
    });
  });
  await page.route(`**/api/chat/rooms/${roomId}`, async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ updated: true }),
      });
      return;
    }
    roomDetailGets += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: { ...room, messages: [] },
      }),
    });
  });
  await page.route("**/api/chat/message", async (route) => {
    messagePosts += 1;
    const submitted = route.request().postDataJSON();
    expect(submitted).toEqual({ roomId, text: "Kitab mövcuddur?" });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "55555555-5555-4555-8555-555555555555",
          sender_id: buyerId,
          text: "Kitab mövcuddur?",
          created_at: timestamp,
        },
      }),
    });
  });

  await page.goto(`/listings/${listingId}`);
  await page
    .getByRole("button", { name: AZ_COPY.listingDetail.messageSeller })
    .click();
  await expect(page).toHaveURL(new RegExp(`/chat/${roomId}$`));
  await expect.poll(() => roomStarts).toBe(1);
  await expect.poll(() => relatedListingsGets).toBeGreaterThan(0);
  await expect(
    page.getByRole("heading", { name: AZ_COPY.chat.loadFailedTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: AZ_COPY.chat.unavailableTitle }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: AZ_COPY.chat.retry }).click();
  await expect(
    page.getByRole("heading", { name: room.seller.name }),
  ).toBeVisible();
  await expect.poll(() => roomDetailGets).toBe(1);

  const composer = page.getByLabel(AZ_COPY.chat.messageLabel, { exact: true });
  await composer.fill("Kitab mövcuddur?");
  await page.getByRole("button", { name: AZ_COPY.chat.send }).click();
  await expect.poll(() => messagePosts).toBe(1);
  await expect(
    page.getByRole("log", { name: AZ_COPY.chat.conversation }),
  ).toContainText("Kitab mövcuddur?");
  expect({ pageErrors, consoleErrors, failedResponses }).toEqual({
    pageErrors: [],
    consoleErrors: [],
    failedResponses: [],
  });
});

test("expired conversation session shows a sign-in recovery path", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route(`**/api/chat/rooms/${roomId}`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Sessiyanın müddəti bitib.",
        code: "INVALID_SESSION",
      }),
    });
  });

  await page.goto(`/chat/${roomId}`);
  await expect(
    page.getByRole("heading", { name: AZ_COPY.chat.sessionExpiredTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: AZ_COPY.chat.signIn }),
  ).toHaveAttribute("href", `/login?next=%2Fchat%2F${roomId}`);
  await expect(
    page.getByRole("heading", { name: AZ_COPY.chat.unavailableTitle }),
  ).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
