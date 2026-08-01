import { createHash, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";
import { parseChatRoomDetail, parseChatRoomSummaries } from "@/lib/chat-client";
import { parseRoomCreationResponse } from "@/lib/listing-detail-action-responses";

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
const expectedUrlSha256 =
  "5e74aa476bfdc401db2cf40f68dc08c349df0d763cb9188d0763a07097cb7163";
const expectedConfirmationSha256 =
  "c20585ead668991423a9cc51342a5b511f80a39d69d9ba342df46de28434bf3f";
const password = `BookSwap!${randomUUID()}Aa1`;
const suffix = randomUUID();

const ids = {} as Record<TestRole, string>;
const tokens = {} as Record<TestRole, string>;
const clients = {} as Record<TestRole, SupabaseClient<Database>>;
let service: SupabaseClient<Database>;
let activeListingId = "";
let draftListingId = "";
let removedListingId = "";
let roomId = "";
let reportId = "";

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
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
    user_metadata: { name: `Test ${role}` },
  });
  if (error || !data.user) throw error ?? new Error(`Could not create ${role}`);
  ids[role] = data.user.id;
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
    if (sha256(url) !== expectedUrlSha256)
      throw new Error("Refusing an unexpected Supabase target");
    if (
      sha256(process.env.BOOKSWAP_REMOTE_TEST_CONFIRMATION ?? "") !==
      expectedConfirmationSha256
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

    const listingRoute = await import("../app/api/listings/route");
    const activeListingResponse = await listingRoute.POST(
      apiRequest("/api/listings", "POST", "seller", {
        title: "İşıqlı dünya",
        author: "Test Müəllif",
        description: "Authorization test üçün etibarlı kitab elanı.",
        price: 20,
        images: [
          `${url}/storage/v1/object/public/listing-images/${ids.seller}/authorization-fixture.png`,
        ],
        category: "Fiction",
        condition: "Good",
        city: "Baku",
      }),
    );
    if (activeListingResponse.status !== 201)
      throw new Error("Seller could not create the active test listing");
    const activeListingBody = await activeListingResponse.json();
    activeListingId = activeListingBody.data?.id ?? "";
    if (!activeListingId)
      throw new Error("Listing creation did not return an identifier");

    const { data: listings, error: listingError } = await service
      .from("listings")
      .insert([
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
        {
          title: "Silinəcək elan",
          author: "Test Müəllif",
          description: "Silinmiş elan üçün söhbət başlanmaması sınağı.",
          price: 16,
          images: [],
          category: "History",
          condition: "Good",
          city: "Baku",
          seller_id: ids.seller,
          status: "active",
        },
      ])
      .select("id,status");
    if (listingError || !listings) throw listingError;
    draftListingId = listings.find((row) => row.status === "draft")!.id;
    removedListingId =
      listings.find((row) => row.status === "active")?.id ?? "";
    const removed = await service
      .from("listings")
      .delete()
      .eq("id", removedListingId);
    if (removed.error) throw removed.error;
  }, 60_000);

  afterAll(async () => {
    if (!service) return;
    const fixtureIds = Object.values(ids).filter(Boolean);
    for (const id of fixtureIds.reverse()) {
      const deleted = await service.auth.admin.deleteUser(id);
      if (deleted.error) throw deleted.error;
    }
    if (fixtureIds.length) {
      const imageCleanup = await service
        .from("listing_image_cleanup_jobs")
        .delete()
        .in("user_id", fixtureIds);
      if (imageCleanup.error) throw imageCleanup.error;
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
  });

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

  it("creates a complete room that both participants can open", async () => {
    const roomsRoute = await import("../app/api/chat/rooms/route");
    const roomRoute = await import("../app/api/chat/rooms/[id]/route");
    const messageRoute = await import("../app/api/chat/message/route");
    const starts = await Promise.all(
      Array.from({ length: 3 }, () =>
        roomsRoute.POST(
          apiRequest("/api/chat/rooms", "POST", "buyer", {
            listingId: activeListingId,
          }),
        ),
      ),
    );
    expect(starts.map((response) => response.status)).toEqual([201, 201, 201]);
    const startedRooms = await Promise.all(
      starts.map(async (response) =>
        parseRoomCreationResponse(await response.json(), {
          listingId: activeListingId,
          buyerId: ids.buyer,
          sellerId: ids.seller,
        }),
      ),
    );
    expect(startedRooms.every(Boolean)).toBe(true);
    const startedIds = startedRooms.flatMap((room) => (room ? [room.id] : []));
    expect(new Set(startedIds).size).toBe(1);
    roomId = startedIds[0] ?? "";
    expect(roomId).not.toBe("");

    const readStates = await service
      .from("chat_room_reads")
      .select("user_id")
      .eq("room_id", roomId)
      .order("user_id");
    expect(readStates.error).toBeNull();
    expect(readStates.data?.map((state) => state.user_id).sort()).toEqual(
      [ids.buyer, ids.seller].sort(),
    );

    for (const role of ["buyer", "seller"] as const) {
      const response = await roomRoute.GET(
        apiRequest(`/api/chat/rooms/${roomId}`, "GET", role),
        { params: Promise.resolve({ id: roomId }) },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(parseChatRoomDetail(body.data)).not.toBeNull();

      const listResponse = await roomsRoute.GET(
        apiRequest("/api/chat/rooms", "GET", role),
      );
      expect(listResponse.status).toBe(200);
      const listBody = await listResponse.json();
      expect(
        parseChatRoomSummaries(listBody.data)?.map((room) => room.id),
      ).toContain(roomId);
    }

    const buyerMessage = await messageRoute.POST(
      apiRequest("/api/chat/message", "POST", "buyer", {
        roomId,
        text: "Salam, kitab hələ mövcuddur?",
      }),
    );
    expect(buyerMessage.status).toBe(201);
    const sellerMessage = await messageRoute.POST(
      apiRequest("/api/chat/message", "POST", "seller", {
        roomId,
        text: "Bəli, kitab mövcuddur.",
      }),
    );
    expect(sellerMessage.status).toBe(201);

    for (const role of ["buyer", "seller"] as const) {
      const response = await roomRoute.GET(
        apiRequest(`/api/chat/rooms/${roomId}`, "GET", role),
        { params: Promise.resolve({ id: roomId }) },
      );
      const body = await response.json();
      const detail = parseChatRoomDetail(body.data);
      expect(detail?.messages.map((message) => message.sender_id)).toEqual([
        ids.buyer,
        ids.seller,
      ]);
    }

    const hidden = await clients.unrelated
      .from("chat_rooms")
      .select("id")
      .eq("id", roomId);
    expect(hidden.error).toBeNull();
    expect(hidden.data).toEqual([]);

    const unrelatedDetail = await roomRoute.GET(
      apiRequest(`/api/chat/rooms/${roomId}`, "GET", "unrelated"),
      { params: Promise.resolve({ id: roomId }) },
    );
    expect(unrelatedDetail.status).toBe(404);
    const anonymousDetail = await roomRoute.GET(
      new Request(`http://localhost/api/chat/rooms/${roomId}`),
      { params: Promise.resolve({ id: roomId }) },
    );
    expect(anonymousDetail.status).toBe(401);
    const expiredDetail = await roomRoute.GET(
      new Request(`http://localhost/api/chat/rooms/${roomId}`, {
        headers: { authorization: "Bearer expired-development-session" },
      }),
      { params: Promise.resolve({ id: roomId }) },
    );
    expect(expiredDetail.status).toBe(401);

    const ownListing = await roomsRoute.POST(
      apiRequest("/api/chat/rooms", "POST", "seller", {
        listingId: activeListingId,
      }),
    );
    expect(ownListing.status).toBe(409);
    const missingListing = await roomsRoute.POST(
      apiRequest("/api/chat/rooms", "POST", "buyer", {
        listingId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    );
    expect(missingListing.status).toBe(404);
    const removedListing = await roomsRoute.POST(
      apiRequest("/api/chat/rooms", "POST", "buyer", {
        listingId: removedListingId,
      }),
    );
    expect(removedListing.status).toBe(404);
    const inactiveListing = await roomsRoute.POST(
      apiRequest("/api/chat/rooms", "POST", "buyer", {
        listingId: draftListingId,
      }),
    );
    expect(inactiveListing.status).toBe(404);
    const bannedStart = await roomsRoute.POST(
      apiRequest("/api/chat/rooms", "POST", "banned", {
        listingId: activeListingId,
      }),
    );
    expect(bannedStart.status).toBe(403);
    const anonymousStart = await roomsRoute.POST(
      new Request("http://localhost/api/chat/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: activeListingId }),
      }),
    );
    expect(anonymousStart.status).toBe(401);

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
  }, 30_000);

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
});
