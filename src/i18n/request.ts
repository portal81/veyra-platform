import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { adminLocaleCookieName } from "@/lib/admin-locale";

export type Locale = "en" | "ar";

export default getRequestConfig(async () => {
  let locale: Locale = "en";

  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(adminLocaleCookieName)?.value;
    if (cookieLocale === "en" || cookieLocale === "ar") {
      locale = cookieLocale;
    } else {
      const acceptLang = (await headers()).get("accept-language");
      if (acceptLang?.startsWith("ar")) {
        locale = "ar";
      }
    }
  } catch {}

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
