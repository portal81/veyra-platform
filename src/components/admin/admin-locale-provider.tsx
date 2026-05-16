"use client";

import { createContext, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getAdminLocaleDirection,
  repairAdminText,
  type AdminLocale,
} from "@/lib/admin-locale";
import type enMessages from "../../../messages/en.json";

type Messages = typeof enMessages;

type AdminLocaleContextValue = {
  locale: AdminLocale;
  direction: "ltr" | "rtl";
  isPending: boolean;
  setLocale: (locale: AdminLocale) => void;
  t: (en: string, ar: string) => string;
};

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

function normalizeLocalizedText(value: string) {
  return repairAdminText(value);
}

export function AdminLocaleProvider({
  initialLocale,
  messages,
  children,
}: {
  initialLocale: AdminLocale;
  messages: Messages;
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
      t(en, ar) {
        const preferred = initialLocale === "ar" ? ar : en;
        const fallback = initialLocale === "ar" ? en : ar;
        const normalized = normalizeLocalizedText(preferred);
        if (initialLocale === "ar" && (!normalized || normalized.trim().length === 0)) {
          return normalizeLocalizedText(fallback);
        }
        return normalized;
      },
    }),
    [initialLocale, isPending, router],
  );

  return (
    <NextIntlClientProvider locale={initialLocale} messages={messages}>
      <AdminLocaleContext.Provider value={value}>
        {children}
      </AdminLocaleContext.Provider>
    </NextIntlClientProvider>
  );
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);
  if (!context) {
    throw new Error("useAdminLocale must be used inside AdminLocaleProvider.");
  }
  return context;
}
