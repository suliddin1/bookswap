export function isResponseRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function readResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AbortError"
    )
      throw error;
    return null;
  }
}

export function getResponseErrorCode(value: unknown): unknown {
  return isResponseRecord(value) ? value.code : undefined;
}
