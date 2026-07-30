export function isPrivateBeta(env: NodeJS.ProcessEnv = process.env) {
  return env.BOOKSWAP_PRIVATE_BETA === "true";
}
