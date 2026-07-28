const LOCAL_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configured) {
    return new URL(LOCAL_SITE_URL);
  }

  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return new URL(LOCAL_SITE_URL);
    }

    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(LOCAL_SITE_URL);
  }
}
