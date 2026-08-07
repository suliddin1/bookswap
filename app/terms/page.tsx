import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";
import {
  getLegalIdentity,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_VERSION,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "İstifadə şərtləri",
  description: "BookSwap platformasından istifadə şərtləri.",
};

export default function TermsPage() {
  const legal = getLegalIdentity();
  const operator = legal.complete
    ? legal.operatorFullName
    : "ictimai istifadədən əvvəl göstəriləcək hüquqi operator";
  const contact = legal.complete
    ? legal.contactEmail
    : "ictimai istifadədən əvvəl göstəriləcək hüquqi əlaqə";

  const sections = [
    {
      id: "general",
      title: "1. Ümumi müddəalar",
      body: `Bu İstifadə Şərtləri (“Şərtlər”) BookSwap platformasından istifadə qaydalarını müəyyən edir. BookSwap istifadə olunmuş fiziki kitabların elan edilməsi, tapılması və alıcı ilə satıcı arasında əlaqənin yaradılması üçün nəzərdə tutulmuş onlayn platformadır və ${operator} tərəfindən idarə olunur. Hesab yaratmaqla və ya xidmətdən istifadə etməklə istifadəçi bu Şərtlərlə tanış olduğunu və onları qəbul etdiyini təsdiq edir.`,
    },
    {
      id: "age",
      title: "2. Yaş tələbi",
      body: "BookSwap-ın hazırkı versiyasından yalnız 18 yaşı tamam olmuş şəxslər istifadə edə bilər. Qeydiyyat yaşın ən azı 18 olduğunu təsdiq edir. Yaş tələbinə uyğun olmayan hesab məhdudlaşdırıla və ya bağlana bilər. Bu qayda üçün doğum tarixi avtomatik toplanmır; əlavə sübut yalnız əsaslı hüquqi, təhlükəsizlik və ya moderasiya zərurəti olduqda istənilə bilər.",
    },
    {
      id: "platform-role",
      title: "3. BookSwap-ın rolu",
      body: "BookSwap kitabların satıcısı, alıcısı və ya sahibi deyil; ödəniş qəbul etmir, istifadəçi vəsaitini saxlamır, escrow və ya alıcı müdafiəsi xidməti və çatdırılma təqdim etmir, kitabın keyfiyyətinə və həqiqiliyinə zəmanət vermir və alıcı ilə satıcı arasındakı alqı-satqı razılaşmasının tərəfi deyil. Qiymət, ödəniş üsulu, görüş, çatdırılma, yoxlama və təhvil şərtlərini alıcı ilə satıcı birbaşa razılaşdırır.",
    },
    {
      id: "commercial-model",
      title: "4. Hazırkı kommersiya modeli",
      body: "Adi elanlar və mesajlaşma hazırda pulsuzdur. BookSwap hazırda satış komissiyası, inteqrasiya olunmuş ödəniş, VIP elan, ödənişli üzvlük və ya reklam xidməti təqdim etmir. Belə funksiya gələcəkdə əlavə olunarsa, istifadəyə verilməzdən əvvəl hüquqi sənədlər yenilənəcək.",
    },
    {
      id: "account",
      title: "5. Hesab",
      body: "İstifadəçi düzgün və aktual hesab məlumatı təqdim etməli, giriş məlumatlarını qorumalıdır. Başqasını təqlid etmək, saxta hesab yaratmaq, digər hesabdan icazəsiz istifadə və təhlükəsizlik mexanizmlərini aşmaq qadağandır.",
    },
    {
      id: "listings",
      title: "6. Elanlar",
      body: "Yalnız qanuni sahib olduğunuz və satmaq səlahiyyətiniz olan kitabı yerləşdirin. Başlıq, müəllif, vəziyyət, mühüm qüsurlar, qiymət, yer və fotolar əhəmiyyətli dərəcədə düzgün olmalıdır. Satılmış və ya mövcud olmayan kitabın statusunu yeniləyin. Oğurlanmış, saxta, pirat və ya qanunsuz əldə olunmuş material qadağandır.",
    },
    {
      id: "physical-books",
      title: "7. Fiziki və rəqəmsal materiallar",
      body: "BookSwap hazırda fiziki kitablar üçündür. Hüquq sahibinin icazəsi olmadan PDF, skan, e-kitab, audiokitab surəti və digər müəllif hüquqları ilə qorunan rəqəmsal materialın satışı və paylaşılması qadağandır.",
    },
    {
      id: "content-license",
      title: "8. İstifadəçi kontentinə lisenziya",
      body: "İstifadəçi öz elan, foto, rəy və digər kontenti üzərində hüquqlarını saxlayır. Kontent yükləndikdə BookSwap-a yalnız xidməti işlətmək, kontenti göstərmək və saxlamaq, təhlükəsizlik və moderasiya məqsədləri üçün zəruri, məhdud və qeyri-eksklüziv istifadə hüququ verilir. BookSwap istifadəçi kontentinə sahiblik iddiası etmir.",
    },
    {
      id: "transactions",
      title: "9. Alıcı və satıcının məsuliyyəti",
      body: "Satıcı kitabı əhəmiyyətli dərəcədə düzgün təsvir etməli, alıcı isə ödənişdən əvvəl kitabı və əməliyyat şərtlərini yoxlamalıdır. BookSwap istifadəçilərin bir-birinə etdiyi ödənişin geri qaytarılmasına zəmanət vermir. Məcburi qanuni hüquqlar bu Şərtlərlə ləğv edilmir.",
    },
    {
      id: "commercial-sellers",
      title: "10. Peşəkar və kommersiya satışı",
      body: "Beta əsasən fiziki şəxslərin öz istifadə olunmuş kitablarını satması üçündür. Sistemli, yüksək həcmli və peşəkar satış ayrıca təsdiq edilmədikcə məhdudlaşdırıla bilər. Hazırda ayrıca peşəkar satıcı məhsulu yoxdur.",
    },
    {
      id: "messaging",
      title: "11. Mesajlaşma",
      body: "Mesajlaşma qanuni kitab bazarı ünsiyyəti üçün istifadə edilməlidir. Spam, fişinq, dələduzluq, təhdid, təqib, icazəsiz şəxsi məlumat açıqlaması və zərərli keçid qadağandır. Şifrə, birdəfəlik kod, CVV, bank giriş məlumatı və şəxsiyyət sənədinin tam görüntüsünü göndərməyin.",
    },
    {
      id: "reviews",
      title: "12. Rəylər",
      body: "Rəy real təcrübəyə əsaslanmalıdır. Saxta rəy, özünə rəy, əlaqələndirilmiş manipulyasiya və qarşı tərəfi rəy yazmağa məcbur etmək qadağandır.",
    },
    {
      id: "prohibited-activity",
      title: "13. Qadağan olunmuş fəaliyyət",
      body: "Dələduzluq, fişinq, spam, zərərli proqram, hesab oğurluğu, təqlid, oğurlanmış və qanunsuz mal, müəllif hüququ pozuntusu, icazəsiz şəxsi məlumat yayılması, təhdid, təqib, ayrı-seçkilik, nifrət xarakterli davranış, təhlükəsizlik və dərəcə məhdudiyyətlərini aşmaq və digər qanunsuz fəaliyyət qadağandır.",
    },
    {
      id: "moderation",
      title: "14. Moderasiya",
      body: "BookSwap qayda pozuntusu, təhlükəsizlik riski və ya qanunsuz fəaliyyət şübhəsini araşdıra və riskə mütənasib olaraq görünməni məhdudlaşdıra, məzmunu silə, xəbərdarlıq edə, funksiyanı məhdudlaşdıra, hesabı dayandıra və ya bağlaya bilər.",
    },
    {
      id: "reporting",
      title: "15. Şikayət və hüquq pozuntusu bildirişi",
      body: `Şübhəli elan və davranış tətbiqdaxili şikayət sistemi ilə bildirilə bilər. Qanunsuz məzmun, müəllif hüququ və məxfilik bildirişi ${contact} əlaqəsinə göndərilə bilər. Bildiriş konkret məzmunu və əsas faktları göstərməlidir; BookSwap kifayət qədər konkret qanunsuzluq bildirişi aldıqda tətbiq olunan hüquqa uyğun tədbir görür.`,
    },
    {
      id: "appeals",
      title: "16. Moderasiya qərarına etiraz",
      body: "İstifadəçi hesabı və ya kontenti barədə qərarın səhv olduğunu düşünürsə, moderasiya etirazı göndərə bilər. Mümkün olduqda etiraza ilkin qərarda iştirak etməyən səlahiyyətli şəxs baxır.",
    },
    {
      id: "privacy",
      title: "17. Məxfilik",
      body: "Fərdi məlumatların toplanması və işlənilməsi ayrıca Məxfilik və fərdi məlumatların emalı siyasəti ilə tənzimlənir.",
    },
    {
      id: "availability",
      title: "18. Xidmətin mövcudluğu",
      body: "BookSwap xidmətin fasiləsiz, səhvsiz və həmişə əlçatan olacağına zəmanət vermir. Təhlükəsizlik, texniki xidmət, hüquqi tələb və məhsul dəyişikliyi səbəbilə funksiyalar müvəqqəti dayandırıla və ya dəyişdirilə bilər.",
    },
    {
      id: "liability",
      title: "19. Məsuliyyətin sərhədləri",
      body: "Qanunla icazə verilən həddə BookSwap istifadəçi elanının doğruluğuna, kitabın keyfiyyətinə, tərəflərin davranışına, ödənişə, çatdırılmaya və istifadəçilərin ayrıca razılaşmasına zəmanət vermir. Bu müddəa qanunla məhdudlaşdırılması və ya istisna edilməsi mümkün olmayan məsuliyyəti və hüquqları aradan qaldırmır.",
    },
    {
      id: "account-closure",
      title: "20. Hesabın bağlanması",
      body: "İstifadəçi hesabın bağlanmasını, razılığın geri götürülməsini və fərdi məlumatlarla bağlı tədbirləri İstifadəçi hüquqları bölməsindən tələb edə bilər. Qayda pozuntusu və ya təhlükəsizlik riski olduqda BookSwap hesabı məhdudlaşdıra və ya bağlaya bilər.",
    },
    {
      id: "changes",
      title: "21. Şərtlərin dəyişdirilməsi",
      body: "Məhsul, hüquqi öhdəlik və ya təhlükəsizlik tələbi dəyişdikdə Şərtlər yenilənə bilər. Əhəmiyyətli dəyişiklik platformada və ya uyğun digər kanalla bildirilir; zəruri olduqda yeni versiya üçün yenidən qəbul tələb edilə bilər.",
    },
    {
      id: "law",
      title: "22. Tətbiq olunan hüquq",
      body: "Bu Şərtlər Azərbaycan Respublikasının qanunvericiliyinə uyğun şərh edilir. Mübahisə əvvəlcə xoşniyyətli həll edilməyə çalışılır; həll mümkün olmazsa, tətbiq olunan qanuna uyğun səlahiyyətli Azərbaycan orqanı və ya məhkəməsi tərəfindən həll olunur.",
    },
    {
      id: "contact",
      title: "23. Əlaqə",
      body: `Operator: ${operator}. Hüquqi, məxfilik və qayda pozuntuları üzrə əlaqə: ${contact}.`,
    },
  ] as const;

  return (
    <InfoPage
      eyebrow={`Versiya ${LEGAL_VERSION} · Qüvvəyə minmə və son yenilənmə: ${LEGAL_EFFECTIVE_DATE}`}
      title="İstifadə şərtləri"
      intro={`BookSwap ${operator} tərəfindən idarə olunur. Hüquqi və məxfilik əlaqəsi: ${contact}.`}
    >
      {sections.map((section) => (
        <InfoSection key={section.id} id={section.id} title={section.title}>
          <p>{section.body}</p>
        </InfoSection>
      ))}
      <nav
        aria-label="Şərtlərlə əlaqəli sənədlər"
        className="flex flex-wrap gap-x-5 gap-y-3 border-t border-[#5b3c25]/30 pt-6"
      >
        <Link className="text-orange underline" href="/privacy">
          Məxfilik siyasəti
        </Link>
        <Link className="text-orange underline" href="/marketplace-rules">
          Kitab bazarı və icma qaydaları
        </Link>
        <Link className="text-orange underline" href="/moderation-appeals">
          Moderasiya etirazı
        </Link>
        <Link className="text-orange underline" href="/user-rights">
          İstifadəçi hüquqları
        </Link>
      </nav>
    </InfoPage>
  );
}
