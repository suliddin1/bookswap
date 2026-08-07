import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationRoot = path.join(root, "supabase", "migrations");
const failures = [];

const expectedMigrations = new Map([
  [
    "202606140001_init.sql",
    "95c30fe9550a05fbc9edf0daff61d1960931955a82b6709bbde54251b4f76968",
  ],
  [
    "202606140002_marketplace_upgrade.sql",
    "1bd601d9fdf05aded9fe03881acacbd8ff224203e0a5d883120607daa2a8253e",
  ],
  [
    "202606150001_production_hardening.sql",
    "2903172dd9d5bb97cd01eaba88c8e56a779c4adeef1f7ebf3140286bc17a7362",
  ],
  [
    "20260712155914_security_marketplace_hardening.sql",
    "b52d3a2b37a7313ca395904058d5e739a3932a0f53f7b7c0d2b6438ad3a848b3",
  ],
  [
    "20260714033950_fix_chat_room_seller_authorization.sql",
    "26cf50aaca0adcaad3669638e348279a567cdaf672e854efea15154d89bb3f98",
  ],
  [
    "20260714035115_add_chat_room_listing_seller_index.sql",
    "5f5f101e106b4250a67a76bf9d31fa8a1aed4244772ecc46c558cc92dad764fc",
  ],
  [
    "20260714040618_secure_favorite_listing_visibility.sql",
    "178e91516d61fad288487299a6da8f685a0d8b5a63c209686b2681d9c0cc8465",
  ],
  [
    "20260714041157_restrict_banned_user_favorite_access.sql",
    "c750fef24f0fbee30d747b024b4d7090f72bc36e402ea83bbba4d564b37d01be",
  ],
  [
    "20260714052000_add_listing_image_cleanup_jobs.sql",
    "9eddd7a5292639f754c37fd51232256a2eaecfd133240bc8e754706fab82bf37",
  ],
  [
    "20260714053500_allow_owner_listing_image_selection.sql",
    "a4261460bc78a22874c27e5f9f207ca5485325913781c1621d5558a7b25afa35",
  ],
  [
    "20260714054500_make_cleanup_jobs_service_only_explicit.sql",
    "710658b8215f818addcb9b3a5fe844ad5c58aa5d707c37556ad51d44617f2104",
  ],
  [
    "20260714055500_deduplicate_listing_image_cleanup_jobs.sql",
    "ed3b68e15b40f0ab604612c009e71681702cf60c0979c6b6047040e59eacb28c",
  ],
  [
    "20260714061000_add_listing_pagination_indexes.sql",
    "da679232bda76160d0dfe95ef6883f55f7a40c2749bae8a734651fc50c7d75f1",
  ],
  [
    "20260714063000_add_chat_read_state_and_durable_notifications.sql",
    "d1e5f1f0ba123e9bd6386e7149b279ef08ef55efa3d3a0b7d28dc857b7df5dba",
  ],
  [
    "20260714070000_add_reviewable_moderation_decisions.sql",
    "42002c316dfd7ee80fc6396eb98cf67492e04c4746ca90755465b4d8f7f4e7d4",
  ],
  [
    "20260714073000_add_transactional_admin_audit.sql",
    "7db5f61535334063ac6b25c2f8bca3136120a2d3189bb01e3a898dd0a9ddc89d",
  ],
  [
    "20260714080000_require_protected_listing_mutations.sql",
    "549cd6c7c5bbc1caec32750bdee847b22e346a5aae9e07542d4d19a3604aac27",
  ],
  [
    "20260724090000_add_public_marketplace_page_rpcs.sql",
    "ffcf3f3eda3563a5bedc40f46c938f87469b02f17c14bb0519ae9783862c6c94",
  ],
  [
    "20260724093000_contain_marketplace_page_rpcs.sql",
    "2908f9f9f3bc87991c3270be6c8233d1e2cf1d28f44eb72e89c5ee363802b78b",
  ],
  [
    "20260724094500_reject_null_marketplace_sort.sql",
    "708910281e83c9c3055c27ab12cc17fb3b4c5cb11442b80039aafe5c4d0d82c0",
  ],
  [
    "20260728064350_launch_readiness_hardening.sql",
    "19c9eeaf28df4c48cfdfebf3a72ab528c73376efdb5a790707441f74f1cfd7b1",
  ],
  [
    "20260728071355_clarify_private_rate_limit_policy.sql",
    "cef8da68fac2ea00fd9a4b19f55090c7078d3af6fbc4848774ff305774124ec7",
  ],
  [
    "20260807090000_add_legal_acceptance_audit.sql",
    "81189b93ced1bdef0b41063ef56ee9660d5650e4d379c093beada8f02dcd2fb9",
  ],
]);

function normalizedSql(source) {
  return source
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, "");
}

const actualMigrations = readdirSync(migrationRoot)
  .filter((file) => file.endsWith(".sql"))
  .toSorted();
const expectedNames = [...expectedMigrations.keys()];

if (JSON.stringify(actualMigrations) !== JSON.stringify(expectedNames)) {
  failures.push("The immutable 23-file migration inventory changed.");
}

for (const [file, expectedHash] of expectedMigrations) {
  const filePath = path.join(migrationRoot, file);
  if (!existsSync(filePath)) continue;
  const hash = createHash("sha256")
    .update(normalizedSql(readFileSync(filePath, "utf8")))
    .digest("hex");
  if (hash !== expectedHash) {
    failures.push(`Migration fingerprint changed: ${file}`);
  }
}

const requiredDocuments = [
  "docs/ai/PRODUCTION_MIGRATION_REHEARSAL.md",
  "docs/production-migration-runbook.md",
  "supabase/tests/production_rehearsal_read_only.sql",
];
for (const file of requiredDocuments) {
  if (!existsSync(path.join(root, file))) failures.push(`Missing ${file}.`);
}

const runbookPath = path.join(root, "docs", "production-migration-runbook.md");
if (existsSync(runbookPath)) {
  const runbook = readFileSync(runbookPath, "utf8");
  for (const required of [
    "No production reset",
    "migration repair",
    "db push --dry-run",
    "session_replication_role",
    "supabase_migrations",
    "Storage",
    "RPO",
    "RTO",
    "https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore",
    "https://www.postgresql.org/docs/17/backup-dump.html",
  ]) {
    if (!runbook.includes(required))
      failures.push(`Runbook is missing: ${required}`);
  }
}

const readOnlyPath = path.join(
  root,
  "supabase",
  "tests",
  "production_rehearsal_read_only.sql",
);
if (existsSync(readOnlyPath)) {
  const source = readFileSync(readOnlyPath, "utf8");
  const withoutComments = source.replace(/--.*$/gm, "");
  if (!/set\s+transaction\s+read\s+only/i.test(withoutComments)) {
    failures.push(
      "Production inventory SQL must set the transaction read only.",
    );
  }
  if (
    /^\s*(alter|create|delete|drop|grant|insert|revoke|truncate|update)\b/im.test(
      withoutComments,
    )
  ) {
    failures.push("Production inventory SQL contains a mutating statement.");
  }
  if (!/^\s*rollback\s*;\s*$/im.test(withoutComments)) {
    failures.push(
      "Production inventory SQL must end its transaction with rollback.",
    );
  }
}

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const prohibitedBackupNames =
  /(?:^|\/)(?:roles|schema|data|history_schema|history_data)\.sql$|\.(?:backup|dump|gpg|7z)$/i;

function findBackupArtifacts(directory, relative = "") {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const absolute = path.join(directory, entry);
    const nextRelative = path.join(relative, entry).replaceAll("\\", "/");
    if (statSync(absolute).isDirectory()) {
      findBackupArtifacts(absolute, nextRelative);
    } else if (prohibitedBackupNames.test(nextRelative)) {
      failures.push(
        `Backup artifact must remain outside the repository: ${nextRelative}`,
      );
    }
  }
}

findBackupArtifacts(root);

if (failures.length) {
  console.error(
    JSON.stringify(
      { event: "production_rehearsal_static_check.failed", failures },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    event: "production_rehearsal_static_check.passed",
    migrationCount: expectedMigrations.size,
    backupArtifactsInRepository: 0,
  }),
);
