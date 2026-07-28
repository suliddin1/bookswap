import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const packages = lock.packages ?? {};
const legacyBraceExpansionLocation = "node_modules/brace-expansion";
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

const knownDevelopmentAdvisories = [
  {
    id: "GHSA-mh99-v99m-4gvg",
    location: legacyBraceExpansionLocation,
    package: "brace-expansion",
    version: "1.1.16",
    fixedVersion: "5.0.8",
    reason:
      "minimatch 3 requires the callable brace-expansion 1.x API; 5.x is not a compatible override",
  },
];

function isAffectedBraceExpansion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return true;
  const [, major, minor, patch] = match.map(Number);
  return major < 5 || (major === 5 && minor === 0 && patch <= 7);
}

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

  if (
    name === "brace-expansion" &&
    isAffectedBraceExpansion(metadata.version) &&
    location !== legacyBraceExpansionLocation
  ) {
    failures.push({
      location,
      advisory: "GHSA-mh99-v99m-4gvg",
      version: metadata.version,
      reason: "unexpected affected brace-expansion copy",
    });
  }
}

const legacyBraceExpansion = packages[legacyBraceExpansionLocation];
if (legacyBraceExpansion?.dev !== true) {
  failures.push({
    location: legacyBraceExpansionLocation,
    advisory: "GHSA-mh99-v99m-4gvg",
    reason: "known affected legacy copy must remain development-only",
  });
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
    affectedProductionBraceExpansionCopies: 0,
    knownDevelopmentAdvisories,
  }),
);
