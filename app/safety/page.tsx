import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";
import { AZ_COPY } from "@/lib/i18n";

const copy = AZ_COPY.safety;

export const metadata = {
  title: copy.metadataTitle,
  description: copy.metadataDescription,
};

export default function SafetyPage() {
  return (
    <InfoPage eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro}>
      {copy.sections.map((section) => (
        <InfoSection key={section.id} id={section.id} title={section.title}>
          <p>{section.body}</p>
          {section.items.length > 0 && (
            <ul className="list-disc space-y-2 pl-5">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </InfoSection>
      ))}
      <nav
        aria-label={copy.relatedLabel}
        className="flex flex-col items-start gap-3 border-t border-[#5b3c25]/30 pt-6 sm:flex-row"
      >
        <Link
          className="btn-secondary max-w-full whitespace-normal py-3 text-center leading-5"
          href="/faq"
        >
          {copy.faqAction}
        </Link>
        <Link
          className="btn-secondary max-w-full whitespace-normal py-3 text-center leading-5"
          href="/user-rights"
        >
          {copy.rightsAction}
        </Link>
        <Link
          className="btn-secondary max-w-full whitespace-normal py-3 text-center leading-5"
          href="/marketplace-rules"
        >
          Kitab bazarı qaydaları
        </Link>
        <Link
          className="btn-secondary max-w-full whitespace-normal py-3 text-center leading-5"
          href="/moderation-appeals"
        >
          Moderasiya qərarına etiraz
        </Link>
      </nav>
    </InfoPage>
  );
}
