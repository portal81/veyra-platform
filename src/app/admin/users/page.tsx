import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { hasPermission } from "@/lib/admin-session";
import { InviteUsersPanel } from "@/components/admin/invite-users-panel";
import { getInvitations, getTeamUsers } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();
  if (!hasPermission(session, "users.view")) {
    redirect("/admin");
  }

  const [users, invitations] = await Promise.all([getTeamUsers(), getInvitations()]);
  const invitedUsers = users.filter((user) => user.status === "invited").length;
  const activeUsers = users.filter((user) => user.status === "active").length;

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Team Users", "إدارة المستخدمين")}
      description={pickAdminText(
        locale,
        "Invite teammates, assign roles, and keep access centralized.",
        "ادعُ أعضاء الفريق وحدد الأدوار واجعل الوصول مركزيًا.",
      )}
    >
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="admin-shell-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Users", "المستخدمون")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold tabular-nums text-white">{users.length}</strong>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Active", "نشط")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold tabular-nums text-white">{activeUsers}</strong>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {pickAdminText(locale, "Invites", "دعوات")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold tabular-nums text-white">
              {Math.max(invitedUsers, invitations.length)}
            </strong>
          </div>
        </section>

        <div className="admin-shell-panel overflow-hidden p-6">
          <InviteUsersPanel initialUsers={users} initialInvitations={invitations} />
        </div>
      </div>
    </SaaSPageShell>
  );
}
