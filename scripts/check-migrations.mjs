import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationRoot = path.join(root, "supabase", "migrations");
const files = readdirSync(migrationRoot)
  .filter((file) => file.endsWith(".sql"))
  .toSorted();
const failures = [];

if (new Set(files).size !== files.length)
  failures.push("Migration filenames must be unique.");
if (files.some((file) => !/^\d{12}(?:\d{2})?_[a-z0-9_]+\.sql$/.test(file)))
  failures.push(
    "Every migration must use the established 12/14-digit timestamp and snake_case name.",
  );

const hardening = readFileSync(
  path.join(migrationRoot, "20260728064350_launch_readiness_hardening.sql"),
  "utf8",
);
for (const required of [
  "listings_title_length",
  "privacy_requests_one_active_type_idx",
  "private.validate_listing_report",
  "private.validate_listing_review",
  "private.user_is_active(new.sender_id)",
  'drop policy if exists "Users upload listing images"',
  "private.normalize_az_text",
  "create table private.rate_limit_buckets",
  "public.consume_rate_limit",
  "set search_path = ''",
  "Elanınız təsdiqləndi.",
]) {
  if (!hardening.includes(required))
    failures.push(`Launch hardening is missing: ${required}`);
}

const legalAcceptance = readFileSync(
  path.join(migrationRoot, "20260807090000_add_legal_acceptance_audit.sql"),
  "utf8",
);
for (const required of [
  "create table public.legal_acceptances",
  "legal_acceptances_current_versions",
  "legal_acceptances_affirmative_consent",
  'create policy "Users view their own legal acceptances"',
  "private.record_signup_legal_acceptance",
  "set search_path = ''",
  "cross_border_transfer_disclosed_and_consented",
  "consent_withdrawal",
]) {
  if (!legalAcceptance.includes(required))
    failures.push(`Legal acceptance migration is missing: ${required}`);
}
for (const forbidden of ["grant insert", "grant update"]) {
  if (legalAcceptance.includes(forbidden))
    failures.push(`Legal acceptance table must remain immutable: ${forbidden}`);
}
if (
  !legalAcceptance.includes(
    "grant delete on table public.legal_acceptances to service_role",
  )
)
  failures.push(
    "Legal acceptance retention cleanup must remain service-role only.",
  );

const config = readFileSync(path.join(root, "supabase", "config.toml"), "utf8");
for (const required of [
  "major_version = 17",
  'file_size_limit = "5MiB"',
  "minimum_password_length = 12",
  'password_requirements = "letters_digits"',
  "enable_refresh_token_rotation = true",
  "enable_anonymous_sign_ins = false",
]) {
  if (!config.includes(required))
    failures.push(`Local config is missing: ${required}`);
}

const seed = readFileSync(path.join(root, "supabase", "seed.sql"), "utf8");
if (
  seed.indexOf("insert into public.chat_rooms") >
  seed.indexOf("insert into public.reviews")
)
  failures.push("Seed buyer conversation must be created before the review.");

const databaseTypes = readFileSync(
  path.join(root, "lib", "database.types.ts"),
  "utf8",
);
if (!databaseTypes.includes("consume_rate_limit:"))
  failures.push("Generated database types are missing consume_rate_limit.");
if (!databaseTypes.includes("legal_acceptances:"))
  failures.push("Generated database types are missing legal_acceptances.");

if (failures.length) {
  console.error(
    JSON.stringify(
      { event: "migration_static_check.failed", failures },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    event: "migration_static_check.passed",
    migrationCount: files.length,
  }),
);
