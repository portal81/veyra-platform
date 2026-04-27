"use client";

import { useAdminLocale } from "@/components/admin/admin-locale-provider";

export function SaaSPageShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useAdminLocale();

  return (
    <div className="mx-auto w-full max-w-[1600px] p-5 lg:p-8">
      <div className="admin-shell-surface mb-8 flex flex-wrap items-start justify-between gap-4 rounded-[28px] px-6 py-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2c16b]">
            {t("Admin workspace", "مساحة الأدمن")}
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white lg:text-3xl">{title}</h1>
          {description && (
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/62">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div>{children}</div>
    </div>
  );
}
