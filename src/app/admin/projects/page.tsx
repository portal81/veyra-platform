import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { hasPermission } from "@/lib/admin-session";
import { ProjectCatalogBuilder } from "@/components/admin/project-catalog-builder";
import { getProjects } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();
  if (!hasPermission(session, "projects.view")) {
    redirect("/admin");
  }

  const projects = await getProjects();
  const totalUnits = projects.reduce((sum, project) => sum + project.units.length, 0);
  const featuredProjects = projects.filter((project) => project.featured).length;

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Projects", "إدارة المشروعات")}
      description={pickAdminText(
        locale,
        "Manage project entities, media, and live inventory from the source of truth.",
        "أدر عرض المشروعات والوسائط والمخزون الحي من مكان واحد.",
      )}
    >
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="admin-shell-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Projects", "المشروعات")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold text-white tabular-nums">{projects.length}</strong>
            <p className="mt-1 text-[11px] text-neutral-500">
              {pickAdminText(locale, "Total catalog directories.", "إجمالي المشاريع داخل الكتالوج.")}
            </p>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Units", "الوحدات")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold text-white tabular-nums">{totalUnits}</strong>
            <p className="mt-1 text-[11px] text-neutral-500">
              {pickAdminText(locale, "Total unit listings globally.", "إجمالي الوحدات المعروضة.")}
            </p>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Featured", "المميزة")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold text-white tabular-nums">{featuredProjects}</strong>
            <p className="mt-1 text-[11px] text-neutral-500">
              {pickAdminText(locale, "Highlighted on main screen.", "مميزة في الشاشة الرئيسية.")}
            </p>
          </div>
        </section>

        <div className="admin-shell-panel overflow-hidden p-6 md:p-8">
          <ProjectCatalogBuilder initialProjects={projects} />
        </div>
      </div>
    </SaaSPageShell>
  );
}

