import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (request) => {
  const { recipient, subject, html } = await request.json();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BookSwap <notifications@bookswap.example>",
      to: recipient,
      subject,
      html,
    }),
  });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
});
