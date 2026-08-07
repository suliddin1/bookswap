import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";
import {
  getLegalIdentity,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_VERSION,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Kitab bazarı və icma qaydaları",
  description: "BookSwap elan, ünsiyyət və təhlükəsizlik qaydaları.",
};

export default function MarketplaceRulesPage() {
  const legal = getLegalIdentity();
  const contact = legal.complete
    ? legal.contactEmail
    : "ictimai istifadədən əvvəl göstəriləcək hüquqi əlaqə";

  return (
    <InfoPage
      eyebrow={`Versiya ${LEGAL_VERSION} · Son yenilənmə: ${LEGAL_EFFECTIVE_DATE}`}
      title="Kitab bazarı və icma qaydaları"
      intro="Bu qaydalar BookSwap-da elan verən, kitab alan, rəy yazan və mesajlaşan hər kəsə aiddir. Məqsəd dürüst, təhlükəsiz və qanuni fiziki kitab bazarı yaratmaqdır."
    >
      <InfoSection id="purpose" title="1. Məqsəd">
        <p>
          BookSwap əsasən fiziki şəxslərin istifadə olunmuş fiziki kitabları
          bir-birinə satdığı C2C beta platformasıdır. Hər kəs qanuna, bu
          Qaydalara və digər istifadəçilərin hüquqlarına hörmət etməlidir.
        </p>
      </InfoSection>
      <InfoSection id="allowed" title="2. Nə yerləşdirmək olar">
        <p>
          Yalnız qanuni sahib olduğunuz və satmaq hüququnuz olan istifadə
          olunmuş fiziki kitabı yerləşdirin. Kitabın öz real fotolarına üstünlük
          verin və fotodan istifadə hüququnuz olsun.
        </p>
      </InfoSection>
      <InfoSection id="prohibited" title="3. Nə yerləşdirmək olmaz">
        <ul className="list-disc space-y-2 pl-5">
          <li>oğurlanmış kitab və saxta mal;</li>
          <li>
            icazəsiz PDF, skan, e-kitab, audiokitab surəti və digər pirat
            rəqəmsal material;
          </li>
          <li>qanunsuz mal və xidmət;</li>
          <li>zərərli fayl, keçid, kod və gizlədilmiş icra olunan məzmun;</li>
          <li>üçüncü şəxsin icazəsiz şəxsi məlumatı;</li>
          <li>icazəsiz müəllif hüquqlu foto və digər kontent.</li>
        </ul>
      </InfoSection>
      <InfoSection id="honesty" title="4. Elanların dürüstlüyü">
        <p>
          Başlıq, müəllif, nəşr/ISBN məlumdursa həmin məlumat, vəziyyət,
          əhəmiyyətli qüsur, qiymət, yer və foto dürüst olmalıdır. Qəsdən
          yanıltıcı dublikat yaratmayın. Satılmış və ya mövcud olmayan elanı
          vaxtında yeniləyin.
        </p>
      </InfoSection>
      <InfoSection id="commercial-use" title="5. Kommersiya istifadəsi">
        <p>
          Beta əsasən öz kitabını satan fiziki şəxslər üçündür. Sistemli,
          peşəkar və yüksək həcmli satış ayrıca təsdiq edilmədikcə
          məhdudlaşdırıla bilər. Hazırda peşəkar satıcı planı yoxdur.
        </p>
      </InfoSection>
      <InfoSection id="messaging" title="6. Mesajlaşma qaydaları">
        <p>
          Mesajı kitab və əməliyyatla bağlı qanuni ünsiyyətlə məhdudlaşdırın.
          Spam, fişinq, dələduzluq, hesab oğurluğu, təhqir, təqib, təhdid,
          nifrət və ayrı-seçkilik qadağandır.
        </p>
      </InfoSection>
      <InfoSection id="personal-data" title="7. Şəxsi məlumat təhlükəsizliyi">
        <p>
          Şifrə, birdəfəlik təsdiq kodu, CVV, bank giriş məlumatı və şəxsiyyət
          sənədinin tam görüntüsünü mesajda paylaşmayın. Digər şəxsin məlumatını
          onun icazəsi və qanuni əsas olmadan dərc etməyin.
        </p>
      </InfoSection>
      <InfoSection id="payment" title="8. Ödəniş">
        <p>
          BookSwap ödəniş qəbul etmir, vəsait saxlamır və ödəniş sübutunu
          təsdiqləmir. Saxta ödəniş sübutu qadağandır. Şübhəli ödəniş
          keçidlərini açmayın və qarşı tərəfin təzyiqi ilə tələsik köçürmə
          etməyin.
        </p>
      </InfoSection>
      <InfoSection id="handover" title="9. Görüş və təhvil">
        <p>
          Mümkün olduqda işıqlı və ictimai yerdə görüşün, etibar etdiyiniz şəxsə
          planı bildirin və ödənişdən əvvəl kitabı, nəşri, səhifələri və
          qüsurları yoxlayın. Çatdırılma və görüş şərtlərini tərəflər özləri
          razılaşdırır.
        </p>
      </InfoSection>
      <InfoSection id="reviews" title="10. Rəylər">
        <p>
          Rəy real alış-satış təcrübəsinə əsaslanmalıdır. Saxta rəy, özünə rəy,
          əlaqələndirilmiş manipulyasiya, qarşı tərəfi məcbur etmək və qisas
          məqsədli yalan iddia qadağandır.
        </p>
      </InfoSection>
      <InfoSection
        id="abuse"
        title="11. Dələduzluq və platformadan sui-istifadə"
      >
        <p>
          Təhlükəsizlik və dərəcə məhdudiyyətini aşmaq, icazəsiz avtomatik
          spam/scraping, saxta hesab, hesabat sistemindən sui-istifadə, hesab
          ələ keçirmə və digər istifadəçini aldatmaq qadağandır.
        </p>
      </InfoSection>
      <InfoSection id="unlawful-content" title="12. Qanunsuz və zərərli məzmun">
        <p>
          Azərbaycan qanunvericiliyinə görə yayılması qadağan edilən məlumat
          yerləşdirilə bilməz. Buraya qanunsuz terror və zorakı ekstremizm
          təbliğatı, zorakılığa qanunsuz çağırış, qanunsuz narkotik və qumar
          fəaliyyəti, qanunsuz məxfilik pozuntusu və digər qadağan olunmuş
          məlumat daxil ola bilər. Həssas mövzunu qanuni ədəbi, tarixi,
          jurnalist, təhsil və ya elmi məqsədlə müzakirə edən kitab yalnız
          mövzusuna görə qadağan edilmir.
        </p>
      </InfoSection>
      <InfoSection id="reports" title="13. Şikayət">
        <p>
          Qayda pozuntusunu tətbiqdaxili şikayət sistemi ilə bildirin və mümkün
          qədər konkret elan, hesab, mesaj və faktları göstərin. Hüquqi, müəllif
          hüququ və məxfilik bildirişi {contact} əlaqəsinə də göndərilə bilər.
          Bilərəkdən saxta və təzyiq məqsədli şikayət qadağandır.
        </p>
      </InfoSection>
      <InfoSection id="moderation" title="14. Moderasiya tədbirləri">
        <p>
          BookSwap araşdırma nəticəsinə və riskə mütənasib olaraq görünməni
          məhdudlaşdıra, məzmunu silə, xəbərdarlıq edə, funksiyanı
          məhdudlaşdıra, hesabı müvəqqəti dayandıra və ya bağlaya bilər.
        </p>
      </InfoSection>
      <InfoSection id="appeal" title="15. Etiraz">
        <p>
          Qərarın səhv olduğunu düşünürsünüzsə,
          <Link className="text-orange underline" href="/moderation-appeals">
            {" "}
            moderasiya etirazı
          </Link>{" "}
          göndərin. Mümkün olduqda etiraza ilkin qərardan fərqli səlahiyyətli
          şəxs baxır.
        </p>
      </InfoSection>
      <InfoSection id="emergency" title="16. Təcili hallar">
        <p>
          BookSwap təcili yardım xidməti deyil. Dərhal fiziki təhlükə,
          hədə-qorxu və ya mümkün cinayət halında razılaşmanı dayandırın və
          yerli təcili yardım və hüquq-mühafizə xidmətinə müraciət edin.
        </p>
      </InfoSection>
      <InfoSection id="contact" title="17. Əlaqə və əlaqəli sənədlər">
        <p>
          Hüquqi və məxfilik əlaqəsi: {contact}. Bu Qaydaları
          <Link className="text-orange underline" href="/terms">
            {" "}
            İstifadə şərtləri
          </Link>
          ,
          <Link className="text-orange underline" href="/privacy">
            {" "}
            Məxfilik siyasəti
          </Link>{" "}
          və
          <Link className="text-orange underline" href="/safety">
            {" "}
            Təhlükəsizlik mərkəzi
          </Link>{" "}
          ilə birlikdə oxuyun.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
