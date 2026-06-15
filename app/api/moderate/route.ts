import { apiError } from "@/lib/api";
import { moderateImage, moderateText } from "@/lib/moderation";

export async function POST(request: Request) {
  try {
    const { text, imageUrl } = await request.json();
    const [textResult, imageResult] = await Promise.all([
      text ? moderateText(text) : Promise.resolve(null),
      imageUrl ? moderateImage(imageUrl) : Promise.resolve(null),
    ]);
    return Response.json({ text: textResult, image: imageResult });
  } catch (error) {
    return apiError(error, 500);
  }
}
