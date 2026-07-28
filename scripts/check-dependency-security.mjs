import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const packages = lock.packages ?? {};
const required = {
  "node_modules/next": "15.5.21",
  "node_modules/eslint-config-next": "15.5.21",
  "node_modules/sharp": "0.35.3",
  "node_modules/postcss": "8.5.18",
  "node_modules/js-yaml": "4.3.0",
  "node_modules/brace-expansion": "1.1.16",
  "node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion":
    "5.0.8",
};
const failures = [];

for (const [location, expected] of Object.entries(required)) {
  const actual = packages[location]?.version;
  if (actual !== expected) failures.push({ location, expected, actual });
}

const blocked = new Set(["brace-expansion@1.1.15", "brace-expansion@5.0.6"]);
for (const [location, metadata] of Object.entries(packages)) {
  if (!location.includes("node_modules/") || !metadata?.version) continue;
  const name = location.slice(location.lastIndexOf("node_modules/") + 13);
  const identifier = `${name}@${metadata.version}`;
  if (blocked.has(identifier)) failures.push({ location, blocked: identifier });
}

if (failures.length) {
  console.error(
    JSON.stringify({ event: "dependency_baseline.failed", failures }, null, 2),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    event: "dependency_baseline.passed",
    verifiedPackages: Object.keys(required).length,
  }),
);
