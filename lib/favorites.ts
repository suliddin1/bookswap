export const FAVORITE_VISIBLE_STATUSES = ["active", "sold"] as const;

type FavoriteListingCandidate = {
  status?: unknown;
  seller?: { banned?: unknown } | null;
};

export function isFavoriteListingVisible(
  listing: FavoriteListingCandidate | null | undefined,
) {
  return Boolean(
    listing &&
      FAVORITE_VISIBLE_STATUSES.includes(
        listing.status as (typeof FAVORITE_VISIBLE_STATUSES)[number],
      ) &&
      listing.seller?.banned === false,
  );
}
