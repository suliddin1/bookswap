import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = execFileSync(
  "git",
  ["ls-files", "-co", "--exclude-standard", "-z"],
  { cwd: root, encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);

const textExtensions = new Set([
  "",
  ".cjs",
  ".css",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const signatures = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["generic-sk-key", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["supabase-secret", /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  ["aws-access-key", /\bAKIA[0-9A-Z]{16}\b/],
  ["resend-key", /\bre_[A-Za-z0-9_-]{24,}\b/],
  [
    "jwt-secret",
    /\beyJ[A-Za-z0-9_-]{80,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  ],
];

const findings = [];
for (const relative of files) {
  const absolute = path.join(root, relative);
  if (!existsSync(absolute)) continue;
  if (!textExtensions.has(path.extname(relative).toLowerCase())) continue;
  if (statSync(absolute).size > 2_000_000) continue;
  const source = readFileSync(absolute, "utf8");
  for (const [label, pattern] of signatures) {
    if (pattern.test(source))
      findings.push({ file: relative, signature: label });
  }

  for (const line of source.split(/\r?\n/)) {
    const assignment = line.match(
      /(?:SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|VERCEL_TOKEN)[ \t]*=[ \t]*(.*)$/i,
    );
    if (!assignment) continue;
    const value = assignment[1].trim().replace(/^['"]|['"]$/g, "");
    if (
      !value ||
      /^(?:env\(|\[|<|your-|replace-|example-|placeholder|test-|development-|fake-|dummy-)/i.test(
        value,
      ) ||
      /^[A-Za-z_$][\w$]*;?$/.test(value)
    )
      continue;
    findings.push({ file: relative, signature: "assigned-sensitive-value" });
  }
}

const uniqueFindings = [
  ...new Map(
    findings.map((finding) => [
      `${finding.file}:${finding.signature}`,
      finding,
    ]),
  ).values(),
];

if (uniqueFindings.length) {
  console.error(
    JSON.stringify(
      { event: "secret_scan.failed", findings: uniqueFindings },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({ event: "secret_scan.passed", filesChecked: files.length }),
);
