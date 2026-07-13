import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata = {
  title: "Terms of Use",
  description: "Rules for using the BookSwap marketplace.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Effective 12 July 2026"
      title="İstifadə şərtləri."
      intro="BookSwap-dan istifadə etməklə bu marketplace qaydalarına əməl etməyi qəbul edirsiniz."
    >
      <InfoSection title="Platformanın rolu">
        <p>
          BookSwap kitabın satıcısı, alıcısı, ödəniş xidməti və ya çatdırılma
          şirkəti deyil. Platforma istifadəçilərin elan verməsi və birbaşa əlaqə
          saxlaması üçün texniki vasitədir. Alqı-satqı müqaviləsi alıcı ilə
          satıcı arasında yaranır.
        </p>
      </InfoSection>
      <InfoSection title="Hesab və uyğunluq">
        <p>
          Dəqiq məlumat təqdim etməli, hesabınızı və giriş kodlarını qorumalı,
          başqa şəxsi təqlid etməməlisiniz. Yetkinlik yaşına çatmayan istifadəçi
          valideyn və ya qanuni nümayəndənin nəzarəti ilə əməliyyat etməlidir.
        </p>
      </InfoSection>
      <InfoSection title="Satıcının öhdəlikləri">
        <p>
          Kitaba sahib olmalı, başlıq, nəşr, vəziyyət, qüsur, qiymət və fotoları
          dürüst göstərməli, satıldıqdan sonra elanı bağlamalı və müəlliflik
          hüququnu pozan saxta/pirat material yerləşdirməməlisiniz.
        </p>
      </InfoSection>
      <InfoSection title="Alıcının öhdəlikləri">
        <p>
          Kitabı və şərtləri yoxlamalı, razılaşdırılmış görüş və ödəniş
          qaydasına əməl etməli, əsassız report və manipulyativ review
          göndərməməlisiniz.
        </p>
      </InfoSection>
      <InfoSection title="Qadağan olunmuş istifadə">
        <p>
          Fırıldaqçılıq, spam, fişinq, zərərli link, təhdid, nifrət nitqi, şəxsi
          məlumatların icazəsiz yayılması, platformanın təhlükəsizliyini
          sınaqdan keçirmək və qanunsuz məhsul/məzmun qadağandır.
        </p>
      </InfoSection>
      <InfoSection title="Moderasiya və hesab tədbirləri">
        <p>
          BookSwap elan və hesabı araşdıra, görünməsini məhdudlaşdıra, materialı
          silə və təhlükəsizlik pozuntusunda hesabı müvəqqəti və ya daimi
          dayandıra bilər. Avtomatik moderasiya qərarı mümkün olduqda insan
          baxışı və etiraz mexanizmi ilə dəstəklənməlidir.
        </p>
      </InfoSection>
      <InfoSection title="Məsuliyyət və qanuni hüquqlar">
        <p>
          Platforma istifadəçilərin kitabının keyfiyyətinə və görüş davranışına
          zəmanət vermir. Heç bir bənd qanunla imtina edilə bilməyən istehlakçı
          və fərdi məlumat hüquqlarınızı aradan qaldırmır.
        </p>
      </InfoSection>
      <InfoSection title="Dəyişiklik və tətbiq olunan hüquq">
        <p>
          Əhəmiyyətli dəyişikliklər qüvvəyə minməzdən əvvəl platformada
          bildiriləcək. Şərtlər Azərbaycan Respublikasının tətbiq olunan
          qanunları, o cümlədən{" "}
          <a
            href="https://e-qanun.az/framework/11850"
            target="_blank"
            rel="noreferrer"
            className="text-orange underline"
          >
            “Elektron ticarət haqqında” Qanun
          </a>{" "}
          nəzərə alınaraq şərh edilir.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
