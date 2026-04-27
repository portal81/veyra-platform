export type AdminLocale = "en" | "ar";

export const adminLocaleCookieName = "veyra-admin-locale";

const MOJIBAKE_PATTERN = /[ØÙÐÑÃï�]/;
const ARABIC_PATTERN = /[\u0600-\u06FF]/;
const SAFE_TEXT_PATTERN = /[\w\s.,:;!?@#%&()\-_/+[\]{}"'`~|]/;

function scoreText(value: string) {
  let score = 0;

  for (const char of value) {
    if (ARABIC_PATTERN.test(char)) {
      score += 3;
      continue;
    }

    if (SAFE_TEXT_PATTERN.test(char)) {
      score += 1;
      continue;
    }

    if (char === "ï" || char === "�") {
      score -= 5;
      continue;
    }

    if ("ØÙÐÑÃï�".includes(char)) {
      score -= 2;
    }
  }

  return score;
}

export function repairAdminText(value: string): string {
  if (!value || !MOJIBAKE_PATTERN.test(value)) return value;

  try {
    let current = value;

    // Some strings in the admin were encoded more than once, so we try
    // a couple of latin1->utf8 passes and keep whichever result scores best.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const next = Buffer.from(current, "latin1").toString("utf8");
      if (!next || next === current) break;
      current = next;
      if (!MOJIBAKE_PATTERN.test(current)) break;
    }

    return scoreText(current) > scoreText(value) ? current : value;
  } catch {
    return value;
  }
}

export function isAdminLocale(value: string | null | undefined): value is AdminLocale {
  return value === "en" || value === "ar";
}

export function getAdminLocaleDirection(locale: AdminLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function pickAdminText(locale: AdminLocale, english: string, arabic: string) {
  const raw = locale === "ar" ? arabic : english;
  return repairAdminText(raw);
}

const DB_DICTIONARY: Record<string, string> = {
  owner: "المالك",
  admin: "المدير",
  editor: "المحرر",
  sales: "المبيعات",
  marketer: "التسويق",
  viewer: "مشاهد",
  new: "جديد",
  contacted: "تم التواصل",
  qualified: "مؤهل",
  site_visit: "زيارة الموقع",
  negotiation: "تفاوض",
  closed_won: "مغلق (مكسب)",
  closed_lost: "مغلق (خسارة)",
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
  "Project Visit": "زيارة مشروع",
  "Finishing Quote": "عرض سعر التشطيب",
  "Smart Home Setup": "تركيب منزل ذكي",
};

const DB_DICTIONARY_REVERSE = Object.entries(DB_DICTIONARY).reduce<Record<string, string>>(
  (acc, [english, arabic]) => {
    acc[repairAdminText(arabic)] = english;
    return acc;
  },
  {},
);

export function translateDbText(locale: AdminLocale, text: string | undefined | null): string {
  if (!text) return "";
  const clean = repairAdminText(text);

  if (locale === "en") {
    return DB_DICTIONARY_REVERSE[clean] ?? clean;
  }

  if (DB_DICTIONARY[clean]) return repairAdminText(DB_DICTIONARY[clean]);
  const lowerVariant = DB_DICTIONARY[clean.toLowerCase()];
  if (lowerVariant) return repairAdminText(lowerVariant);

  return clean;
}
