import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";
import {
  getLegalIdentity,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_VERSION,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Məxfilik və fərdi məlumatların emalı siyasəti",
  description: "BookSwap-da fərdi məlumatların emalı siyasəti.",
};

export default function PrivacyPage() {
  const legal = getLegalIdentity();
  const operator = legal.complete
    ? legal.operatorFullName
    : "ictimai istifadədən əvvəl göstəriləcək hüquqi operator";
  const contact = legal.complete
    ? legal.contactEmail
    : "ictimai istifadədən əvvəl göstəriləcək hüquqi əlaqə";

  return (
    <InfoPage
      eyebrow={`Versiya ${LEGAL_VERSION} · Qüvvəyə minmə və son yenilənmə: ${LEGAL_EFFECTIVE_DATE}`}
      title="Məxfilik və fərdi məlumatların emalı siyasəti"
      intro={`BookSwap-da fərdi məlumatların emalına görə məsul operator ${operator}, hüquqi və məxfilik əlaqəsi ${contact}-dır. Bu Siyasət hansı məlumatların, nə üçün və necə işləndiyini izah edir.`}
    >
      <InfoSection id="operator" title="1. Operator">
        <p>
          Operator: {operator}. Hüquqi və məxfilik əlaqəsi: {contact}. Bu
          Siyasət BookSwap istifadə edilərkən fərdi məlumatların emalına aiddir.
        </p>
      </InfoSection>
      <InfoSection id="data" title="2. Topladığımız məlumatlar">
        <p>
          İstifadə olunan funksiyadan asılı olaraq e-poçt və autentifikasiya
          identifikatoru; göstərilən ad, şəhər və könüllü telefon kimi profil
          sahələri; elan adı, müəllif, ISBN, vəziyyət, qiymət, təsvir, yer və
          foto; seçilmişlər; şəxsi mesajlar; rəylər; şikayət, moderasiya və
          etiraz qeydləri; bildirişlər; məxfilik sorğuları; məhdud IP, cihaz,
          brauzer, sorğu vaxtı, təhlükəsizlik və xəta məlumatı emal oluna bilər.
          Xidmət üçün zəruri olmayan həssas məlumatı göndərməyin.
        </p>
      </InfoSection>
      <InfoSection id="purposes" title="3. Emal məqsədləri">
        <p>
          Məlumat hesab və autentifikasiya, hesab təhlükəsizliyi, elan və
          axtarış/filtr, seçilmişlər, mesajlaşma, rəylər, şikayət və moderasiya,
          məxfilik hüquqları, sui-istifadə/dələduzluq/spamın qarşısının
          alınması, xidmət və təhlükəsizlik bildirişləri, texniki diaqnostika,
          qanuni öhdəlik və səlahiyyətli orqanın qanuni tələbinə cavab üçün
          işlənir.
        </p>
      </InfoSection>
      <InfoSection id="consent" title="4. Razılıq və qəbul qeydi">
        <p>
          Qeydiyyatda İstifadə şərtləri ilə fərdi məlumatların emalına razılıq
          ayrı, əvvəlcədən seçilməmiş nəzarətlərlə təqdim edilir. Qəbul olunan
          sənəd versiyaları, 18+ təsdiqi, transsərhəd ötürmə açıqlaması və
          verilənlər bazası vaxtı auditable qeyddə saxlanılır. Bu mexanizm
          kvalifikasiyalı elektron imza və ya bütün yazılı razılıq məsələlərinin
          qəti hüquqi həlli kimi təqdim edilmir.
        </p>
      </InfoSection>
      <InfoSection id="visibility" title="5. İctimai və məxfi məlumat">
        <p>
          Göstərilən ad, şəhər, elan və fotolar, eləcə də ictimai rəy digər
          istifadəçilərə görünə bilər. E-poçt, autentifikasiya məlumatı,
          telefon, şəxsi mesaj, daxili şikayət, moderasiya, təhlükəsizlik və
          açıq şəkildə dərc edilməyən digər məlumat ictimai profil məlumatı
          deyil.
        </p>
      </InfoSection>
      <InfoSection id="providers" title="6. Xidmət təminatçıları">
        <p>
          BookSwap verilənlər bazası, autentifikasiya və fayl saxlanması üçün
          Supabase-dən, hosting və server icrası üçün Vercel-dən istifadə edir.
          Aktivləşdirildiyi halda tranzaksiya e-poçtu təminatçısı yalnız zəruri
          e-poçt və çatdırılma məlumatını emal edə bilər. Hazırkı tətbiqdə
          reklam və üçüncü tərəf məhsul analitikası yoxdur.
        </p>
      </InfoSection>
      <InfoSection id="cross-border" title="7. Transsərhəd ötürmə">
        <p>
          Xarici infrastruktur təminatçıları konfiqurasiyadan asılı olaraq
          məlumatı Azərbaycan xaricində emal və ya saxlaya bilər. Bu açıqlama
          qeydiyyatda fərdi məlumat razılığının ayrıca hissəsidir. BookSwap
          məlumatın yalnız Azərbaycanda saxlandığını iddia etmir; Supabase və
          Vercel-in faktiki emal yerləri ictimai genişlənmədən əvvəl ayrıca
          yoxlanmalıdır.
        </p>
      </InfoSection>
      <InfoSection id="messages" title="8. Mesajların məxfiliyi">
        <p>
          Şəxsi mesajlar ictimai deyil və yalnız söhbət iştirakçılarına açıqdır.
          Səlahiyyətli əməkdaşın məhdud girişi yalnız əsaslı texniki,
          təhlükəsizlik, şikayət/moderasiya və ya hüquqi zərurət olduqda tətbiq
          edilə bilər. Şifrə, OTP, CVV, bank giriş məlumatı və şəxsiyyət
          sənədinin tam görüntüsünü mesajda paylaşmayın.
        </p>
      </InfoSection>
      <InfoSection id="retention" title="9. Məlumatların saxlanması">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Aktiv profil, elan, mesaj, seçilmiş və xidmət məlumatı hesab aktiv
            olduğu və xidmət üçün lazım olduğu müddətdə saxlanılır.
          </li>
          <li>
            Adi texniki, icra və təhlükəsizlik jurnalları aktiv təhlükəsizlik
            araşdırması üçün daha uzun əsas olmadıqda ən çoxu 90 gün saxlanılır.
          </li>
          <li>
            Şikayət, moderasiya və etiraz qeydləri iş bağlandıqdan sonra davam
            edən hüquqi və ya təhlükəsizlik əsası yoxdursa ən çoxu 12 ay
            saxlanılır.
          </li>
          <li>
            Minimal razılıq və məxfilik sorğusu sübutu daha uzun qanuni əsas
            olmadıqda hesab bağlandıqdan sonra ən çoxu 3 il saxlanılır.
          </li>
        </ul>
        <p>
          Təsdiqlənmiş silinmədən sonra lazım olmayan aktiv-sistem məlumatı
          silinməli və ya məhdudlaşdırılmalıdır. Təminatçı ehtiyat nüsxələri
          normal rotasiya tamamlanana qədər silinmiş məlumatı saxlaya bilər;
          həmin məlumat adi məhsul məqsədi üçün yenidən istifadə edilmir.
          Avtomatik saxlama/silmə mexanizmlərinin bu müddətlərlə və faktiki
          ehtiyat-bərpa davranışı ilə uyğunluğu ictimai məlumat yığımı
          genişlənməzdən əvvəl tamamlanmalı əməliyyat işidir.
        </p>
      </InfoSection>
      <InfoSection id="rights" title="10. İstifadəçinin hüquqları">
        <p>
          Tətbiq olunan hallarda məlumat və çıxarış istəmək, yanlış məlumatı
          düzəltmək, emala etiraz və ya məhdudlaşdırma tələb etmək, razılığı
          geri götürmək və hesabın/məlumatın silinməsini istəmək olar. Sorğuya
          ən çoxu 7 iş günü ərzində cavab verilir; zəruri üçüncü tərəf sorğusu
          olduqda bu müddət daha 7 iş günü uzana bilər. Qanuni əsasla imtina
          edilərsə, tətbiq olunan müddətdə əsaslandırılmış cavab verilir.
          Şəxsiyyət yoxlaması riskə mütənasib olmalıdır.
        </p>
        <p>
          Sorğunu
          <Link className="text-orange underline" href="/user-rights">
            {" "}
            İstifadəçi hüquqları bölməsindən
          </Link>{" "}
          göndərin.
        </p>
      </InfoSection>
      <InfoSection id="security" title="11. Məlumat təhlükəsizliyi">
        <p>
          Faktiki nəzarətlərə autentifikasiya, sətir-səviyyəli və sahiblik
          icazələri, server-side authorization, məhdud service-role istifadəsi,
          fayl imzası və ölçü yoxlaması, dərəcə məhdudiyyəti və həssas məlumatı
          azaltmış jurnal qeydləri daxildir. Heç bir sistem tam risksiz deyil.
        </p>
      </InfoSection>
      <InfoSection
        id="legal-requests"
        title="12. Hüquqi tələb və təhlükəsizlik"
      >
        <p>
          Məlumat yalnız tətbiq olunan qanuna, səlahiyyətli orqanın qanuni
          tələbinə və ya zəruri təhlükəsizlik əsasına uyğun açıqlana bilər.
          Sorğunun səlahiyyəti və əhatəsi mümkün olduqda yoxlanılır.
        </p>
      </InfoSection>
      <InfoSection id="marketing" title="13. Marketinq">
        <p>
          Hesab, təhlükəsizlik və xidmət e-poçtları əməliyyat bildirişidir.
          Gələcək promosyon marketinqi üçün razılıq ayrıca, könüllü və geri
          götürülə bilən olmalıdır. Hazırda promosyon marketinq funksiyası
          yoxdur.
        </p>
      </InfoSection>
      <InfoSection id="cookies" title="14. Cookies və analitika">
        <p>
          Tətbiq yalnız giriş sessiyası və təhlükəsiz xidmət üçün zəruri brauzer
          saxlamasından istifadə edir. Reklam, davranış izləmə və qeyri-zəruri
          üçüncü tərəf analitikası yoxdur, buna görə geniş cookie banneri
          göstərilmir. Məxfilik-minimallaşdırılmış əməliyyat performans ölçüləri
          aktivləşdirilərsə, onlar BookSwap-ın eyni-origin serverinə göndərilir
          və istifadəçi/session identifikatoru daşımır.
        </p>
      </InfoSection>
      <InfoSection id="minors" title="15. Yetkinlik yaşına çatmayanlar">
        <p>
          BookSwap-ın hazırkı versiyası 18+ üçündür. Yaş tələbinə uyğun olmayan
          hesab aşkarlandıqda hesab və məlumat tətbiq olunan hüquqa uyğun
          məhdudlaşdırıla və ya silinə bilər.
        </p>
      </InfoSection>
      <InfoSection id="changes" title="16. Dəyişikliklər">
        <p>
          Siyasət dəyişdikdə versiya və tarix yenilənir. Əhəmiyyətli dəyişiklik
          platformada və ya uyğun digər kanalla bildirilir; zəruri hallarda
          yenidən razılıq tələb olunur.
        </p>
      </InfoSection>
      <InfoSection id="contact" title="17. Əlaqə və şikayət">
        <p>
          Operator: {operator}. Hüquqi və məxfilik sorğuları: {contact}. Bu
          repository-dəki mətn mühəndislik tətbiqidir və müstəqil hüquqi rəy və
          ya uyğunluq sertifikatı deyil.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
