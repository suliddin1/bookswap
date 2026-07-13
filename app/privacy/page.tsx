import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata = {
  title: "Privacy Notice",
  description: "How BookSwap handles personal data.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Effective 12 July 2026"
      title="Məxfilik bildirişi."
      intro="Bu bildiriş BookSwap istifadə edərkən hansı məlumatların nə üçün toplandığını, kimlərlə bölüşüldüyünü və seçimlərinizi izah edir."
    >
      <InfoSection title="Topladığımız məlumatlar">
        <p>
          Hesab məlumatları: ad, email, autentifikasiya identifikatoru,
          seçdiyiniz şəhər və könüllü telefon nömrəsi. Marketplace məlumatları:
          elan, foto, qiymət, ISBN, favorit, mesaj, rəy, report və moderasiya
          qeydləri. Texniki məlumatlar: təhlükəsizlik və diaqnostika üçün IP
          ünvanı, cihaz/browser məlumatı və sorğu vaxtı.
        </p>
      </InfoSection>
      <InfoSection title="İstifadə məqsədləri">
        <p>
          Hesabı yaratmaq və qorumaq, elan və mesaj xidmətlərini göstərmək,
          fırıldaqçılıq və sui-istifadəni araşdırmaq, bildiriş göndərmək, hüquqi
          öhdəlikləri yerinə yetirmək və xidmətin etibarlılığını ölçmək.
        </p>
      </InfoSection>
      <InfoSection title="Public və private məlumat">
        <p>
          Ad, şəhər, elanlar və yazdığınız rəylər ictimai görünə bilər. Email,
          telefon, admin/ban statusu və şəxsi mesajlar public profilə daxil
          edilmir. Telefon nömrəsini yalnız öz qərarınızla söhbətdə paylaşın.
        </p>
      </InfoSection>
      <InfoSection title="Xidmət təminatçıları">
        <p>
          BookSwap hosting üçün Vercel, autentifikasiya/database/storage üçün
          Supabase, aktivləşdirildikdə email üçün Resend və təhlükəsizlik
          moderasiyası üçün OpenAI və ya Cloudflare kimi təminatçılardan
          istifadə edə bilər. Onlara yalnız xidmət üçün lazım olan məlumat
          ötürülür.
        </p>
      </InfoSection>
      <InfoSection title="Saxlama müddəti">
        <p>
          Məlumat məqsəd üçün lazım olduğu, hesab aktiv qaldığı və ya
          hüquqi/təhlükəsizlik öhdəliyi mövcud olduğu müddətdə saxlanılır. Silmə
          sorğusundan sonra fraud qarşısının alınması, mübahisə və qanuni
          öhdəlik üçün zəruri minimal qeydlər məhdud müddət qala bilər.
        </p>
      </InfoSection>
      <InfoSection title="Hüquqlarınız">
        <p>
          Məlumatınıza çıxış, düzəliş, ixrac, etiraz və silinmə sorğusu verə
          bilərsiniz. Sorğunu{" "}
          <a href="/user-rights" className="text-orange underline">
            İstifadəçi hüquqları
          </a>{" "}
          səhifəsindən göndərin. Şəxsiyyətin təsdiqi tələb oluna bilər.
        </p>
      </InfoSection>
      <InfoSection title="Hüquqi mənbə">
        <p>
          Bu bildiriş Azərbaycan Respublikasının{" "}
          <a
            href="https://e-qanun.az/framework/19675"
            target="_blank"
            rel="noreferrer"
            className="text-orange underline"
          >
            “Fərdi məlumatlar haqqında” Qanunu
          </a>{" "}
          nəzərə alınaraq hazırlanıb. Bu mətn hüquqi məsləhət deyil və
          kommersiya buraxılışından əvvəl operatorun hüquqi məlumatları ilə
          tamamlanmalıdır.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
