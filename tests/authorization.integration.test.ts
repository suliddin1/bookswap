import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";

type TestRole =
  | "admin"
  | "banned"
  | "buyer"
  | "moderator"
  | "seller"
  | "stale"
  | "unrelated";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const runRemote = process.env.RUN_REMOTE_AUTHORIZATION_TESTS === "1";
const expectedUrl = "https://uibatsbzjswmtdvdrlxj.supabase.co";
const password = `BookSwap!${randomUUID()}Aa1`;
const suffix = randomUUID();

const ids = {} as Record<TestRole, string>;
const tokens = {} as Record<TestRole, string>;
const clients = {} as Record<TestRole, SupabaseClient<Database>>;
const createdUserIds: string[] = [];
const deletedUserIds = new Set<string>();
let service: SupabaseClient<Database>;
let activeListingId = "";
let draftListingId = "";
let roomId = "";
let reportId = "";

async function legalAcceptanceMutation(
  method: "DELETE" | "PATCH" | "POST",
  role: TestRole,
  targetUserId = ids[role],
  body?: unknown,
) {
  return fetch(`${url}/rest/v1/legal_acceptances?user_id=eq.${targetUserId}`, {
    method,
    headers: {
      apikey: publicKey,
      authorization: `Bearer ${tokens[role]}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function apiRequest(
  path: string,
  method: string,
  role: TestRole,
  body?: unknown,
) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      authorization: `Bearer ${tokens[role]}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createRole(role: TestRole) {
  const email = `${role}-${suffix}@example.invalid`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: `Test ${role}`,
      terms_version: "2026-08-07",
      privacy_version: "2026-08-07",
      marketplace_rules_version: "2026-08-07",
      age_18_plus_confirmed: true,
      personal_data_processing_consent: true,
      cross_border_transfer_disclosed_and_consented: true,
    },
  });
  if (error || !data.user) throw error ?? new Error(`Could not create ${role}`);
  ids[role] = data.user.id;
  createdUserIds.push(data.user.id);
  clients[role] = createClient<Database>(url, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const session = await clients[role].auth.signInWithPassword({
    email,
    password,
  });
  if (session.error || !session.data.session)
    throw session.error ?? new Error(`Could not sign in ${role}`);
  tokens[role] = session.data.session.access_token;
}

describe.skipIf(!runRemote)("development authorization matrix", () => {
  beforeAll(async () => {
    if (url !== expectedUrl)
      throw new Error(`Refusing unexpected Supabase URL: ${url || "missing"}`);
    if (
      process.env.BOOKSWAP_REMOTE_TEST_CONFIRMATION !== "bookswap-development"
    )
      throw new Error("Missing development-project confirmation");
    if (!publicKey || !serviceKey) throw new Error("Missing test credentials");

    service = createClient<Database>(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    for (const role of [
      "seller",
      "buyer",
      "unrelated",
      "banned",
      "moderator",
      "admin",
      "stale",
    ] as const) {
      await createRole(role);
    }
    const profileUpdate = await service
      .from("users")
      .update({ banned: true })
      .eq("id", ids.banned);
    if (profileUpdate.error) throw profileUpdate.error;
    const adminUpdate = await service
      .from("users")
      .update({ is_admin: true })
      .eq("id", ids.admin);
    if (adminUpdate.error) throw adminUpdate.error;

    const { data: listings, error: listingError } = await service
      .from("listings")
      .insert([
        {
          title: "İşıqlı dünya",
          author: "Test Müəllif",
          description: "Authorization test üçün etibarlı kitab elanı.",
          price: 20,
          images: [],
          category: "Fiction",
          condition: "Good",
          city: "Baku",
          seller_id: ids.seller,
          status: "active",
        },
        {
          title: "Gizli qaralama",
          author: "Test Müəllif",
          description: "Public görünməməli olan test qaralaması.",
          price: 15,
          images: [],
          category: "History",
          condition: "Very good",
          city: "Ganja",
          seller_id: ids.seller,
          status: "draft",
        },
      ])
      .select("id,status");
    if (listingError || !listings) throw listingError;
    activeListingId = listings.find((row) => row.status === "active")!.id;
    draftListingId = listings.find((row) => row.status === "draft")!.id;
  }, 60_000);

  afterAll(async () => {
    if (!service) return;
    if (createdUserIds.length > 0) {
      const acceptanceCleanup = await service
        .from("legal_acceptances")
        .delete()
        .in("user_id", createdUserIds);
      if (acceptanceCleanup.error) throw acceptanceCleanup.error;
    }
    for (const id of [...createdUserIds].reverse()) {
      if (deletedUserIds.has(id)) continue;
      const deletion = await service.auth.admin.deleteUser(id);
      if (deletion.error) throw deletion.error;
    }
  }, 60_000);

  it("keeps anonymous catalog visibility bounded", async () => {
    const anonymous = createClient<Database>(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await anonymous
      .from("listings")
      .select("id,status")
      .in("id", [activeListingId, draftListingId]);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: activeListingId, status: "active" }]);
  });

  it("allows only safe self-profile changes and prevents role promotion", async () => {
    const own = await clients.buyer
      .from("users")
      .update({ city: "Shaki" })
      .eq("id", ids.buyer)
      .select("id,city");
    expect(own.error).toBeNull();
    expect(own.data?.[0]?.id).toBe(ids.buyer);

    const other = await clients.buyer
      .from("users")
      .update({ city: "Shirvan" })
      .eq("id", ids.seller)
      .select("id");
    expect(other.error).toBeNull();
    expect(other.data).toEqual([]);

    const promotion = await clients.buyer
      .from("users")
      .update({ is_admin: true } as never)
      .eq("id", ids.buyer);
    expect(promotion.error).not.toBeNull();
  });

  it("records legal acceptance through the confirmation-link signup flow", async () => {
    const signup = await service.auth.admin.generateLink({
      type: "signup",
      email: `signup-${suffix}@example.invalid`,
      password,
      options: {
        data: {
          name: "Signup Test",
          terms_version: "2026-08-07",
          privacy_version: "2026-08-07",
          marketplace_rules_version: "2026-08-07",
          age_18_plus_confirmed: true,
          personal_data_processing_consent: true,
          cross_border_transfer_disclosed_and_consented: true,
        },
      },
    });
    expect(signup.error).toBeNull();
    if (signup.error) throw signup.error;
    expect(signup.data.properties.verification_type).toBe("signup");
    expect(signup.data.user.email_confirmed_at).toBeUndefined();
    const signupUserId = signup.data.user.id;
    createdUserIds.push(signupUserId);

    const acceptance = await service
      .from("legal_acceptances")
      .select(
        "user_id,terms_version,privacy_version,marketplace_rules_version,age_18_plus_confirmed,personal_data_processing_consent,cross_border_transfer_disclosed_and_consented,accepted_at",
      )
      .eq("user_id", signupUserId)
      .single();
    expect(acceptance.error).toBeNull();
    expect(acceptance.data).toMatchObject({
      user_id: signupUserId,
      terms_version: "2026-08-07",
      privacy_version: "2026-08-07",
      marketplace_rules_version: "2026-08-07",
      age_18_plus_confirmed: true,
      personal_data_processing_consent: true,
      cross_border_transfer_disclosed_and_consented: true,
    });
    expect(acceptance.data?.accepted_at).toBeTruthy();
  });

  it("rejects signup without the complete current legal acceptance", async () => {
    const rejected = await service.auth.admin.createUser({
      email: `rejected-${suffix}@example.invalid`,
      password,
      email_confirm: true,
      user_metadata: {
        name: "Rejected Signup",
        terms_version: "2026-08-07",
        privacy_version: "2026-08-07",
        marketplace_rules_version: "2026-08-07",
        age_18_plus_confirmed: true,
        personal_data_processing_consent: false,
        cross_border_transfer_disclosed_and_consented: true,
      },
    });
    expect(rejected.error).not.toBeNull();
    expect(rejected.data.user).toBeNull();
  });

  it("keeps legal acceptance immutable and visible only to its user", async () => {
    const own = await clients.buyer
      .from("legal_acceptances")
      .select("user_id,terms_version,accepted_at")
      .eq("user_id", ids.buyer)
      .single();
    expect(own.error).toBeNull();
    expect(own.data?.user_id).toBe(ids.buyer);
    expect(own.data?.terms_version).toBe("2026-08-07");

    const other = await clients.unrelated
      .from("legal_acceptances")
      .select("user_id")
      .eq("user_id", ids.buyer);
    expect(other.error).toBeNull();
    expect(other.data).toEqual([]);

    const insert = await legalAcceptanceMutation("POST", "buyer", ids.buyer, {
      user_id: ids.buyer,
      terms_version: "2026-08-07",
      privacy_version: "2026-08-07",
      marketplace_rules_version: "2026-08-07",
      age_18_plus_confirmed: true,
      personal_data_processing_consent: true,
      cross_border_transfer_disclosed_and_consented: true,
    });
    const update = await legalAcceptanceMutation("PATCH", "buyer", ids.buyer, {
      accepted_at: new Date().toISOString(),
    });
    const deletion = await legalAcceptanceMutation("DELETE", "buyer");
    const unrelatedDeletion = await legalAcceptanceMutation(
      "DELETE",
      "unrelated",
      ids.buyer,
    );
    expect(insert.ok).toBe(false);
    expect(update.ok).toBe(false);
    expect(deletion.ok).toBe(false);
    expect(unrelatedDeletion.ok).toBe(false);

    const retained = await service
      .from("legal_acceptances")
      .select("user_id,accepted_at")
      .eq("user_id", ids.buyer)
      .single();
    expect(retained.error).toBeNull();
    expect(retained.data).toEqual({
      user_id: ids.buyer,
      accepted_at: own.data?.accepted_at,
    });
  });

  it("denies direct listing writes and enforces protected route ownership", async () => {
    const direct = await clients.seller.from("listings").insert({
      title: "Direct write",
      author: "Test Author",
      description: "This direct listing write must be denied.",
      price: 10,
      images: [],
      category: "Fiction",
      condition: "Good",
      city: "Baku",
      seller_id: ids.seller,
      status: "active",
    });
    expect(direct.error).not.toBeNull();

    const listingRoute = await import("../app/api/listings/[id]/route");
    const unrelated = await listingRoute.PATCH(
      apiRequest(`/api/listings/${activeListingId}`, "PATCH", "unrelated", {
        price: 22,
      }),
      { params: Promise.resolve({ id: activeListingId }) },
    );
    expect(unrelated.status).toBe(404);

    const owner = await listingRoute.PATCH(
      apiRequest(`/api/listings/${activeListingId}`, "PATCH", "seller", {
        price: 21,
      }),
      { params: Promise.resolve({ id: activeListingId }) },
    );
    expect(owner.status).toBe(200);

    const unrelatedSold = await listingRoute.PATCH(
      apiRequest(`/api/listings/${activeListingId}`, "PATCH", "unrelated", {
        status: "sold",
      }),
      { params: Promise.resolve({ id: activeListingId }) },
    );
    expect(unrelatedSold.status).toBe(404);

    const sold = await listingRoute.PATCH(
      apiRequest(`/api/listings/${activeListingId}`, "PATCH", "seller", {
        status: "sold",
      }),
      { params: Promise.resolve({ id: activeListingId }) },
    );
    expect(sold.status).toBe(200);
    expect((await sold.json()).data.status).toBe("sold");

    const catalogRoute = await import("../app/api/listings/route");
    const soldCatalog = await catalogRoute.GET(
      new Request("http://localhost/api/listings?query=İşıqlı"),
    );
    expect(soldCatalog.status).toBe(200);
    expect(
      (await soldCatalog.json()).data.items.some(
        (listing: { id: string }) => listing.id === activeListingId,
      ),
    ).toBe(false);

    const roomRoute = await import("../app/api/chat/rooms/route");
    const newSoldConversation = await roomRoute.POST(
      apiRequest("/api/chat/rooms", "POST", "buyer", {
        listingId: activeListingId,
      }),
    );
    expect(newSoldConversation.status).toBe(404);

    const relisted = await listingRoute.PATCH(
      apiRequest(`/api/listings/${activeListingId}`, "PATCH", "seller", {
        status: "active",
      }),
      { params: Promise.resolve({ id: activeListingId }) },
    );
    expect(relisted.status).toBe(200);
    expect((await relisted.json()).data.status).toBe("active");

    const activeCatalog = await catalogRoute.GET(
      new Request("http://localhost/api/listings?query=İşıqlı"),
    );
    expect(activeCatalog.status).toBe(200);
    expect((await activeCatalog.json()).data.items).toContainEqual(
      expect.objectContaining({ id: activeListingId, status: "active" }),
    );
  }, 30_000);

  it("binds favorites to the authenticated user and prevents duplicates", async () => {
    const first = await clients.buyer.from("favorites").insert({
      user_id: ids.buyer,
      listing_id: activeListingId,
    });
    expect(first.error).toBeNull();
    const duplicate = await clients.buyer.from("favorites").insert({
      user_id: ids.buyer,
      listing_id: activeListingId,
    });
    expect(duplicate.error?.code).toBe("23505");
    const forged = await clients.buyer.from("favorites").insert({
      user_id: ids.unrelated,
      listing_id: activeListingId,
    });
    expect(forged.error).not.toBeNull();
    const banned = await clients.banned.from("favorites").insert({
      user_id: ids.banned,
      listing_id: activeListingId,
    });
    expect(banned.error).not.toBeNull();
  });

  it("isolates chat rooms and rejects forged senders", async () => {
    const opened = await clients.buyer
      .from("chat_rooms")
      .insert({
        listing_id: activeListingId,
        buyer_id: ids.buyer,
        seller_id: ids.seller,
      })
      .select("id")
      .single();
    expect(opened.error).toBeNull();
    roomId = opened.data!.id;

    const hidden = await clients.unrelated
      .from("chat_rooms")
      .select("id")
      .eq("id", roomId);
    expect(hidden.error).toBeNull();
    expect(hidden.data).toEqual([]);

    const valid = await clients.buyer.from("messages").insert({
      room_id: roomId,
      sender_id: ids.buyer,
      text: "Salam, kitab hələ mövcuddur?",
    });
    expect(valid.error).toBeNull();
    const forged = await clients.buyer.from("messages").insert({
      room_id: roomId,
      sender_id: ids.seller,
      text: "Forged sender",
    });
    expect(forged.error).not.toBeNull();
    const outsider = await clients.unrelated.from("messages").insert({
      room_id: roomId,
      sender_id: ids.unrelated,
      text: "Outsider",
    });
    expect(outsider.error).not.toBeNull();
  });

  it("protects notifications and Azerbaijani system payloads", async () => {
    const inserted = await service
      .from("notifications")
      .insert({
        user_id: ids.seller,
        type: "SYSTEM",
        payload: { event: "test", message: "Sınaq bildirişi." },
      })
      .select("id")
      .single();
    expect(inserted.error).toBeNull();
    const hidden = await clients.unrelated
      .from("notifications")
      .select("id")
      .eq("id", inserted.data!.id);
    expect(hidden.data).toEqual([]);
    const arbitrary = await clients.unrelated.from("notifications").insert({
      user_id: ids.seller,
      type: "SYSTEM",
      payload: { message: "forged" },
    });
    expect(arbitrary.error).not.toBeNull();
    const update = await clients.unrelated
      .from("notifications")
      .update({ read: true })
      .eq("id", inserted.data!.id)
      .select("id");
    expect(update.data).toEqual([]);
  });

  it("enforces review eligibility, uniqueness, self-review, and rating bounds", async () => {
    const sold = await service
      .from("listings")
      .update({ status: "sold" })
      .eq("id", activeListingId);
    expect(sold.error).toBeNull();
    const valid = await clients.buyer.from("reviews").insert({
      listing_id: activeListingId,
      author_id: ids.buyer,
      rating: 5,
      comment: "Kitab təsvirə uyğun idi.",
    });
    expect(valid.error).toBeNull();
    const duplicate = await clients.buyer.from("reviews").insert({
      listing_id: activeListingId,
      author_id: ids.buyer,
      rating: 4,
      comment: "Təkrar rəy qəbul edilməməlidir.",
    });
    expect(duplicate.error?.code).toBe("23505");
    const selfReview = await service.from("reviews").insert({
      listing_id: activeListingId,
      author_id: ids.seller,
      rating: 5,
      comment: "Self review",
    });
    expect(selfReview.error).not.toBeNull();
    const badRating = await service.from("reviews").insert({
      listing_id: activeListingId,
      author_id: ids.unrelated,
      rating: 6,
      comment: "Invalid rating",
    });
    expect(badRating.error).not.toBeNull();
  });

  it("protects reports, moderation state, and duplicate privacy requests", async () => {
    const report = await clients.unrelated
      .from("reports")
      .insert({
        reporter_id: ids.unrelated,
        listing_id: activeListingId,
        reason: "Bu elan üzrə yoxlama tələb olunur.",
      })
      .select("id")
      .single();
    expect(report.error).toBeNull();
    reportId = report.data!.id;
    const own = await clients.seller.from("reports").insert({
      reporter_id: ids.seller,
      listing_id: activeListingId,
      reason: "Öz elanına şikayət qəbul edilməməlidir.",
    });
    expect(own.error).not.toBeNull();
    const stateChange = await clients.unrelated
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", reportId);
    expect(stateChange.error).not.toBeNull();

    const privacy = {
      user_id: ids.buyer,
      type: "access" as const,
      details: "Məlumatlarıma çıxış üçün test müraciəti.",
    };
    expect(
      (await clients.buyer.from("privacy_requests").insert(privacy)).error,
    ).toBeNull();
    expect(
      (await clients.buyer.from("privacy_requests").insert(privacy)).error,
    ).not.toBeNull();

    const withdrawal = await clients.buyer.from("privacy_requests").insert({
      user_id: ids.buyer,
      type: "consent_withdrawal",
      details: "Şəxsi məlumatların işlənməsinə razılığımı geri götürürəm.",
    });
    expect(withdrawal.error).toBeNull();
  });

  it("keeps administrator operations server-side and auditable", async () => {
    const direct = await clients.admin.rpc("admin_resolve_report", {
      p_actor_id: ids.admin,
      p_report_id: reportId,
      p_status: "resolved",
      p_reason: "Direct authenticated RPC must remain denied.",
    });
    expect(direct.error).not.toBeNull();

    const adminRoute = await import("../app/api/admin/reports/route");
    const moderator = await adminRoute.PATCH(
      apiRequest("/api/admin/reports", "PATCH", "moderator", {
        reportId,
        status: "resolved",
        reason: "Moderator role is not implemented for launch.",
      }),
    );
    expect(moderator.status).toBe(403);
    const admin = await adminRoute.PATCH(
      apiRequest("/api/admin/reports", "PATCH", "admin", {
        reportId,
        status: "resolved",
        reason: "Authorization integration test resolution.",
      }),
    );
    expect(admin.status).toBe(200);
    const audit = await service
      .from("admin_audit_log")
      .select("actor_id,target_id,action")
      .eq("target_id", reportId)
      .single();
    expect(audit.error).toBeNull();
    expect(audit.data?.actor_id).toBe(ids.admin);
  });

  it("denies direct Storage writes and stale deleted-user requests", async () => {
    const storage = await clients.buyer.storage
      .from("listing-images")
      .upload(`${ids.buyer}/${randomUUID()}.png`, new Uint8Array([1, 2, 3]), {
        contentType: "image/png",
        upsert: false,
      });
    expect(storage.error).not.toBeNull();

    const staleId = ids.stale;
    const deletion = await service.auth.admin.deleteUser(staleId);
    expect(deletion.error).toBeNull();
    deletedUserIds.add(staleId);
    ids.stale = "";
    const profileRoute = await import("../app/api/profile/route");
    const response = await profileRoute.PATCH(
      apiRequest("/api/profile", "PATCH", "stale", {
        name: "Stale User",
        phone: null,
        city: "Baku",
      }),
    );
    expect(response.status).toBe(401);
  });

  it("removes an owner listing without cascading retained history", async () => {
    const listingRoute = await import("../app/api/listings/[id]/route");
    const before = {
      rooms: (
        await service
          .from("chat_rooms")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", activeListingId)
      ).count,
      messages: (
        await service
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("room_id", roomId)
      ).count,
      reviews: (
        await service
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", activeListingId)
      ).count,
      reports: (
        await service
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", activeListingId)
      ).count,
      moderation: (
        await service
          .from("moderation_decisions")
          .select("*", { count: "exact", head: true })
          .eq("target_id", activeListingId)
      ).count,
      cleanupJobs: (
        await service
          .from("listing_image_cleanup_jobs")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", activeListingId)
      ).count,
    };

    const unrelated = await listingRoute.DELETE(
      apiRequest(`/api/listings/${activeListingId}`, "DELETE", "unrelated"),
      { params: Promise.resolve({ id: activeListingId }) },
    );
    expect(unrelated.status).toBe(404);

    const owner = await listingRoute.DELETE(
      apiRequest(`/api/listings/${activeListingId}`, "DELETE", "seller"),
      { params: Promise.resolve({ id: activeListingId }) },
    );
    expect(owner.status).toBe(200);
    expect(await owner.json()).toEqual({
      listingId: activeListingId,
      removed: true,
      retainedForIntegrity: true,
    });

    const repeated = await listingRoute.DELETE(
      apiRequest(`/api/listings/${activeListingId}`, "DELETE", "seller"),
      { params: Promise.resolve({ id: activeListingId }) },
    );
    expect(repeated.status).toBe(200);

    const retainedListing = await service
      .from("listings")
      .select("id,status,images")
      .eq("id", activeListingId)
      .single();
    expect(retainedListing.error).toBeNull();
    expect(retainedListing.data).toEqual({
      id: activeListingId,
      status: "locked",
      images: [],
    });

    const anonymous = createClient<Database>(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    expect(
      (await anonymous.from("listings").select("id").eq("id", activeListingId))
        .data,
    ).toEqual([]);

    const profileRoute = await import("../app/api/profile/route");
    const profile = await profileRoute.GET(
      apiRequest("/api/profile", "GET", "seller"),
    );
    expect(profile.status).toBe(200);
    expect(
      (await profile.json()).data.listings.some(
        (listing: { id: string }) => listing.id === activeListingId,
      ),
    ).toBe(false);

    const after = {
      rooms: (
        await service
          .from("chat_rooms")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", activeListingId)
      ).count,
      messages: (
        await service
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("room_id", roomId)
      ).count,
      reviews: (
        await service
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", activeListingId)
      ).count,
      reports: (
        await service
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", activeListingId)
      ).count,
      moderation: (
        await service
          .from("moderation_decisions")
          .select("*", { count: "exact", head: true })
          .eq("target_id", activeListingId)
      ).count,
      cleanupJobs: (
        await service
          .from("listing_image_cleanup_jobs")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", activeListingId)
      ).count,
    };
    expect(after).toEqual(before);
  }, 30_000);
});
