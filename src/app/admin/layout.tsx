import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { SaaSAdminMobileNav, SaaSAdminSidebar } from "@/components/admin/saas-sidebar";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";

export const dynamic = "force-dynamic";

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const locale = await getCurrentAdminLocale();

  if (!session) {
    redirect("/auth/login?next=/admin");
  }
  
  const isRtl = locale === "ar";

  return (
    <div className="flex min-h-screen bg-[#120f0d]">
      <SaaSAdminSidebar />
      <main className={`flex-1 transition-all duration-300 ${isRtl ? "lg:mr-[260px]" : "lg:ml-[260px]"}`}>
        <SaaSAdminMobileNav />
        <AdminCommandPalette />
        {children}
      </main>
    </div>
  );
}
