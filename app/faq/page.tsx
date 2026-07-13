import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata = {
  title: "FAQ",
  description: "BookSwap marketplace questions and answers.",
};

const questions = [
  [
    "BookSwap nədir?",
    "BookSwap oxucuların istifadə olunmuş kitabları elan etdiyi və bir-biri ilə birbaşa əlaqə saxladığı marketplace-dir. Platforma kitabı saxlamır, çatdırmır və ödəniş qəbul etmir.",
  ],
  [
    "Elan yerləşdirmək ödənişlidirmi?",
    "Hazırkı versiyada elan yaratmaq üçün platforma haqqı nəzərdə tutulmayıb.",
  ],
  [
    "Kitabın vəziyyətini necə seçməliyəm?",
    "Like new — demək olar istifadə izi yoxdur; Very good — yüngül izlər; Good — görünən, amma istifadəyə mane olmayan izlər; Well read — qeydlər, əyilmə və ya nəzərəçarpan aşınma ola bilər. Bütün qüsurları mətndə və fotolarda göstərin.",
  ],
  [
    "Ödəniş və çatdırılma necə olur?",
    "Alıcı və satıcı BookSwap mesajlarında razılaşır. Kart məlumatı, şifrə və birdəfəlik kod paylaşmayın. Mümkün olduqda ictimai yerdə görüşüb kitabı ödənişdən əvvəl yoxlayın.",
  ],
  [
    "Elanı necə satılmış kimi qeyd edim?",
    "Dashboard → My Listings bölməsində Mark sold düyməsini seçin. Satış baş tutmazsa Relist ilə elanı yenidən aktiv edə bilərsiniz.",
  ],
  [
    "Şübhəli elan görsəm nə edim?",
    "Elan səhifəsində Report this listing bölməsindən səbəbi göndərin. Təcili təhlükə varsa yerli hüquq-mühafizə orqanına müraciət edin.",
  ],
  [
    "Rəy kim yaza bilər?",
    "Yalnız həmin elan üzrə alıcı kimi söhbət açmış istifadəçi və elan satılmış kimi işarələndikdən sonra rəy yaza bilər.",
  ],
  [
    "Hesabımı və məlumatlarımı necə idarə edə bilərəm?",
    "Profil məlumatlarını dashboard-dan dəyişə, məlumat çıxarışı və hesabın silinməsi kimi sorğuları User Rights səhifəsindən göndərə bilərsiniz.",
  ],
];

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Help center"
      title="Tez-tez verilən suallar."
      intro="Elan yaratmaqdan təhlükəsiz görüşə qədər BookSwap-ın əsas qaydaları."
    >
      <div className="grid gap-4">
        {questions.map(([question, answer]) => (
          <details
            key={question}
            className="card p-5"
            open={question === questions[0][0]}
          >
            <summary className="cursor-pointer font-bold text-ink">
              {question}
            </summary>
            <p className="mt-3 text-xs leading-6 text-gray-600">{answer}</p>
          </details>
        ))}
      </div>
      <InfoSection title="Cavab tapmadınız?">
        <p>
          Elanla bağlı problem üçün həmin elanın report funksiyasından, şəxsi
          məlumat sorğuları üçün isə{" "}
          <a className="text-orange underline" href="/user-rights">
            İstifadəçi hüquqları
          </a>{" "}
          səhifəsindən istifadə edin.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
