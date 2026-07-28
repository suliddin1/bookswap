import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth-panel";
import { AZ_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: AZ_COPY.auth.metadataTitle,
  description: AZ_COPY.auth.metadataDescription,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthPanel />;
}
