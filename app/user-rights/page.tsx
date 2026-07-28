import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info-page";
import { PrivacyRequestForm } from "@/components/privacy-request-form";
import { AZ_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: AZ_COPY.userRights.metadataTitle,
  description: AZ_COPY.userRights.metadataDescription,
};

export default function UserRightsPage() {
  return (
    <InfoPage
      eyebrow={AZ_COPY.userRights.eyebrow}
      title={AZ_COPY.userRights.title}
      intro={AZ_COPY.userRights.intro}
    >
      <InfoSection title={AZ_COPY.userRights.rightsTitle}>
        <ul className="list-disc space-y-2 pl-5">
          {AZ_COPY.userRights.rights.map((right) => (
            <li key={right}>{right}</li>
          ))}
        </ul>
      </InfoSection>
      <InfoSection title={AZ_COPY.userRights.requestTitle}>
        <p>{AZ_COPY.userRights.requestBody}</p>
        <PrivacyRequestForm />
      </InfoSection>
      <InfoSection title={AZ_COPY.userRights.controlsTitle}>
        <p>{AZ_COPY.userRights.controlsBody}</p>
      </InfoSection>
    </InfoPage>
  );
}
