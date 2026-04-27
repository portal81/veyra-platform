import { cookies } from "next/headers";
import { adminLocaleCookieName, type AdminLocale, isAdminLocale } from "@/lib/admin-locale";

export async function getCurrentAdminLocale(fallback: AdminLocale = "en"): Promise<AdminLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(adminLocaleCookieName)?.value;

  return isAdminLocale(value) ? value : fallback;
}
