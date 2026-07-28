import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = {
  title: "İstifadə şərtləri",
  description:
    "BookSwap kitab bazarından istifadə qaydalarının ilkin hüquqi layihəsi.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Qüvvəyə minmə / son yenilənmə: [QÜVVƏYƏ MİNMƏ TARİXİ]"
      title="İstifadə şərtləri."
      intro="Bu mətn BookSwap ictimai istifadəyə verilməzdən əvvəl tamamlanmalı hüquqi layihədir. Xidməti təqdim edən tərəf [HÜQUQİ OPERATORUN ADI], hüquqi ünvan [HÜQUQİ ÜNVAN], tətbiq olunan hüquq və mübahisə yurisdiksiyası [YURİSDİKSİYA] kimi tamamlanmalıdır."
    >
      <InfoSection title="Platformanın rolu">
        <p>
          BookSwap istifadə olunmuş kitab elanlarını dərc etmək, tapmaq və bazar
          iştirakçılarının bir-biri ilə əlaqə saxlaması üçün texniki
          platformadır. BookSwap elandakı kitabın satıcısı və ya alıcısı deyil,
          vəsait saxlamır, ödəniş emal etmir, çatdırılma, sığorta, eskrou və ya
          alıcı müdafiəsi xidməti göstərmir.
        </p>
      </InfoSection>
      <InfoSection title="Hesab və yaş qaydası">
        <p>
          İstifadəçi dəqiq hesab məlumatı verməli, giriş məlumatlarını qorumalı
          və başqa şəxsi təqlid etməməlidir. Yetkinlik yaşına çatmayanların
          istifadəsi məhsul sahibi tərəfindən seçiləcək [MİNİMUM YAŞ VƏ VALİDEYN
          RAZILIĞI QAYDASI] əsasında tamamlanmalıdır. Qanuni nümayəndə tələb
          olunan hallarda əməliyyata nəzarət etməlidir.
        </p>
      </InfoSection>
      <InfoSection title="Elan və satıcı öhdəlikləri">
        <p>
          Satıcı kitab üzərində qanuni sərəncam hüququna malik olmalı; başlıq,
          müəllif, vəziyyət, qüsur, qiymət, məkan və fotoları dürüst göstərməli;
          satıldıqdan sonra elanın statusunu yeniləməlidir. Saxta, pirat,
          oğurlanmış və ya qanunsuz material yerləşdirmək olmaz.
        </p>
      </InfoSection>
      <InfoSection title="Alıcı və əməliyyat öhdəlikləri">
        <p>
          Alıcı kitabın vəziyyətini, nəşrini, qiyməti və təhvil şərtlərini özü
          yoxlamalıdır. Ödəniş, göndəriş, çatdırılma, görüş və təhvil alıcı ilə
          satıcının məsuliyyətidir. İştirakçılar razılaşmanı yazışmada aydın
          saxlamalı və şübhəli ödəniş keçidlərindən istifadə etməməlidir.
        </p>
      </InfoSection>
      <InfoSection title="Qadağan olunmuş davranış və məzmun">
        <p>
          Dələduzluq, fişinq, spam, təhdid, təqib, nifrət nitqi, qanunsuz mal,
          saxta material, zərərli keçid və kod, şəxsi məlumatın icazəsiz
          paylaşılması, reytinq manipulyasiyası və təhlükəsizlik nəzarətlərini
          aşmaq cəhdi qadağandır. Ətraflı qaydalar
          <Link href="/marketplace-rules" className="text-orange underline">
            {" "}
            Kitab bazarı qaydalarında
          </Link>{" "}
          göstərilir.
        </p>
      </InfoSection>
      <InfoSection title="Moderasiya, şikayət və etiraz">
        <p>
          Operator elan və hesabı araşdıra, görünməni məhdudlaşdıra, məzmunu
          silə və ya hesabı dayandıra bilər. İstifadəçi elanı tətbiqdən şikayət
          edə və moderasiya qərarına
          <Link href="/moderation-appeals" className="text-orange underline">
            {" "}
            etiraz edə bilər
          </Link>
          . Təcili təhlükə halları platforma şikayəti ilə məhdudlaşmamalıdır.
        </p>
      </InfoSection>
      <InfoSection title="Məxfilik və hesabın silinməsi">
        <p>
          Şəxsi məlumatların emalı
          <Link href="/privacy" className="text-orange underline">
            {" "}
            Məxfilik bildirişində
          </Link>{" "}
          izah edilir. Məlumat çıxarışı, düzəliş, silinmə və etiraz sorğuları
          <Link href="/user-rights" className="text-orange underline">
            {" "}
            İstifadəçi hüquqları səhifəsindən
          </Link>{" "}
          göndərilə bilər.
        </p>
      </InfoSection>
      <InfoSection title="Məsuliyyət və qanuni hüquqlar">
        <p>
          Platforma istifadəçi elanının doğruluğuna, kitabın keyfiyyətinə,
          ödənişə və təhvilə zəmanət vermir. Bu şərtlər tətbiq olunan qanunla
          məhdudlaşdırılması mümkün olmayan istehlakçı və fərdi məlumat
          hüquqlarını aradan qaldırmır. Hüquqi sorğular: [DƏSTƏK E-POÇTU].
        </p>
      </InfoSection>
      <InfoSection title="Dəyişikliklər və tətbiq olunan hüquq">
        <p>
          Əhəmiyyətli dəyişikliklər qüvvəyə minməzdən əvvəl platformada
          bildirilməlidir. Tətbiq olunan hüquq və səlahiyyətli məhkəmə
          [YURİSDİKSİYA] məlumatı hüquqi sahib tərəfindən ictimai istifadədən
          əvvəl tamamlanmalıdır.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
