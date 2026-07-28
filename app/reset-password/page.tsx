import type { Metadata } from "next";
import { ResetPasswordPanel } from "@/components/reset-password-panel";
import { AZ_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: AZ_COPY.resetPassword.metadataTitle,
  description: AZ_COPY.resetPassword.metadataDescription,
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordPanel />;
}
