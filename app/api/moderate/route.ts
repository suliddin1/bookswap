import { apiError, assertRateLimit, moderationInput } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { randomUUID } from "node:crypto";
import {
  moderateAndRecordImage,
  moderateAndRecordText,
} from "@/lib/moderation";
import { requireUser } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "moderate", 15, 60_000);
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const { text, imageUrl } = moderationInput.parse(await request.json());
    const requestId = randomUUID();
    const [textResult, imageResult] = await Promise.all([
      text
        ? moderateAndRecordText(supabase, text, {
            actorId: user.id,
            requestId,
            surface: "moderation_api",
          })
        : Promise.resolve(null),
      imageUrl
        ? moderateAndRecordImage(supabase, imageUrl, {
            actorId: user.id,
            requestId,
            surface: "moderation_api",
          })
        : Promise.resolve(null),
    ]);
    if (
      [textResult, imageResult].some(
        (result) => result?.outcome === "unavailable",
      )
    )
      throw new ApiError(
        "Məzmun yoxlama xidməti hazırda əlçatan deyil. Bir qədər sonra yenidən cəhd edin.",
        503,
        "MODERATION_UNAVAILABLE",
      );
    return Response.json({ text: textResult, image: imageResult });
  } catch (error) {
    return apiError(error, 500);
  }
}
