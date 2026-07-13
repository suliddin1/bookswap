export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export function assertOwnedListingImages(urls: string[], userId: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) throw new Error("Supabase public URL is not configured.");
  const expectedHost = new URL(projectUrl).host;
  const expectedPrefix = `/storage/v1/object/public/listing-images/${userId}/`;
  for (const value of urls) {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.host !== expectedHost ||
      !url.pathname.startsWith(expectedPrefix)
    ) {
      throw new Error("Listing images must be uploaded through BookSwap.");
    }
  }
}
