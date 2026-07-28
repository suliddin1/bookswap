import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEVELOPMENT_PROJECT_REF = "uibatsbzjswmtdvdrlxj";
export const DEVELOPMENT_PROJECT_NAME = "bookswap-development";
export const DEVELOPMENT_URL = `https://${DEVELOPMENT_PROJECT_REF}.supabase.co`;

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

export function validateDevelopmentEnv(env, { authorization = false } = {}) {
  const failures = [];
  const ref = projectRefFromUrl(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (env.NEXT_PUBLIC_SUPABASE_URL !== DEVELOPMENT_URL) {
    failures.push(
      `NEXT_PUBLIC_SUPABASE_URL must target ${DEVELOPMENT_PROJECT_NAME} (${DEVELOPMENT_PROJECT_REF}); observed ref: ${ref ?? "missing/invalid"}.`,
    );
  }
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    failures.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }
  if (authorization) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      failures.push(
        "SUPABASE_SERVICE_ROLE_KEY is missing from .env.test.local.",
      );
    }
    if (env.BOOKSWAP_REMOTE_TEST_CONFIRMATION !== DEVELOPMENT_PROJECT_NAME) {
      failures.push(
        `BOOKSWAP_REMOTE_TEST_CONFIRMATION must equal ${DEVELOPMENT_PROJECT_NAME}.`,
      );
    }
  }
  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
  return {
    authorization,
    projectName: DEVELOPMENT_PROJECT_NAME,
    projectRef: DEVELOPMENT_PROJECT_REF,
    hasPublicKey: true,
    hasServiceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
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
