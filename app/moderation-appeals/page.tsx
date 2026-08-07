import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";
import {
  getLegalIdentity,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_VERSION,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Moderasiya etirazları",
  description:
    "BookSwap moderasiya qərarına etiraz etmək və qərarın yenidən baxılmasını istəmək qaydası.",
};

export default function ModerationAppealsPage() {
  const legal = getLegalIdentity();
  const contact = legal.complete
    ? legal.contactEmail
    : "ictimai istifadədən əvvəl göstəriləcək hüquqi əlaqə";

  return (
    <InfoPage
      eyebrow={`Versiya ${LEGAL_VERSION} · Son yenilənmə: ${LEGAL_EFFECTIVE_DATE}`}
      title="Moderasiya qərarına etiraz."
      intro={`Elanınız, rəyiniz və ya hesabınız barədə moderasiya qərarının səhv olduğunu düşünürsünüzsə, qərarın yenidən nəzərdən keçirilməsini istəyə bilərsiniz. Hüquqi əlaqə: ${contact}.`}
    >
      <InfoSection
        id="eligible-decisions"
        title="Hansı qərarlara etiraz etmək olar"
      >
        <p>
          Elanın gizlədilməsi və ya silinməsi, hesabın məhdudlaşdırılması və ya
          dayandırılması, rəyin silinməsi və digər tətbiqdaxili moderasiya
          tədbirləri üçün etiraz göndərilə bilər. Etiraz yeni şikayət yaratmaq
          üçün deyil; başqa istifadəçinin qayda pozuntusunu tətbiqdaxili şikayət
          vasitəsilə bildirin.
        </p>
      </InfoSection>
      <InfoSection id="appeal-content" title="Etirazda nə olmalıdır">
        <p>
          Hesabınızla əlaqəli e-poçtu, qərarın tarixini, mümkün olduqda elan və
          ya qərar identifikatorunu, qərarın niyə səhv olduğunu və təsdiqləyici
          faktları təqdim edin. Şifrə, təsdiq kodu, kart məlumatı və şəxsiyyət
          sənədinin tam surətini göndərməyin. Yalnız şəxsiyyətin qanuni və
          zəruri təsdiqi ayrıca təhlükəsiz kanalla tələb oluna bilər.
        </p>
      </InfoSection>
      <InfoSection id="review-process" title="Yenidən baxılma prosesi">
        <p>
          Etiraz ilkin qərarın məlumatları ilə birlikdə səlahiyyətli moderator
          və ya admin tərəfindən nəzərdən keçirilməlidir. Mümkün olduqda ilkin
          qərarı verən şəxsdən fərqli baxış tətbiq edilir. Nəticə və əsas səbəb
          istifadəçiyə bildirilir; audit qeydi qorunur. Adi istifadəçi və
          şikayətçi moderasiya vəziyyətini özləri dəyişə bilməz.
        </p>
      </InfoSection>
      <InfoSection id="timing" title="Müddət və təkrar müraciət">
        <p>
          Etirazlar mümkün qədər tez və işin mürəkkəbliyinə uyğun müddətdə
          nəzərdən keçirilir. Eyni faktlarla ardıcıl təkrar müraciətə
          məhdudiyyət qoyula bilər; yeni əhəmiyyətli sübut olduqda yenidən
          baxılma istənilə bilər.
        </p>
      </InfoSection>
      <InfoSection id="urgent-safety" title="Təcili təhlükə və qanuni sorğular">
        <p>
          Etiraz prosesi təcili yardım xidməti deyil. Dərhal təhlükə, hədə-qorxu
          və ya mümkün cinayət halında yerli təcili yardım və hüquq-mühafizə
          xidmətlərinə müraciət edin. Hüquqi və məxfilik sorğuları {contact}
          əlaqəsinə yönəldilə bilər.
        </p>
      </InfoSection>
      <InfoSection id="related-rules" title="Əlaqəli qaydalar">
        <p>
          Moderasiya meyarları üçün
          <Link href="/marketplace-rules" className="text-orange underline">
            {" "}
            Kitab bazarı qaydalarına
          </Link>{" "}
          və məlumat hüquqları üçün
          <Link href="/user-rights" className="text-orange underline">
            {" "}
            İstifadəçi hüquqları səhifəsinə
          </Link>{" "}
          baxın.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
