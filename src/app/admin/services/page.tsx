import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { hasPermission } from "@/lib/admin-session";
import { ServiceCatalogBuilder } from "@/components/admin/service-catalog-builder";
import { getServiceCatalog } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();
  if (!hasPermission(session, "services.manage")) {
    redirect("/admin");
  }

  const catalog = await getServiceCatalog();
  const catalogCount = catalog.finishingPackages.length + catalog.smartDevices.length + catalog.smartPackages.length;

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Services Catalog", "ÙƒØªØ§Ù„ÙˆØ¬ Ø§Ù„Ø®Ø¯Ù…Ø§Øª")}
      description={pickAdminText(
        locale,
        "Manage finishing and smart-home catalog entities from the source of truth.",
        "Ø´ÙƒÙ‘Ù„ Ø¹Ø±ÙˆØ¶ Ø§Ù„ØªØ´Ø·ÙŠØ¨ ÙˆØ§Ù„Ù…Ù†Ø§Ø²Ù„ Ø§Ù„Ø°ÙƒÙŠØ© Ù…Ù† Ø¨ÙŠÙ„Ø¯Ø± ÙƒØªØ§Ù„ÙˆØ¬ ÙØ¹Ù„ÙŠ.",
      )}
    >
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <div className="admin-shell-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Total items", "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¹Ù†Ø§ØµØ±")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold text-white tabular-nums">{catalogCount}</strong>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Finishing packages", "Ø¨Ø§Ù‚Ø§Øª Ø§Ù„ØªØ´Ø·ÙŠØ¨")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold text-white tabular-nums">
              {catalog.finishingPackages.length}
            </strong>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Smart devices", "Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ø°ÙƒÙŠØ©")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold text-white tabular-nums">
              {catalog.smartDevices.length}
            </strong>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Smart packages", "Ø§Ù„Ø¨Ø§Ù‚Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ©")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold text-white tabular-nums">
              {catalog.smartPackages.length}
            </strong>
          </div>
        </section>

        <div className="admin-shell-panel overflow-hidden p-6 md:p-8">
          <ServiceCatalogBuilder initialCatalog={catalog} />
        </div>
      </div>
    </SaaSPageShell>
  );
}

