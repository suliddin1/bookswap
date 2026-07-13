import { apiError, assertRateLimit } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "upload", 10, 60_000);
    const user = await requireUser(request);
    const form = await request.formData();
    const files = form
      .getAll("images")
      .filter((item): item is File => item instanceof File);
    if (!files.length || files.length > 5)
      throw new Error("Upload between one and five images.");
    const supabase = requireSupabaseAdmin();
    const urls: string[] = [];
    const uploadedPaths: string[] = [];
    for (const file of files) {
      if (
        file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        throw new Error(
          "Images must be JPEG, PNG, or WebP and no larger than 5 MB.",
        );
      }
      if (!(await hasValidImageSignature(file)))
        throw new Error("One of the files is not a valid image.");
      const extension =
        file.type === "image/jpeg"
          ? "jpg"
          : file.type === "image/png"
            ? "png"
            : "webp";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        if (uploadedPaths.length)
          await supabase.storage.from("listing-images").remove(uploadedPaths);
        throw error;
      }
      uploadedPaths.push(path);
      urls.push(
        supabase.storage.from("listing-images").getPublicUrl(path).data
          .publicUrl,
      );
    }
    return Response.json({ data: urls }, { status: 201 });
  } catch (error) {
    return apiError(error, 400);
  }
}

async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png")
    return bytes
      .slice(0, 8)
      .every(
        (value, index) =>
          value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index],
      );
  return (
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP"
  );
}
