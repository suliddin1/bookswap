import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  loadDevelopmentEnv,
  validateDevelopmentEnv,
} from "./validate-development-env.mjs";

const root = process.cwd();
const env = loadDevelopmentEnv(root);

try {
  validateDevelopmentEnv(env, { authorization: true });
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Authorization preflight failed.",
  );
  process.exit(1);
}

const vitest = path.join(root, "node_modules", "vitest", "vitest.mjs");
const result = spawnSync(
  process.execPath,
  [vitest, "run", "tests/authorization.integration.test.ts", "--root", root],
  {
    cwd: root,
    env: { ...env, RUN_REMOTE_AUTHORIZATION_TESTS: "1" },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
