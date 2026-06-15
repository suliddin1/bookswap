import { requireSupabaseAdmin } from "@/lib/supabase";

export async function notifyUser(userId: string, type: "MESSAGE" | "SYSTEM", payload: Record<string, unknown>) {
  const supabase = requireSupabaseAdmin();
  await supabase.from("notifications").insert({ user_id: userId, type, payload });
  const { data: user } = await supabase.from("users").select("email").eq("id", userId).single();
  if (user?.email) {
    await supabase.functions.invoke("notify", {
      body: {
        recipient: user.email,
        subject: type === "MESSAGE" ? "New BookSwap message" : "Your BookSwap listing was updated",
        html: `<p>${String(payload.preview ?? payload.message ?? "There is an update on your BookSwap account.")}</p>`,
      },
    });
  }
}
