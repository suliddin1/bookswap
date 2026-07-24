import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const buildRoot = new URL("../.next/", import.meta.url);
const manifestUrl = new URL("app-build-manifest.json", buildRoot);
const buildManifestUrl = new URL("build-manifest.json", buildRoot);

let appManifest;
let buildManifest;
try {
  appManifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
  buildManifest = JSON.parse(readFileSync(buildManifestUrl, "utf8"));
} catch (error) {
  console.error(
    "Performance budgets require a completed production build. Run `npm run build` first.",
  );
  throw error;
}

const kibibyte = 1024;
const budgets = [
  {
    label: "shared App Router runtime",
    files: buildManifest.rootMainFiles,
    maximumKiB: 105,
  },
  { label: "home", route: "/page", maximumKiB: 195 },
  { label: "catalog", route: "/listings/page", maximumKiB: 195 },
  {
    label: "listing detail",
    route: "/listings/[id]/page",
    maximumKiB: 200,
  },
  {
    label: "seller storefront",
    route: "/sellers/[id]/page",
    maximumKiB: 195,
  },
];

let failed = false;
for (const budget of budgets) {
  const files = budget.files ?? appManifest.pages[budget.route];
  if (!files) {
    console.error(`Missing build-manifest entry for ${budget.label}.`);
    failed = true;
    continue;
  }

  const javascript = [...new Set(files.filter((file) => file.endsWith(".js")))];
  const gzipBytes = javascript.reduce((total, file) => {
    const source = readFileSync(new URL(file, buildRoot));
    return total + gzipSync(source, { level: 9 }).length;
  }, 0);
  const actualKiB = gzipBytes / kibibyte;
  const status = actualKiB <= budget.maximumKiB ? "PASS" : "FAIL";
  console.log(
    `${status} ${budget.label}: ${actualKiB.toFixed(1)} KiB gzip / ${budget.maximumKiB} KiB`,
  );
  if (status === "FAIL") failed = true;
}

if (failed) process.exitCode = 1;
