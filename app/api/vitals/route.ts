import { ApiError, assertRateLimit } from "../../../lib/api";
import { rateWebVital } from "../../../lib/web-vitals";
import { webVitalPayloadSchema } from "../../../lib/web-vitals-server";

const MAX_BODY_BYTES = 1_024;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function emptyResponse(status: number) {
  return new Response(null, { status, headers: NO_STORE_HEADERS });
}

function hasSameOriginBrowserContext(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    const publicHost = forwardedHost || request.headers.get("host");
    if (!publicHost || originUrl.host !== publicHost) return false;

    const forwardedProtocol = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    return !forwardedProtocol || originUrl.protocol === `${forwardedProtocol}:`;
  } catch {
    return false;
  }
}

async function readBoundedJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new ApiError("Unsupported content type", 415);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new ApiError("Payload too large", 413);
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY_BYTES) {
    throw new ApiError("Payload too large", 413);
  }

  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
}

export async function POST(request: Request) {
  if (process.env.WEB_VITALS_ENABLED !== "true") return emptyResponse(204);

  try {
    if (!hasSameOriginBrowserContext(request)) return emptyResponse(403);
    assertRateLimit(request, "web-vitals", 120, 60_000);

    const payload = webVitalPayloadSchema.parse(await readBoundedJson(request));
    console.info(
      JSON.stringify({
        event: "bookswap.web_vital",
        ...payload,
        rating: rateWebVital(payload.name, payload.value),
      }),
    );
    return emptyResponse(204);
  } catch (error) {
    if (error instanceof ApiError) return emptyResponse(error.status);
    return emptyResponse(400);
  }
}
