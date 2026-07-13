import { apiError, assertRateLimit, moderationInput } from "@/lib/api";
import { moderateImage, moderateText } from "@/lib/moderation";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "moderate", 15, 60_000);
    await requireUser(request);
    const { text, imageUrl } = moderationInput.parse(await request.json());
    const [textResult, imageResult] = await Promise.all([
      text ? moderateText(text) : Promise.resolve(null),
      imageUrl ? moderateImage(imageUrl) : Promise.resolve(null),
    ]);
    return Response.json({ text: textResult, image: imageResult });
  } catch (error) {
    return apiError(error, 500);
  }
}
