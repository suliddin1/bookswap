import { isPrivateBeta } from "@/lib/private-beta";

export const LEGAL_VERSION = "2026-08-07";
export const LEGAL_EFFECTIVE_DATE = "7 avqust 2026";

export const LEGAL_OPERATOR_FULL_NAME = "Suliddin Musa Əsədzadə";
export const LEGAL_CONTACT_EMAIL = "Suliddin677@gmail.com";

const UNCONFIGURED_LEGAL_CONTACT_VALUES = new Set([
  "[EMAIL]",
  "{{LEGAL_CONTACT_EMAIL}}",
]);

type LegalEnvironment = Partial<
  Record<
    | "BOOKSWAP_PRIVATE_BETA"
    | "LEGAL_OPERATOR_FULL_NAME"
    | "LEGAL_CONTACT_EMAIL",
    string
  >
>;

function configuredValue(
  env: LegalEnvironment,
  key: "LEGAL_OPERATOR_FULL_NAME" | "LEGAL_CONTACT_EMAIL",
  approvedFallback: string,
) {
  return Object.prototype.hasOwnProperty.call(env, key)
    ? (env[key]?.trim() ?? "")
    : approvedFallback;
}

export function getLegalIdentity(env?: LegalEnvironment): {
  operatorFullName: string;
  contactEmail: string;
  complete: boolean;
  privateBeta: boolean;
} {
  const source = env ?? {
    ...(process.env.BOOKSWAP_PRIVATE_BETA === undefined
      ? {}
      : { BOOKSWAP_PRIVATE_BETA: process.env.BOOKSWAP_PRIVATE_BETA }),
    ...(process.env.LEGAL_OPERATOR_FULL_NAME === undefined
      ? {}
      : { LEGAL_OPERATOR_FULL_NAME: process.env.LEGAL_OPERATOR_FULL_NAME }),
    ...(process.env.LEGAL_CONTACT_EMAIL === undefined
      ? {}
      : { LEGAL_CONTACT_EMAIL: process.env.LEGAL_CONTACT_EMAIL }),
  };
  const operatorFullName = configuredValue(
    source,
    "LEGAL_OPERATOR_FULL_NAME",
    LEGAL_OPERATOR_FULL_NAME,
  );
  const contactEmail = configuredValue(
    source,
    "LEGAL_CONTACT_EMAIL",
    LEGAL_CONTACT_EMAIL,
  );
  const privateBeta = isPrivateBeta(env);
  const complete = Boolean(
    operatorFullName &&
    contactEmail &&
    !UNCONFIGURED_LEGAL_CONTACT_VALUES.has(contactEmail),
  );

  if (!privateBeta && !complete) {
    throw new Error(
      "Public launch requires LEGAL_OPERATOR_FULL_NAME and LEGAL_CONTACT_EMAIL.",
    );
  }

  return { operatorFullName, contactEmail, complete, privateBeta };
}

export function legalIdentityNotice(identity = getLegalIdentity()) {
  if (identity.complete) {
    return `BookSwap ${identity.operatorFullName} tərəfindən idarə olunur. Hüquqi və məxfilik əlaqəsi: ${identity.contactEmail}.`;
  }

  return "Hüquqi operator və əlaqə məlumatı ictimai istifadədən əvvəl tamamlanmalıdır.";
}
