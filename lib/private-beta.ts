export function isPrivateBeta(env?: { BOOKSWAP_PRIVATE_BETA?: string }) {
  const value =
    env === undefined
      ? process.env.BOOKSWAP_PRIVATE_BETA
      : env.BOOKSWAP_PRIVATE_BETA;
  return value === "true";
}
