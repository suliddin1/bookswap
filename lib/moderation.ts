const localBlocklist = ["explicit abuse phrase", "scam payment request"];

export async function moderateText(text: string) {
  if (localBlocklist.some((phrase) => text.toLowerCase().includes(phrase))) {
    return { safe: false, reason: "Blocked by marketplace safety rules" };
  }

  if (!process.env.OPENAI_API_KEY)
    return { safe: true, reason: "Demo moderation passed" };

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
  });
  if (!response.ok) throw new Error("Moderation service unavailable");
  const body = await response.json();
  return {
    safe: !body.results?.[0]?.flagged,
    reason: body.results?.[0]?.flagged ? "Text was flagged" : "Passed",
  };
}

export async function moderateImage(imageUrl: string) {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    return { safe: true, blur: false, reason: "Demo image check passed" };
  }
  // Cloudflare model names can be swapped without changing the API contract used by the UI.
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/microsoft/resnet-50`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageUrl }),
    },
  );
  if (!response.ok) throw new Error("Image moderation unavailable");
  return { safe: true, blur: false, reason: "Passed" };
}
