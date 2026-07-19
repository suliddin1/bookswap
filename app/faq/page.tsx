import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";
import { AZ_COPY } from "@/lib/i18n";

const copy = AZ_COPY.faq;

export const metadata = {
  title: copy.metadataTitle,
  description: copy.metadataDescription,
};

export default function FaqPage() {
  return (
    <InfoPage eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro}>
      <div className="grid gap-4">
        {copy.questions.map(({ question, answer }, index) => (
          <details key={question} className="card group p-5" open={index === 0}>
            <summary className="min-h-11 cursor-pointer rounded-sm py-2 font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange">
              {question}
            </summary>
            <p className="mt-3 text-sm leading-7 text-gray-600">{answer}</p>
          </details>
        ))}
      </div>
      <InfoSection id="additional-help" title={copy.moreTitle}>
        <p>{copy.moreBody}</p>
        <nav
          aria-label={copy.moreTitle}
          className="flex flex-col items-start gap-3 sm:flex-row"
        >
          <Link
            className="btn-secondary max-w-full whitespace-normal py-3 text-center leading-5"
            href="/safety"
          >
            {copy.safetyAction}
          </Link>
          <Link
            className="btn-secondary max-w-full whitespace-normal py-3 text-center leading-5"
            href="/user-rights"
          >
            {copy.rightsAction}
          </Link>
        </nav>
      </InfoSection>
    </InfoPage>
  );
}
