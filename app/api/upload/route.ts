import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const form = await request.formData();
    const files = form.getAll("images").filter((item): item is File => item instanceof File);
    if (!files.length || files.length > 5) throw new Error("Upload between one and five images.");
    const supabase = requireSupabaseAdmin();
    const urls: string[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Images must be JPEG, PNG, or WebP and no larger than 5 MB.");
      }
      const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
      const { error } = await supabase.storage.from("listing-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      urls.push(supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl);
    }
    return Response.json({ data: urls }, { status: 201 });
  } catch (error) {
    return apiError(error, 400);
  }
}
