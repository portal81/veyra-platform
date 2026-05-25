import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClientCaseFilesEditor } from "@/components/admin/crm/client-case-files-editor";
import { ClientCaseRoleTasksEditor } from "@/components/admin/crm/client-case-role-tasks-editor";
import { ClientCaseTeamEditor } from "@/components/admin/crm/client-case-team-editor";
import { LeadDiscussionPanel } from "@/components/admin/crm/lead-discussion-panel";
import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { getAdminSession } from "@/lib/admin-auth";
import { pickAdminText } from "@/lib/admin-locale";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { hasPermission } from "@/lib/admin-session";
import { getLeadActivities, getLeads, getProjects, getServiceCatalog, getTeamUsers } from "@/lib/repository";
import type {
  ClientCaseAssignment,
  ClientCaseFile,
  ClientCaseLink,
  ClientCaseRoleTask,
  ClientCaseRoleType,
  DeliveryReadiness,
  Lead,
  SiteTracking,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ClientCasePageProps = {
  params: Promise<{ id: string }>;
};

const LOST_REASON_PREFIX = "[LOST_REASON]";
const CASE_ASSIGNMENT_PREFIX = "[CASE_ASSIGNMENT]";
const CASE_LINK_PREFIX = "[CASE_LINK]";
const DELIVERY_READINESS_PREFIX = "[DELIVERY_READINESS]";
const SITE_TRACKING_PREFIX = "[SITE_TRACKING]";
const CASE_FILES_PREFIX = "[CASE_FILES]";
const ROLE_TASKS_PREFIX = "[ROLE_TASKS]";
const caseRoles: ClientCaseRoleType[] = [
  "sales",
  "operations",
  "engineer",
  "worker",
  "lawyer",
  "accountant",
  "marketer",
];

function getStatusTone(status?: string) {
  if (status === "blocked" || status === "rejected") return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  if (status === "submitted" || status === "ready_for_delivery") return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (status === "approved" || status === "completed" || status === "closed_won") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  return "border-white/10 bg-white/5 text-white/70";
}

function getExecutionLabel(status: DeliveryReadiness["status"] | undefined, locale: "en" | "ar") {
  if (!status) return locale === "ar" ? "غير مسجل" : "Not recorded";
  if (locale === "ar") {
    if (status === "not_started") return "لم يبدأ";
    if (status === "needs_assignment") return "يحتاج إسناد";
    if (status === "ready_for_delivery") return "جاهز للتنفيذ";
    if (status === "in_progress") return "جار التنفيذ";
    if (status === "blocked") return "متعثر";
    return "مكتمل";
  }
  return status.replaceAll("_", " ");
}

function getSiteStateLabel(status: DeliveryReadiness["siteState"] | undefined, locale: "en" | "ar") {
  if (!status) return locale === "ar" ? "غير محدد" : "Not set";
  if (locale === "ar") {
    if (status === "existing") return "مبني / قائم";
    if (status === "under_construction") return "تحت الإنشاء";
    return "لم يبدأ";
  }
  if (status === "existing") return "Built / existing";
  if (status === "under_construction") return "Under construction";
  return "Not started";
}

function parseLatestCaseData(lead: Lead, activities: Awaited<ReturnType<typeof getLeadActivities>>) {
  let lostReason = lead.lostReason;
  let linkedEntity: ClientCaseLink | undefined;
  let deliveryReadiness: DeliveryReadiness | undefined;
  let siteTracking: SiteTracking | undefined;
  let caseFiles: ClientCaseFile[] | undefined;
  let roleTasks: ClientCaseRoleTask[] | undefined;
  const latestSeen = {
    linkedEntity: false,
    deliveryReadiness: false,
    siteTracking: false,
    caseFiles: false,
    roleTasks: false,
  };
  const assignments: Record<ClientCaseRoleType, string> = {
    sales: lead.assignedTo ?? "",
    operations: "",
    engineer: "",
    worker: "",
    lawyer: "",
    accountant: "",
    marketer: "",
  };

  for (const activity of activities) {
    if (activity.kind !== "note" || activity.leadId !== lead.id) continue;

    if (!lostReason && activity.body.startsWith(LOST_REASON_PREFIX)) {
      lostReason = activity.body.replace(LOST_REASON_PREFIX, "").trim();
      continue;
    }

    if (activity.body.startsWith(CASE_ASSIGNMENT_PREFIX)) {
      const [role, assignee] = activity.body.replace(CASE_ASSIGNMENT_PREFIX, "").trim().split("::");
      if (caseRoles.includes(role as ClientCaseRoleType) && assignments[role as ClientCaseRoleType] === "") {
        assignments[role as ClientCaseRoleType] = assignee ?? "";
      }
      continue;
    }

    if (!latestSeen.linkedEntity && activity.body.startsWith(CASE_LINK_PREFIX)) {
      try {
        const parsed = JSON.parse(activity.body.replace(CASE_LINK_PREFIX, "").trim()) as ClientCaseLink | null;
        linkedEntity = parsed ?? undefined;
        latestSeen.linkedEntity = true;
      } catch {
        // Ignore historical malformed notes.
      }
      continue;
    }

    if (!latestSeen.deliveryReadiness && activity.body.startsWith(DELIVERY_READINESS_PREFIX)) {
      try {
        const parsed = JSON.parse(activity.body.replace(DELIVERY_READINESS_PREFIX, "").trim()) as DeliveryReadiness | null;
        deliveryReadiness = parsed ?? undefined;
        latestSeen.deliveryReadiness = true;
      } catch {
        // Ignore historical malformed notes.
      }
      continue;
    }

    if (!latestSeen.siteTracking && activity.body.startsWith(SITE_TRACKING_PREFIX)) {
      try {
        const parsed = JSON.parse(activity.body.replace(SITE_TRACKING_PREFIX, "").trim()) as SiteTracking | null;
        siteTracking = parsed ?? undefined;
        latestSeen.siteTracking = true;
      } catch {
        // Ignore historical malformed notes.
      }
      continue;
    }

    if (!latestSeen.caseFiles && activity.body.startsWith(CASE_FILES_PREFIX)) {
      try {
        const parsed = JSON.parse(activity.body.replace(CASE_FILES_PREFIX, "").trim()) as ClientCaseFile[];
        caseFiles = Array.isArray(parsed) ? parsed : [];
        latestSeen.caseFiles = true;
      } catch {
        // Ignore historical malformed notes.
      }
      continue;
    }

    if (!latestSeen.roleTasks && activity.body.startsWith(ROLE_TASKS_PREFIX)) {
      try {
        const parsed = JSON.parse(activity.body.replace(ROLE_TASKS_PREFIX, "").trim()) as ClientCaseRoleTask[];
        roleTasks = Array.isArray(parsed) ? parsed : [];
        latestSeen.roleTasks = true;
      } catch {
        // Ignore historical malformed notes.
      }
    }
  }

  return {
    ...lead,
    lostReason,
    linkedEntity: latestSeen.linkedEntity ? linkedEntity : lead.linkedEntity,
    deliveryReadiness: latestSeen.deliveryReadiness ? deliveryReadiness : lead.deliveryReadiness,
    siteTracking: latestSeen.siteTracking ? siteTracking : lead.siteTracking,
    caseFiles: latestSeen.caseFiles ? caseFiles : lead.caseFiles,
    roleTasks: latestSeen.roleTasks ? roleTasks : lead.roleTasks,
    caseAssignments: caseRoles.map((role) => {
      const assignee = assignments[role];
      return {
        role,
        assignee: assignee || undefined,
        status: assignee ? "assigned" : "unassigned",
      } satisfies ClientCaseAssignment;
    }),
  };
}

export default async function ClientCasePage({ params }: ClientCasePageProps) {
  const [{ id }, locale, session] = await Promise.all([params, getCurrentAdminLocale(), getAdminSession()]);

  if (!hasPermission(session, "leads.view")) {
    redirect("/admin");
  }

  const [leads, activities, users, projects, serviceCatalog] = await Promise.all([
    getLeads(),
    getLeadActivities(),
    getTeamUsers(),
    getProjects(),
    getServiceCatalog(),
  ]);
  const baseLead = leads.find((item) => item.id === id);

  if (!baseLead) {
    notFound();
  }

  const lead = parseLatestCaseData(baseLead, activities);
  const projectOptions = projects.map((project) => ({
    id: project.id,
    label: project.name,
    siteState: project.content?.operations?.siteState ?? "not_started",
    progressPercent: project.content?.operations?.progressPercent ?? 0,
    currentPhase: project.content?.operations?.currentPhase ?? "Not started",
    operationsNote: project.content?.operations?.note,
  }));
  const serviceOptions = [
    ...serviceCatalog.finishingPackages.map((item) => ({
      id: item.id,
      label: item.name,
      serviceType: "finishing_package",
    })),
    ...serviceCatalog.smartDevices.map((item) => ({
      id: item.id,
      label: item.name,
      serviceType: "smart_device",
    })),
    ...serviceCatalog.smartPackages.map((item) => ({
      id: item.id,
      label: item.name,
      serviceType: "smart_package",
    })),
  ];
  const caseFiles = lead.caseFiles ?? [];
  const linkedProjectOperations =
    lead.linkedEntity?.kind === "project"
      ? projectOptions.find((project) => project.id === lead.linkedEntity?.id)
      : undefined;
  const effectiveDeliveryReadiness =
    lead.deliveryReadiness ??
    (linkedProjectOperations
      ? {
          status: "not_started" as const,
          siteState: linkedProjectOperations.siteState,
          checklist: {
            teamAssigned: Boolean(lead.caseAssignments?.some((item) => item.assignee)),
            projectLinked: true,
            commercialClosed: false,
            docsReady: false,
          },
          note: linkedProjectOperations.operationsNote,
        }
      : undefined);
  const effectiveSiteTracking =
    lead.siteTracking ??
    (linkedProjectOperations
      ? {
          siteName: linkedProjectOperations.label,
          progressPercent: linkedProjectOperations.progressPercent,
          currentPhase: linkedProjectOperations.currentPhase,
          lastUpdate: linkedProjectOperations.operationsNote || `Project source: ${linkedProjectOperations.label}`,
        }
      : undefined);
  const approvedFiles = caseFiles.filter((file) => file.approvalStatus === "approved").length;
  const submittedFiles = caseFiles.filter((file) => file.approvalStatus === "submitted").length;
  const rejectedFiles = caseFiles.filter((file) => file.approvalStatus === "rejected").length;
  const assignedRoles = lead.caseAssignments?.filter((item) => item.assignee) ?? [];
  const roleTasks = lead.roleTasks ?? [];
  const doneRoleTasks = roleTasks.filter((task) => task.status === "done").length;
  const blockedRoleTasks = roleTasks.filter((task) => task.status === "blocked").length;
  const unassignedRoles = (lead.caseAssignments ?? []).filter((item) => !item.assignee);
  const firstUnassignedRole = unassignedRoles[0]?.role;
  const blockedTasks = roleTasks.filter((task) => task.status === "blocked");
  const firstBlockedTask = blockedTasks[0];
  const firstSubmittedFile = caseFiles.find((file) => file.approvalStatus === "submitted");
  const firstRejectedFile = caseFiles.find((file) => file.approvalStatus === "rejected");
  const openTasks = roleTasks.filter((task) => task.status !== "done");
  const ownerAlerts = [
    ...(!lead.linkedEntity
      ? [
          pickAdminText(
            locale,
            "No project or service is linked yet.",
            "لا يوجد مشروع أو خدمة مرتبطة بهذا العميل حتى الآن.",
          ),
        ]
      : []),
    ...(unassignedRoles.length
      ? [
          pickAdminText(
            locale,
            `${unassignedRoles.length} roles still need assignees.`,
            `${unassignedRoles.length} أدوار ما زالت بدون مسؤول.`,
          ),
        ]
      : []),
    ...(blockedTasks.length
      ? [
          pickAdminText(
            locale,
            `${blockedTasks.length} role tasks are blocked.`,
            `${blockedTasks.length} مهام أدوار متعثرة.`,
          ),
        ]
      : []),
    ...(submittedFiles
      ? [
          pickAdminText(
            locale,
            `${submittedFiles} files are waiting for review.`,
            `${submittedFiles} ملفات تنتظر المراجعة.`,
          ),
        ]
      : []),
    ...(rejectedFiles
      ? [
          pickAdminText(
            locale,
            `${rejectedFiles} files were rejected.`,
            `${rejectedFiles} ملفات مرفوضة وتحتاج إجراء.`,
          ),
        ]
      : []),
    ...(effectiveSiteTracking?.blocker
      ? [
          pickAdminText(
            locale,
            `Site blocker: ${effectiveSiteTracking.blocker}`,
            `عائق الموقع: ${effectiveSiteTracking.blocker}`,
          ),
        ]
      : []),
  ].slice(0, 5);
  const ownerActionHrefs = [
    ...(!lead.linkedEntity ? ["#execution-link"] : []),
    ...(unassignedRoles.length ? ["#first-unassigned-role"] : []),
    ...(firstBlockedTask ? [`#blocked-role-task-${firstBlockedTask.id}`] : []),
    ...(firstSubmittedFile ? [`#file-action-${firstSubmittedFile.id}`] : []),
    ...(firstRejectedFile ? [`#file-action-${firstRejectedFile.id}`] : []),
    ...(effectiveSiteTracking?.blocker ? ["#delivery-readiness"] : []),
  ].slice(0, 5);
  const ownerActionLabels = [
    ...(!lead.linkedEntity ? [pickAdminText(locale, "Link execution", "اربط التنفيذ")] : []),
    ...(unassignedRoles.length ? [pickAdminText(locale, "Assign roles", "اسند الأدوار")] : []),
    ...(blockedTasks.length ? [pickAdminText(locale, "Open tasks", "افتح المهام")] : []),
    ...(submittedFiles ? [pickAdminText(locale, "Review files", "راجع الملفات")] : []),
    ...(rejectedFiles ? [pickAdminText(locale, "Fix files", "عالج الملفات")] : []),
    ...(effectiveSiteTracking?.blocker ? [pickAdminText(locale, "Open execution", "افتح التنفيذ")] : []),
  ].slice(0, 5);
  const ownerHealth =
    blockedTasks.length || rejectedFiles || effectiveSiteTracking?.blocker
      ? "blocked"
      : unassignedRoles.length || submittedFiles || !lead.linkedEntity
        ? "needs_attention"
        : "healthy";
  const timeline = activities.filter((activity) => activity.leadId === lead.id).slice(0, 20);
  const leadDiscussions = activities.filter(
    (activity) => activity.leadId === lead.id && activity.kind === "discussion",
  );
  const leadHandoffs = activities.filter(
    (activity) => activity.leadId === lead.id && (activity.kind === "handoff" || activity.kind === "handoff_accepted"),
  );

  return (
    <SaaSPageShell
      title={lead.fullName}
      description={pickAdminText(
        locale,
        "A dedicated client case workspace for sales, execution, documents, and owner readings.",
        "مساحة ملف عميل مستقلة للمبيعات والتنفيذ والمستندات وقراءات المالك.",
      )}
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/leads" className="admin-shell-button-secondary rounded-full px-4 py-3 text-sm font-semibold text-white">
            {pickAdminText(locale, "Back to Operations Hub", "العودة لمركز العمليات")}
          </Link>
          <a href="#team" className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
            {pickAdminText(locale, "Team", "الفريق")}
          </a>
          <a href="#role-tasks" className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
            {pickAdminText(locale, "Role tasks", "مهام الأدوار")}
          </a>
          <a href="#files" className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
            {pickAdminText(locale, "Files", "الملفات")}
          </a>
          <a href="#timeline" className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
            {pickAdminText(locale, "Timeline", "السجل")}
          </a>
        </div>

        <section className="admin-shell-panel p-5">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
                {pickAdminText(locale, "Client case overview", "نظرة عامة على ملف العميل")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{lead.service}</h2>
              <div className="mt-3 inline-flex rounded-full border border-[#f2c16b]/25 bg-[#f2c16b]/10 px-4 py-2 text-sm font-semibold text-[#f2c16b]">
                {lead.linkedEntity
                  ? pickAdminText(
                      locale,
                      `Linked ${lead.linkedEntity.kind}: ${lead.linkedEntity.label}`,
                      `الربط الحالي: ${lead.linkedEntity.label}`,
                    )
                  : pickAdminText(locale, "No linked project or service yet", "لا يوجد مشروع أو خدمة مرتبطة بعد")}
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
                {lead.message || pickAdminText(locale, "No client message recorded.", "لا توجد رسالة مسجلة من العميل.")}
              </p>
              {lead.message ? (
                <p className="mt-1 text-xs text-white/42">
                  {pickAdminText(locale, "Original client message, not the current execution link.", "رسالة العميل الأصلية، وليست ربط التنفيذ الحالي.")}
                </p>
              ) : null}
              <Link
                href={`/admin/leads?open=${lead.id}&mode=overview`}
                className="mt-4 inline-flex rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-3 text-sm font-semibold text-[#f2c16b]"
              >
                {pickAdminText(locale, "Edit overview", "تعديل النظرة العامة")}
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/45">{pickAdminText(locale, "Stage", "المرحلة")}</p>
                <p className="mt-2 text-lg font-semibold text-white">{lead.stage.replaceAll("_", " ")}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/45">{pickAdminText(locale, "Priority", "الأولوية")}</p>
                <p className="mt-2 text-lg font-semibold text-white">{lead.priority}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/45">{pickAdminText(locale, "Phone", "الهاتف")}</p>
                <p className="mt-2 text-sm text-white/82" dir="ltr">{lead.phone}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/45">{pickAdminText(locale, "Budget", "الميزانية")}</p>
                <p className="mt-2 text-sm text-white/82">{lead.budget ? formatCurrency(lead.budget) : pickAdminText(locale, "Not set", "غير محددة")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-shell-panel overflow-hidden p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
                {pickAdminText(locale, "Owner readings", "قراءات المالك")}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {ownerHealth === "blocked"
                  ? pickAdminText(locale, "This case has blockers that need action", "هذا الملف به عوائق تحتاج إجراء")
                  : ownerHealth === "needs_attention"
                    ? pickAdminText(locale, "This case needs attention before it is calm", "هذا الملف يحتاج متابعة قبل أن يصبح مستقرًا")
                    : pickAdminText(locale, "This case is currently calm", "هذا الملف مستقر حاليًا")}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">
                {pickAdminText(
                  locale,
                  "A quick owner-level summary from project source data, role ownership, files, and execution progress.",
                  "ملخص سريع للمالك من بيانات المشروع الأساسية، مسؤوليات الفريق، الملفات، وتقدم التنفيذ.",
                )}
              </p>
            </div>
            <span className={`rounded-full border px-4 py-2 text-xs font-semibold ${getStatusTone(ownerHealth === "healthy" ? "approved" : ownerHealth === "blocked" ? "blocked" : "submitted")}`}>
              {ownerHealth === "blocked"
                ? pickAdminText(locale, "Blocked", "متعثر")
                : ownerHealth === "needs_attention"
                  ? pickAdminText(locale, "Needs attention", "يحتاج متابعة")
                  : pickAdminText(locale, "Healthy", "مستقر")}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="admin-shell-muted-card p-4">
              <p className="text-xs text-white/45">{pickAdminText(locale, "Linked execution", "ربط التنفيذ")}</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {lead.linkedEntity?.label ?? pickAdminText(locale, "Not linked", "غير مربوط")}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {lead.linkedEntity
                  ? pickAdminText(locale, lead.linkedEntity.kind, lead.linkedEntity.kind === "project" ? "مشروع" : "خدمة")
                  : pickAdminText(locale, "Choose a project or service below.", "اختر مشروعًا أو خدمة بالأسفل.")}
              </p>
            </div>
            <div className="admin-shell-muted-card p-4">
              <p className="text-xs text-white/45">{pickAdminText(locale, "Project state", "حالة المشروع")}</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {getSiteStateLabel(effectiveDeliveryReadiness?.siteState, locale)}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {linkedProjectOperations
                  ? pickAdminText(locale, "Pulled from project source.", "مأخوذة من بيانات المشروع.")
                  : pickAdminText(locale, "No project source yet.", "لا يوجد مصدر مشروع بعد.")}
              </p>
            </div>
            <div className="admin-shell-muted-card p-4">
              <p className="text-xs text-white/45">{pickAdminText(locale, "Execution pulse", "نبض التنفيذ")}</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {effectiveSiteTracking ? `${effectiveSiteTracking.progressPercent}%` : "0%"}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {effectiveSiteTracking?.currentPhase ?? pickAdminText(locale, "No phase recorded.", "لا توجد مرحلة مسجلة.")}
              </p>
            </div>
            <div className="admin-shell-muted-card p-4">
              <p className="text-xs text-white/45">{pickAdminText(locale, "Open role tasks", "مهام الأدوار المفتوحة")}</p>
              <p className="mt-2 text-lg font-semibold text-white">{openTasks.length}</p>
              <p className="mt-1 text-xs text-white/45">
                {blockedTasks.length} {pickAdminText(locale, "blocked", "متعثر")}
              </p>
            </div>
            <div className="admin-shell-muted-card p-4">
              <p className="text-xs text-white/45">{pickAdminText(locale, "Files needing action", "ملفات تحتاج إجراء")}</p>
              <p className="mt-2 text-lg font-semibold text-white">{submittedFiles + rejectedFiles}</p>
              <p className="mt-1 text-xs text-white/45">
                {submittedFiles} {pickAdminText(locale, "review", "مراجعة")} / {rejectedFiles} {pickAdminText(locale, "rejected", "مرفوض")}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {ownerAlerts.length ? (
              ownerAlerts.map((alert, index) => (
                <div key={alert} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-100">
                  <span>{alert}</span>
                  <a
                    href={ownerActionHrefs[index] ?? "#team"}
                    className="rounded-full border border-amber-200/30 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/10"
                  >
                    {ownerActionLabels[index] ?? pickAdminText(locale, "Open", "افتح")}
                  </a>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {pickAdminText(locale, "No owner alerts right now.", "لا توجد تنبيهات للمالك حاليًا.")}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="admin-shell-card p-5">
            <p className="text-xs text-white/45">{pickAdminText(locale, "Role tasks", "مهام الأدوار")}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{doneRoleTasks}/{roleTasks.length || caseRoles.length}</p>
            <p className="mt-1 text-xs text-white/50">{blockedRoleTasks} {pickAdminText(locale, "blocked", "متعثر")}</p>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-xs text-white/45">{pickAdminText(locale, "Assigned roles", "الأدوار المسندة")}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{assignedRoles.length}</p>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-xs text-white/45">{pickAdminText(locale, "Execution", "التنفيذ")}</p>
            <p className="mt-2 text-lg font-semibold text-white">{getExecutionLabel(effectiveDeliveryReadiness?.status, locale)}</p>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-xs text-white/45">{pickAdminText(locale, "Documents", "المستندات")}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{caseFiles.length}</p>
            <p className="mt-1 text-xs text-white/50">{approvedFiles} {pickAdminText(locale, "approved", "معتمد")}</p>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-xs text-white/45">{pickAdminText(locale, "Site progress", "تقدم الموقع")}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{effectiveSiteTracking?.progressPercent ?? 0}%</p>
          </div>
        </section>

        <section id="team" className="admin-shell-panel scroll-mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
                {pickAdminText(locale, "Team and execution", "الفريق والتنفيذ")}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {pickAdminText(locale, "Who owns what in this case", "من مسؤول عن ماذا في هذا الملف")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-2 text-xs ${getStatusTone(effectiveDeliveryReadiness?.status)}`}>
                {getExecutionLabel(effectiveDeliveryReadiness?.status, locale)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {lead.caseAssignments?.map((assignment) => (
              <div key={assignment.role} className="admin-shell-muted-card p-4">
                <p className="text-sm font-semibold text-white">{assignment.role}</p>
                <p className="mt-2 text-sm text-white/62">
                  {assignment.assignee || pickAdminText(locale, "Unassigned", "غير معين")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="admin-shell-muted-card p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">{pickAdminText(locale, "Execution link", "ربط التنفيذ")}</p>
              <p className="mt-2 text-sm text-white/72">
                {lead.linkedEntity
                  ? `${lead.linkedEntity.kind}: ${lead.linkedEntity.label}`
                  : pickAdminText(locale, "No linked project or service yet.", "لا يوجد مشروع أو خدمة مرتبطة بعد.")}
              </p>
            </div>
            <div className="admin-shell-muted-card p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">{pickAdminText(locale, "Site tracking", "متابعة الموقع")}</p>
              <p className="mt-2 text-sm text-white/72">
                {effectiveSiteTracking
                  ? `${effectiveSiteTracking.progressPercent}% - ${effectiveSiteTracking.currentPhase}`
                  : pickAdminText(locale, "No site update recorded yet.", "لا يوجد تحديث موقع مسجل بعد.")}
              </p>
              {effectiveSiteTracking?.blocker ? <p className="mt-2 text-sm text-rose-200">{effectiveSiteTracking.blocker}</p> : null}
            </div>
          </div>

          <ClientCaseTeamEditor
            leadId={lead.id}
            users={users}
            projectOptions={projectOptions}
            serviceOptions={serviceOptions}
            initialAssignments={lead.caseAssignments ?? []}
            focusRole={firstUnassignedRole}
            initialLinkedEntity={lead.linkedEntity}
            initialDeliveryReadiness={effectiveDeliveryReadiness}
            initialSiteTracking={effectiveSiteTracking}
          />
        </section>

        <ClientCaseRoleTasksEditor
          leadId={lead.id}
          assignments={lead.caseAssignments ?? []}
          initialTasks={roleTasks}
          linkedEntity={lead.linkedEntity}
          files={caseFiles.map((file) => ({
            id: file.id,
            displayName: file.displayName,
            approvalStatus: file.approvalStatus,
          }))}
          siteTracking={effectiveSiteTracking}
        />

        <section id="files" className="admin-shell-panel scroll-mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
                {pickAdminText(locale, "Files and approvals", "الملفات والاعتمادات")}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {pickAdminText(locale, "Documents attached to this client case", "المستندات المرتبطة بهذا العميل")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-amber-100">{submittedFiles} {pickAdminText(locale, "review", "مراجعة")}</span>
              <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-rose-100">{rejectedFiles} {pickAdminText(locale, "rejected", "مرفوض")}</span>
            </div>
          </div>

          <ClientCaseFilesEditor leadId={lead.id} initialFiles={caseFiles} />
        </section>

        <section id="timeline" className="admin-shell-panel scroll-mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
                {pickAdminText(locale, "Timeline and notes", "السجل والملاحظات")}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {pickAdminText(locale, "Latest case activity", "آخر نشاط على الملف")}
              </h2>
            </div>
            <Link
              href={`/admin/leads?open=${lead.id}&mode=overview`}
              className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-3 py-2 text-xs font-semibold text-[#f2c16b]"
            >
              {pickAdminText(locale, "Add note", "إضافة ملاحظة")}
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {timeline.length ? (
              timeline.map((activity) => (
                <div key={activity.id} className="admin-shell-muted-card p-4">
                  <p className="text-sm leading-7 text-white/75">{activity.body}</p>
                  <p className="mt-2 text-xs text-white/42">{formatDate(activity.createdAt)} - {activity.createdBy}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
                {pickAdminText(locale, "No activity recorded yet.", "لا يوجد نشاط مسجل بعد.")}
              </div>
            )}
          </div>
        </section>

        {/* ── Veyra Connect: internal discussion ── */}
        <LeadDiscussionPanel
          leadId={lead.id}
          initialComments={leadDiscussions}
          users={users}
          currentUserId={session!.userId}
        />

        {/* ── Veyra Connect: handoff history ── */}
        {leadHandoffs.length > 0 ? (
          <section className="admin-shell-panel scroll-mt-6 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
                  {pickAdminText(locale, "Handoff history", "سجل التسليم")}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {pickAdminText(locale, "Previous handoffs", "التسليمات السابقة")}
                </h2>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {leadHandoffs.map((handoff) => {
                let payload: { from: string; to: string; note: string; status: string } | null = null;
                try { payload = JSON.parse(handoff.body); } catch { /* skip */ }
                const isAccepted = handoff.kind === "handoff_accepted" || payload?.status === "accepted";
                return (
                  <div key={handoff.id} className={`admin-shell-muted-card p-4 ${isAccepted ? "border-emerald-400/20" : "border-amber-400/20"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">
                        {payload ? `${payload.from} → ${payload.to}` : handoff.body}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isAccepted
                          ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                          : "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                      }`}>
                        {isAccepted
                          ? pickAdminText(locale, "Completed", "مكتمل")
                          : pickAdminText(locale, "Pending", "معلق")}
                      </span>
                    </div>
                    {payload?.note ? (
                      <p className="mt-2 text-sm text-white/60">{payload.note}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-white/35">{formatDate(handoff.createdAt)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </SaaSPageShell>
  );
}
