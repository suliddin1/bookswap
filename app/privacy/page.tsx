import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Məxfilik bildirişi",
  description: "BookSwap-da şəxsi məlumatların emalı üzrə ilkin hüquqi layihə.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Qüvvəyə minmə / son yenilənmə: [QÜVVƏYƏ MİNMƏ TARİXİ]"
      title="Məxfilik bildirişi."
      intro="Məlumat operatoru [HÜQUQİ OPERATORUN ADI], hüquqi ünvan [HÜQUQİ ÜNVAN], məxfilik əlaqəsi [MƏXFİLİK ƏLAQƏSİ] olaraq tamamlanmalıdır. Bu ilkin layihə BookSwap istifadə edilərkən məlumatın necə emal olunduğunu izah edir."
    >
      <InfoSection title="Toplanan məlumatlar">
        <p>
          Hesab üçün ad, e-poçt, autentifikasiya identifikatoru, şəhər və
          könüllü telefon nömrəsi; bazar fəaliyyəti üçün elan, foto, qiymət,
          ISBN, seçilmişlər, mesaj, rəy, şikayət və moderasiya qeydləri emal
          oluna bilər. Təhlükəsizlik və diaqnostika üçün məhdud IP, cihaz,
          brauzer, sorğu vaxtı, xəta və performans məlumatları yarana bilər.
        </p>
      </InfoSection>
      <InfoSection title="Emal məqsədləri">
        <p>
          Məlumat hesab yaratmaq və qorumaq, elan və mesaj xidmətini göstərmək,
          şikayət və etirazları araşdırmaq, dələduzluq və sui-istifadənin
          qarşısını almaq, xidmət bildirişləri göndərmək, qanuni öhdəlikləri
          yerinə yetirmək və etibarlılığı ölçmək üçün istifadə olunur.
        </p>
      </InfoSection>
      <InfoSection title="İctimai və məxfi sahələr">
        <p>
          Ad, şəhər, elan və yazılan rəylər ictimai görünə bilər. E-poçt,
          telefon, rol və hesab məhdudiyyəti, məxfi mesajlar və daxili
          moderasiya qeydləri ictimai profilə daxil edilmir. Söhbətdə şifrə,
          birdəfəlik kod, kart məlumatı və sənəd fotosu paylaşılmamalıdır.
        </p>
      </InfoSection>
      <InfoSection title="Xidmət təminatçıları və ötürmə">
        <p>
          Kodla hazırda hosting üçün Vercel, verilənlər bazası, autentifikasiya
          və saxlama üçün Supabase, aktivləşdirilərsə bildiriş e-poçtu üçün
          Resend, məzmun təhlükəsizliyi üçün OpenAI və ya Cloudflare sərhədləri
          nəzərdə tutulur. Yalnız faktiki aktivləşdirilən təminatçıya zəruri
          məlumat ötürülməlidir. Sərhədlərarası ötürmə və müqavilə təminatları
          operator tərəfindən ictimai istifadədən əvvəl hüquqi yoxlanmalıdır.
        </p>
      </InfoSection>
      <InfoSection title="Saxlama və silinmə">
        <p>
          Məlumat xidmət məqsədi, hesab fəaliyyəti, təhlükəsizlik, şikayət və
          qanuni öhdəlik üçün zəruri müddətdən artıq saxlanmamalıdır. Dəqiq
          saxlama cədvəli operatorun hüquqi qərarı ilə tamamlanmalıdır. Silinmə
          sorğusundan sonra saxtakarlığın qarşısının alınması, mübahisə və
          qanuni öhdəlik üçün zəruri minimal qeydlər məhdud müddət qala bilər.
          Supabase Storage obyektlərinin ayrıca ehtiyat və silinmə proseduru
          tətbiq olunur.
        </p>
      </InfoSection>
      <InfoSection title="Hüquqlar və sorğular">
        <p>
          Tətbiq olunan hüquqa uyğun olaraq məlumat çıxarışı, düzəliş, ixrac,
          etiraz və silinmə sorğusu verilə bilər. Sorğunu
          <Link href="/user-rights" className="text-orange underline">
            {" "}
            İstifadəçi hüquqları səhifəsindən
          </Link>{" "}
          göndərin. Təhlükəsizlik üçün şəxsiyyətin əlavə təsdiqi tələb oluna
          bilər. Məxfilik əlaqəsi: [MƏXFİLİK ƏLAQƏSİ].
        </p>
      </InfoSection>
      <InfoSection title="Təhlükəsizlik və insidentlər">
        <p>
          Giriş nəzarəti, sətir səviyyəli icazələr, məhdud server səlahiyyəti,
          fayl yoxlaması, dərəcə məhdudiyyəti və təhlükəsiz jurnal qeydləri
          məlumatı qorumaq üçün nəzərdə tutulur. Heç bir sistem tam risksiz
          deyil; şübhəli hesab fəaliyyəti [DƏSTƏK E-POÇTU] ünvanına
          bildirilməlidir.
        </p>
      </InfoSection>
      <InfoSection title="Yetkinlik yaşına çatmayanlar">
        <p>
          Yaş siyasəti [MİNİMUM YAŞ VƏ VALİDEYN RAZILIĞI QAYDASI] kimi
          tamamlanmalıdır. Qaydaya uyğun olmayan hesab aşkarlandıqda məlumat
          təhlükəsiz və qanuni qaydada məhdudlaşdırılmalı və ya silinməlidir.
        </p>
      </InfoSection>
      <InfoSection title="Hüquqi status">
        <p>
          Bu mətn ilkin hüquqi layihədir və [YURİSDİKSİYA] üzrə hüquqşünas
          baxışını əvəz etmir. Operator, əlaqə, saxlama cədvəli, yaş siyasəti və
          qüvvəyə minmə tarixi tamamlanmadan hüquqi təsdiq verilə bilməz.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
