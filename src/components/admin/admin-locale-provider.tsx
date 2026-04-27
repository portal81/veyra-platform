"use client";

import { createContext, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminLocaleDirection,
  repairAdminText,
  type AdminLocale,
} from "@/lib/admin-locale";

type AdminLocaleContextValue = {
  locale: AdminLocale;
  direction: "ltr" | "rtl";
  isPending: boolean;
  setLocale: (locale: AdminLocale) => void;
  t: (english: string, arabic: string) => string;
};

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

function normalizeLocalizedText(value: string) {
  return repairAdminText(value);
}

export function AdminLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: AdminLocale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const value = useMemo<AdminLocaleContextValue>(
    () => ({
      locale: initialLocale,
      direction: getAdminLocaleDirection(initialLocale),
      isPending,
      setLocale(nextLocale) {
        startTransition(async () => {
          await fetch("/api/admin/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: nextLocale }),
          });

          router.refresh();
        });
      },
      t(english, arabic) {
        const preferred = initialLocale === "ar" ? arabic : english;
        const fallback = initialLocale === "ar" ? english : arabic;
        const normalized = normalizeLocalizedText(preferred);

        if (initialLocale === "ar" && (!normalized || normalized.trim().length === 0)) {
          return normalizeLocalizedText(fallback);
        }

        return normalized;
      },
    }),
    [initialLocale, isPending, router],
  );

  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);

  if (!context) {
    throw new Error("useAdminLocale must be used inside AdminLocaleProvider.");
  }

  return context;
}
