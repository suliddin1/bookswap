import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const EXPECTED_DEVELOPMENT_URL_SHA256 =
  "5e74aa476bfdc401db2cf40f68dc08c349df0d763cb9188d0763a07097cb7163";
const EXPECTED_CONFIRMATION_SHA256 =
  "c20585ead668991423a9cc51342a5b511f80a39d69d9ba342df46de28434bf3f";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [
          line.slice(0, separator),
          line.slice(separator + 1).replace(/^(['"])(.*)\1$/, "$2"),
        ];
      }),
  );
}

export function loadDevelopmentEnv(root = process.cwd()) {
  const local = parseEnvFile(path.join(root, ".env.local"));
  const test = parseEnvFile(path.join(root, ".env.test.local"));
  return { ...local, ...test, ...process.env };
}

function projectRefFromUrl(value) {
  try {
    const host = new URL(value).hostname;
    const match = host.match(/^([a-z]+)\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function jwtClaims(value) {
  try {
    return JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString());
  } catch {
    return null;
  }
}

export function validateDevelopmentEnv(env, { authorization = false } = {}) {
  const failures = [];
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = projectRefFromUrl(url);
  if (sha256(url) !== EXPECTED_DEVELOPMENT_URL_SHA256 || !ref) {
    failures.push(
      "NEXT_PUBLIC_SUPABASE_URL does not match the authorized development target.",
    );
  }
  const publicClaims = jwtClaims(env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
  if (publicClaims?.role !== "anon" || publicClaims.ref !== ref) {
    failures.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or does not match the authorized development target.",
    );
  }
  if (authorization) {
    const serviceClaims = jwtClaims(env.SUPABASE_SERVICE_ROLE_KEY ?? "");
    if (serviceClaims?.role !== "service_role" || serviceClaims.ref !== ref) {
      failures.push(
        "SUPABASE_SERVICE_ROLE_KEY is missing or does not match the authorized development target.",
      );
    }
    if (
      sha256(env.BOOKSWAP_REMOTE_TEST_CONFIRMATION ?? "") !==
      EXPECTED_CONFIRMATION_SHA256
    ) {
      failures.push(
        "BOOKSWAP_REMOTE_TEST_CONFIRMATION does not authorize the development target.",
      );
    }
  }
  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
  return {
    authorization,
    expectedDevelopmentTarget: true,
    publicRoleVerified: true,
    serviceRoleVerified: authorization,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const authorization = process.argv.includes("--authorization");
    const status = validateDevelopmentEnv(loadDevelopmentEnv(), {
      authorization,
    });
    console.log(JSON.stringify({ event: "environment.valid", ...status }));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Environment validation failed.",
    );
    process.exitCode = 1;
  }
}
