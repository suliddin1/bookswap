import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata = {
  title: "Safety Center",
  description: "Safe buying and selling guidance for BookSwap readers.",
};

export default function SafetyPage() {
  return (
    <InfoPage
      eyebrow="Trust & safety"
      title="Təhlükəsiz al, təhlükəsiz sat."
      intro="BookSwap istifadəçiləri əlaqələndirir; razılaşmanın və görüşün təhlükəsizliyinə hər iki tərəf məsuldur."
    >
      <InfoSection title="Görüşdən əvvəl">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Yalnız BookSwap daxilində yazışın; söhbət moderasiya və şikayət
            araşdırması üçün sübut yaradır.
          </li>
          <li>
            Elanın real fotolarını, ISBN-ni, nəşri və bütün qüsurları yoxlayın.
          </li>
          <li>
            Həddən artıq aşağı qiymət, tələsdirmə və platformadan kənar ödəniş
            linki risk əlamətidir.
          </li>
          <li>
            Şifrə, SMS kodu, kartın CVV-si və şəxsiyyət sənədinin tam fotosunu
            paylaşmayın.
          </li>
        </ul>
      </InfoSection>
      <InfoSection title="Görüş zamanı">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            İşıqlı, ictimai və kamera olan yer seçin; yaxınınıza vaxt və məkanı
            bildirin.
          </li>
          <li>
            Kitabın üz qabığını, səhifələrini, əlavələrini və elanla uyğunluğunu
            ödənişdən əvvəl yoxlayın.
          </li>
          <li>
            Yetkinlik yaşına çatmamısınızsa valideyn və ya etibar etdiyiniz
            böyük şəxslə gedin.
          </li>
          <li>Narahat hiss etdiyiniz anda görüşü dayandırın.</li>
        </ul>
      </InfoSection>
      <InfoSection title="Qadağan olunan davranış">
        <p>
          Saxta məhsul, oğurlanmış əşya, qeyri-qanuni məzmun, nifrət və təhdid,
          spam, fişinq, başqa şəxsin məlumatlarının yayılması və manipulyativ
          review qadağandır. BookSwap belə elanları silə və hesabı dayandıra
          bilər.
        </p>
      </InfoSection>
      <InfoSection title="Problem baş verərsə">
        <p>
          Elanı report edin, yazışma və ödəniş sübutlarını saxlayın, kart
          əməliyyatı varsa bankınızla əlaqə saxlayın. Dələduzluq, təhdid və ya
          fiziki təhlükə halında dərhal yerli hüquq-mühafizə orqanına müraciət
          edin.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
