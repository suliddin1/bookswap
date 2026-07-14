export const DOCUMENT_LANGUAGE = "az";
export const APP_LOCALE = "az-AZ";

export const AZ_COPY = {
  metadata: {
    title: "BookSwap | Kitabına ikinci həyat ver",
    description:
      "İkinci əl kitabları birbaşa oxuculardan almaq və satmaq üçün kitab bazarı.",
    openGraphDescription:
      "İkinci əl kitabları yaxınlıqdakı oxuculardan birbaşa al və sat.",
    socialDescription:
      "Oxucuları ikinci əl kitablar üçün birləşdirən kitab bazarı.",
  },
  navigation: {
    home: "Ana səhifə",
    browse: "Kitablar",
    sell: "Kitab sat",
    messages: "Mesajlar",
    favorites: "Seçilmişlər",
    dashboard: "Kabinet",
    notifications: "Bildirişlər",
    search: "Axtarış",
    signIn: "Daxil ol",
    signOut: "Çıxış et",
    menu: "Menyu",
    sellBook: "Kitab sat",
  },
  footer: {
    description:
      "Oxucuları bir-biri ilə birləşdirən kitab bazarı. BookSwap ödənişləri emal etmir və elandakı kitabları təhvil almır.",
    marketplace: "Kitab bazarı",
    browse: "Kitablara bax",
    sell: "Kitab sat",
    safety: "Təhlükəsizlik",
    faq: "Tez-tez verilən suallar",
    legal: "Hüquqi məlumat",
    rights: "Hüquqlarınız",
    privacy: "Məxfilik bildirişi",
    terms: "İstifadə şərtləri",
    userRights: "İstifadəçi hüquqları",
    copyright: "© 2026 BookSwap",
  },
  global: {
    loading: "Kitablar hazırlanır",
    errorBadge: "Xəta baş verdi",
    errorTitle: "Bu səhifəni yükləmək mümkün olmadı.",
    errorBody:
      "Yenidən cəhd et. Problem davam edərsə, BookSwap hesabında əməliyyat aparmayıb və ödəniş qəbul etməyib.",
    retry: "Yenidən cəhd et",
    notFoundTitle: "Bu səhifə artıq rəfdə deyil.",
    notFoundBody:
      "Kitab satılmış, səhifə köçürülmüş və ya heç yaradılmamış ola bilər.",
    notFoundAction: "Mövcud kitablara bax",
    listingsUnavailable: "Kitabları yükləmək mümkün olmadı.",
    loadMoreUnavailable: "Daha çox kitabı yükləmək mümkün olmadı.",
  },
  home: {
    badge: "BookSwap kitab bazarı",
    heroLead: "Növbəti kitabını tap.",
    heroAccent: "Oxuduğuna ikinci həyat ver.",
    intro:
      "Dərslikləri, romanları, qeydləri və çətin tapılan nəşrləri oxuculardan birbaşa alıb-sat.",
    searchPlaceholder: "Ad, müəllif, mövzu və ya ISBN ilə axtar",
    searchLabel: "Kitab axtar",
    searchAction: "Kitab axtar",
    featuredLabel: "Seçilmiş rəf",
    featuredTitle: "Oxucuların diqqətində olan kitablar.",
    featuredEmptyTitle: "Seçilmiş rəf hələ boşdur.",
    featuredEmptyBody: "İlk elanı yerləşdirib kitab bazarını canlandır.",
    browseLabel: "Kitab bazarına bax",
    browseTitle: "Rəflərdən birini seç.",
    browseBody: "Dərs vəsaitlərindən nadir tapılan nəşrlərədək.",
    openShelf: "Rəfi aç",
    recentLabel: "Yeni elanlar",
    recentTitle: "Yaxınlıqdakı oxuculardan yeni kitablar.",
    sellerBadge: "Rəfindəki kitab qazanc gətirə bilər",
    sellerTitleLead: "Oxuyub bitirdin?",
    sellerTitleAccent: "Başqa oxucuya ötür.",
    sellerBody:
      "Kitabın real şəklini çək, ədalətli qiymət seç və onu növbəti oxucuya çatdır.",
    sellBook: "Kitabını sat",
    viewAll: "Hamısına bax",
  },
  catalog: {
    allBooks: "Bütün kitablar",
    badge: "Kitab kataloqu",
    title: "Satışdakı kitablar.",
    intro:
      "Hər nəticə bir oxucunun yerləşdirdiyi real nüsxədir. Kataloqda axtar, sonra satıcıya birbaşa yaz.",
    searchCard: "Kataloq axtarışı",
    availableCopies: "BookSwap / Mövcud nüsxələr",
    titleAuthorIsbn: "Ad / müəllif / ISBN",
    searchPlaceholder: "Kataloqda axtar...",
    searchLabel: "Ad, müəllif və ya ISBN ilə axtar",
    clearSearch: "Kataloq axtarışını təmizlə",
    location: "Məkan",
    locationFilter: "Məkana görə filtrlə",
    anywhere: "Bütün Azərbaycan",
    condition: "Vəziyyət",
    conditionFilter: "Vəziyyətə görə filtrlə",
    anyCondition: "İstənilən vəziyyət",
    maximumPrice: "Maksimum qiymət",
    maximumPriceLabel: "AZN ilə maksimum qiymət",
    subjectIndex: "Bölmələr",
    readerListed: "Oxucular yerləşdirib.",
    readerListedBody:
      "Qiymət, kitabın vəziyyəti və təhvil detalları birbaşa satıcıdan gəlir.",
    sortLabel: "Elanları sırala",
    newest: "Ən yeni",
    lowestPrice: "Ən aşağı qiymət",
    highestPrice: "Ən yüksək qiymət",
    loadingMore: "Yüklənir...",
    loadMore: "Daha çox kitab göstər",
    emptyTitle: "Uyğun kitab tapılmadı.",
    emptyBody:
      "Axtarışı genişləndir və ya oxucuların axtardığı kitabı elan et.",
    sellBook: "Kitab sat",
  },
  listingCard: {
    save: "Elanı seçilmişlərə əlavə et",
    remove: "Elanı seçilmişlərdən çıxar",
    sold: "Satılıb",
    cover: "üz qabığı",
  },
} as const;

const categoryLabels: Record<string, string> = {
  Textbooks: "Dərsliklər",
  Fiction: "Bədii ədəbiyyat",
  "Exam Prep": "İmtahana hazırlıq",
  Notes: "Qeydlər",
  "Rare Finds": "Nadir tapıntılar",
  Business: "Biznes",
  Design: "Dizayn",
  Science: "Elm",
  History: "Tarix",
  Children: "Uşaq kitabları",
  Academic: "Akademik",
  Essays: "Esselər",
  Books: "Kitablar",
};

const conditionLabels: Record<string, string> = {
  "Like new": "Yeni kimidir",
  "Very good": "Çox yaxşı",
  Good: "Yaxşı",
  "Well read": "İstifadə olunub",
};

const cityLabels: Record<string, string> = {
  Azerbaijan: "Azərbaycan",
  Baku: "Bakı",
  Ganja: "Gəncə",
  Sumqayit: "Sumqayıt",
  Khirdalan: "Xırdalan",
  Mingachevir: "Mingəçevir",
  Lankaran: "Lənkəran",
  Shaki: "Şəki",
  Shirvan: "Şirvan",
  Nakhchivan: "Naxçıvan",
  Other: "Digər",
};

const listingStatusLabels: Record<string, string> = {
  active: "Aktiv",
  draft: "Qaralama",
  sold: "Satılıb",
  locked: "Kilidlənib",
};

const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatAzn(value: number) {
  return `${currencyFormatter.format(value)}\u00a0₼`;
}

export function formatAzDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  return new Intl.DateTimeFormat(APP_LOCALE, options).format(new Date(value));
}

export function formatCategory(value: string) {
  return categoryLabels[value] ?? value;
}

export function formatCondition(value: string) {
  return conditionLabels[value] ?? value;
}

export function formatCity(value: string) {
  return cityLabels[value] ?? value;
}

export function formatListingStatus(value: string) {
  return listingStatusLabels[value] ?? value;
}
