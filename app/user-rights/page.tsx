import { InfoPage, InfoSection } from "@/components/info-page";
import { PrivacyRequestForm } from "@/components/privacy-request-form";

export const metadata = {
  title: "User Rights",
  description: "Control your BookSwap account and personal data.",
};

export default function UserRightsPage() {
  return (
    <InfoPage
      eyebrow="Account & data"
      title="Sizin məlumatınız, sizin seçiminiz."
      intro="BookSwap-da hesab və fərdi məlumatlarınız üzərində nəzarət imkanları."
    >
      <InfoSection title="Mövcud hüquqlar">
        <ul className="list-disc space-y-2 pl-5">
          <li>Haqqınızda saxlanan məlumatın surətini istəmək.</li>
          <li>Yanlış və ya natamam məlumatı düzəltmək.</li>
          <li>Daşına bilən məlumat çıxarışı istəmək.</li>
          <li>Müəyyən emala etiraz etmək.</li>
          <li>Hesab və məlumatların silinməsini istəmək.</li>
          <li>
            Moderasiya və hesab məhdudiyyəti barədə izah və yenidən baxış
            istəmək.
          </li>
        </ul>
      </InfoSection>
      <InfoSection title="Sorğu göndərin">
        <p>
          Hesabınıza daxil olduqdan sonra aşağıdakı formanı istifadə edin.
          Təhlükəsizlik üçün əlavə şəxsiyyət təsdiqi tələb oluna bilər. Hüquqi
          və fraud-prevention öhdəliyi olan məlumat dərhal silinməyə bilər.
        </p>
        <PrivacyRequestForm />
      </InfoSection>
      <InfoSection title="Gündəlik nəzarət">
        <p>
          Ad, şəhər və private telefon nömrəsini Dashboard → Profile bölməsində
          dəyişə bilərsiniz. Elanları redaktə edə, silə, satılmış kimi işarələyə
          və favoritləri istənilən vaxt dəyişə bilərsiniz.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
