import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Kitab bazarı qaydaları",
  description:
    "BookSwap-da elan, təhlükəsizlik, qadağan olunmuş məzmun, ödəniş və təhvil qaydaları.",
};

export default function MarketplaceRulesPage() {
  return (
    <InfoPage
      eyebrow="Son yenilənmə: [QÜVVƏYƏ MİNMƏ TARİXİ]"
      title="Kitab bazarı qaydaları."
      intro="Bu qaydalar BookSwap-da elan verən, kitab alan və yazışan hər kəsə aiddir. Hüquqi operator [HÜQUQİ OPERATORUN ADI], dəstək əlaqəsi [DƏSTƏK E-POÇTU] kimi ictimai istifadədən əvvəl tamamlanmalıdır."
    >
      <InfoSection
        id="accurate-listings"
        title="Dürüst və yoxlanıla bilən elanlar"
      >
        <p>
          Yalnız satmaq hüququnuz olan kitabı yerləşdirin. Başlıq, müəllif,
          vəziyyət, bütün nəzərəçarpan qüsurlar, qiymət, yer və fotolar kitabın
          real vəziyyətini əks etdirməlidir. Kitab satıldıqda elanı vaxtında
          yeniləyin və eyni kitab üçün yanıltıcı təkrar elan yaratmayın.
        </p>
      </InfoSection>
      <InfoSection
        id="prohibited-content"
        title="Qadağan olunmuş məzmun və davranış"
      >
        <p>
          Oğurlanmış, saxta və ya pirat material; qanunsuz mal; dələduzluq,
          fişinq, spam, təhdid, təqib, nifrət nitqi, zərərli keçid və kod;
          başqasının şəxsi məlumatı; saxta rəy, süni reytinq və təhlükəsizlik
          nəzarətlərini aşmaq cəhdi qadağandır. SVG, HTML, icra olunan və ya
          başqa fayl kimi gizlədilmiş zərərli yükləmələr qəbul edilmir.
        </p>
      </InfoSection>
      <InfoSection id="transactions" title="Ödəniş, çatdırılma və təhvil">
        <p>
          BookSwap tərəfləri əlaqələndirir, lakin ödənişi emal etmir, vəsait
          saxlamır, kitabı çatdırmır və təhvil almır. Alıcı ilə satıcı qiyməti,
          ödəniş üsulunu, çatdırılmanı, görüşü və təhvil şərtlərini özləri
          razılaşdırır. Ödənişdən əvvəl kitabı və qarşı tərəfin şərtlərini
          yoxlayın; şübhəli keçidlərdən və geri qaytarılması çətin ödənişlərdən
          uzaq durun.
        </p>
      </InfoSection>
      <InfoSection id="chat-safety" title="Yazışma və şəxsi məlumat">
        <p>
          Yazışmanı kitab və razılaşma ilə məhdudlaşdırın. Şifrə, təsdiq kodu,
          kartın CVV-si, bank giriş məlumatı, şəxsiyyət sənədinin tam fotosu və
          başqa lazımsız həssas məlumatı paylaşmayın. Təzyiq, təhdid və ya
          platformadan dərhal kənara keçmək tələbi ilə rastlaşdıqda razılaşmanı
          dayandırın və şikayət göndərin.
        </p>
      </InfoSection>
      <InfoSection id="reports" title="Şikayət və moderasiya">
        <p>
          Qayda pozuntusu olan elan və ya hesab barədə tətbiqdaxili şikayət
          göndərin. Moderatorlar görünməni məhdudlaşdıra, məzmunu silə və ya
          hesabı dayandıra bilər. Şikayət edən şəxs moderasiya statusunu dəyişə
          bilməz. Qərarın səhv olduğunu düşünürsünüzsə,
          <Link href="/moderation-appeals" className="text-orange underline">
            {" "}
            moderasiya etirazı göndərin
          </Link>
          . Təcili təhlükə zamanı yerli təcili yardım və hüquq-mühafizə
          xidmətlərinə müraciət edin.
        </p>
      </InfoSection>
      <InfoSection id="minors" title="Yetkinlik yaşına çatmayanlar">
        <p>
          Minimum yaş və valideyn razılığı qaydası [MİNİMUM YAŞ VƏ VALİDEYN
          RAZILIĞI QAYDASI] kimi hüquqi sahib tərəfindən ictimai istifadədən
          əvvəl seçilməlidir. Qanuni nümayəndə tələb olunan hallarda hesab və
          əməliyyata nəzarət etməlidir; azyaşlı ilə təhlükəli təkbətək görüş
          təşkil edilməməlidir.
        </p>
      </InfoSection>
      <InfoSection id="related" title="Əlaqəli sənədlər">
        <p>
          Bu qaydaları
          <Link href="/terms" className="text-orange underline">
            {" "}
            İstifadə şərtləri
          </Link>
          ,
          <Link href="/privacy" className="text-orange underline">
            {" "}
            Məxfilik bildirişi
          </Link>{" "}
          və
          <Link href="/safety" className="text-orange underline">
            {" "}
            Təhlükəsizlik mərkəzi
          </Link>{" "}
          ilə birlikdə oxuyun.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
