import { getSupabaseClient } from "@/lib/supabase";
import { AZ_COPY, localizeApiError } from "@/lib/i18n";

export class LocalizedClientError extends Error {
  override name = "LocalizedClientError";
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const supabase = getSupabaseClient();
  if (!supabase)
    throw new LocalizedClientError(AZ_COPY.auth.configurationUnavailable);
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token)
    throw new LocalizedClientError(
      localizeApiError("AUTH_REQUIRED", AZ_COPY.auth.failed),
    );
  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });
}
