import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { AZ_COPY } from "../../lib/i18n";
import { MAX_LISTING_IMAGE_BYTES } from "../../lib/client-listing-images";

const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const sellerId = "11111111-1111-4111-8111-111111111111";
const uploadedUrl =
  "https://fixture.supabase.co/storage/v1/object/public/listing-images/11111111-1111-4111-8111-111111111111/book.png";

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
    // Production is HTTPS. Locally, WebKit applies upgrade-insecure-requests to
    // HTTP chunks, so strip only the document CSP in this transport harness.
    delete headers["content-security-policy"];
    await route.fulfill({ response, headers });
  });
}

async function installAuthenticatedSession(page: Page) {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: sellerId,
    aud: "authenticated",
    role: "authenticated",
    email: "new-reader@example.invalid",
    email_confirmed_at: "2026-08-01T10:00:00.000Z",
    confirmed_at: "2026-08-01T10:00:00.000Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-08-01T10:00:00.000Z",
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
  }, session);
  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(user),
    });
  });
}

async function reachPhotoStep(page: Page) {
  await page.goto("/listings/new");
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingForm.title }),
  ).toBeVisible();
  const title = page.getByLabel(AZ_COPY.listingForm.bookTitle);
  const author = page.getByLabel(AZ_COPY.listingForm.author);
  const description = page.getByLabel(AZ_COPY.listingForm.description);
  await expect
    .poll(() =>
      title.evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith("__reactProps$")),
      ),
    )
    .toBe(true);
  await title.fill("Mobil sınaq kitabı");
  await expect(title).toHaveValue("Mobil sınaq kitabı");
  await author.fill("Sınaq müəllifi");
  await expect(author).toHaveValue("Sınaq müəllifi");
  await description.fill(
    "Mobil Safari elan axınını yoxlayan kifayət qədər ətraflı təsvir.",
  );
  await expect(description).toHaveValue(
    "Mobil Safari elan axınını yoxlayan kifayət qədər ətraflı təsvir.",
  );
  await page
    .getByRole("button", { name: AZ_COPY.listingForm.continue, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingForm.conditionTitle }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: AZ_COPY.listingForm.continue, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingForm.photosTitle }),
  ).toBeVisible();
}

test.beforeEach(async ({ context, browserName }) => {
  await allowLocalHttpWebKit(context, browserName);
});

test("iPhone preview API failure remains inside the listing form", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await reachPhotoStep(page);
  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw new DOMException("iOS file provider failure", "NotSupportedError");
    };
  });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "iphone-photo.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  });

  await expect(page.locator("#listing-form-error")).toHaveText(
    AZ_COPY.listingForm.previewUnavailable,
  );
  await expect(fileInput).toBeFocused();
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingForm.photosTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingForm.recoveryTitle }),
  ).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("mobile picker validates HEIC, HEIF, size, count, JPEG, and PNG", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await reachPhotoStep(page);
  const fileInput = page.locator('input[type="file"]');
  const error = page.locator("#listing-form-error");

  for (const [name, mimeType] of [
    ["iphone.heic", "image/heic"],
    ["iphone.heif", "image/heif"],
  ]) {
    await fileInput.setInputFiles({
      name,
      mimeType,
      buffer: Buffer.from([1]),
    });
    await expect(error).toHaveText(AZ_COPY.listingForm.unsupportedImageFormat);
  }

  await fileInput.setInputFiles({
    name: "large.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(MAX_LISTING_IMAGE_BYTES + 1, 1),
  });
  await expect(error).toHaveText(AZ_COPY.listingForm.imageTooLarge);

  await fileInput.setInputFiles(
    Array.from({ length: 6 }, (_, index) => ({
      name: `${index}.png`,
      mimeType: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    })),
  );
  await expect(error).toHaveText(AZ_COPY.listingForm.invalidImageCount);

  await fileInput.setInputFiles([
    {
      name: "cover.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    },
    {
      name: "spine.png",
      mimeType: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    },
  ]);
  await expect(error).toHaveCount(0);
  await expect(
    page.getByRole("group", { name: AZ_COPY.listingForm.selectedPhotos }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: `${AZ_COPY.listingForm.removeSelectedPhoto} 2`,
    }),
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("expired session, Storage failure, publish, and post-submit rendering stay recoverable", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await reachPhotoStep(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  });
  await page.getByLabel(AZ_COPY.listingForm.price).fill("18");
  await page
    .getByRole("button", { name: AZ_COPY.listingForm.continue, exact: true })
    .click();
  await page
    .getByRole("button", { name: AZ_COPY.listingForm.publish, exact: true })
    .click();
  await expect(page.locator("#listing-form-error")).toContainText(
    "Davam etmək üçün daxil ol.",
  );

  await installAuthenticatedSession(page);
  let storageFails = true;
  await page.route("**/api/upload", async (route) => {
    if (storageFails) {
      await route.fulfill({
        status: 503,
        contentType: "text/plain",
        body: "storage unavailable",
      });
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: [uploadedUrl] }),
    });
  });
  const listing = {
    id: listingId,
    title: "Mobil sınaq kitabı",
    author: "Sınaq müəllifi",
    description:
      "Mobil Safari elan axınını yoxlayan kifayət qədər ətraflı təsvir.",
    price: 18,
    images: ["/icon.svg"],
    category: "Fiction",
    condition: "Very good",
    city: "Baku",
    status: "active",
    sellerId,
    seller: { id: sellerId, name: "BookSwap oxucusu" },
  };
  await page.route("**/api/listings", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: listing }),
    });
  });
  await page.route(`**/api/listings/${listingId}`, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { ...listing, reviews: [] } }),
    });
  });

  await reachPhotoStep(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  });
  await page.getByLabel(AZ_COPY.listingForm.price).fill("18");
  await page
    .getByRole("button", { name: AZ_COPY.listingForm.continue, exact: true })
    .click();
  await page
    .getByRole("button", { name: AZ_COPY.listingForm.publish, exact: true })
    .click();
  await expect(page.locator("#listing-form-error")).toHaveText(
    AZ_COPY.listingForm.uploadFailed,
  );

  storageFails = false;
  await page
    .getByRole("button", { name: AZ_COPY.listingForm.publish, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: AZ_COPY.listingForm.publishedTitle }),
  ).toBeVisible();
  await page.goto(`/listings/${listingId}`);
  await expect(
    page.getByRole("heading", { name: listing.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "BookSwap oxucusu", exact: true }),
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
});
