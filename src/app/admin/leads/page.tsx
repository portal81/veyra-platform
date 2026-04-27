import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { LeadPipelineBoard } from "@/components/admin/lead-pipeline-board";
import { getAdminSession } from "@/lib/admin-auth";
import { pickAdminText, translateDbText } from "@/lib/admin-locale";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { hasPermission } from "@/lib/admin-session";
import {
  getClientCaseSnapshot,
  getLeadActivities,
  getLeads,
  getProjects,
  getServiceCatalog,
  getTeamUsers,
} from "@/lib/repository";
import type {
  ClientCaseAssignment,
  ClientCaseFile,
  ClientCaseLink,
  ClientCaseRoleType,
  DeliveryReadiness,
  Lead,
  SiteTracking,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const closedStages = new Set(["closed_won", "closed_lost"]);
const LOST_REASON_PREFIX = "[LOST_REASON]";
const CASE_ASSIGNMENT_PREFIX = "[CASE_ASSIGNMENT]";
const CASE_LINK_PREFIX = "[CASE_LINK]";
const DELIVERY_READINESS_PREFIX = "[DELIVERY_READINESS]";
const SITE_TRACKING_PREFIX = "[SITE_TRACKING]";
const CASE_FILES_PREFIX = "[CASE_FILES]";
const caseRoles: ClientCaseRoleType[] = [
  "sales",
  "operations",
  "engineer",
  "worker",
  "lawyer",
  "accountant",
  "marketer",
];

function getLeadAgeInDays(lead: Lead) {
  return Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function getLeadPriorityWeight(lead: Lead) {
  return lead.priority === "high" ? 3 : lead.priority === "medium" ? 2 : 1;
}

function getDeliveryStatusLabel(status: DeliveryReadiness["status"], locale: "en" | "ar") {
  if (locale === "ar") {
    if (status === "not_started") return "لم يبدأ";
    if (status === "needs_assignment") return "يحتاج إسناد";
    if (status === "ready_for_delivery") return "جاهز للتنفيذ";
    if (status === "in_progress") return "جارٍ التنفيذ";
    if (status === "blocked") return "متعثر";
    return "مكتمل";
  }

  return status.replaceAll("_", " ");
}

export default async function AdminLeadsPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();

  if (!hasPermission(session, "leads.view")) {
    redirect("/admin");
  }

  const [leads, activities, users, clientCaseSnapshot, projects, serviceCatalog] = await Promise.all([
    getLeads(),
    getLeadActivities(),
    getTeamUsers(),
    getClientCaseSnapshot(),
    getProjects(),
    getServiceCatalog(),
  ]);

  const latestLostReasonByLead = activities.reduce<Record<string, string>>((acc, activity) => {
    if (activity.kind === "note" && activity.body.startsWith(LOST_REASON_PREFIX) && !acc[activity.leadId]) {
      acc[activity.leadId] = activity.body.replace(LOST_REASON_PREFIX, "").trim();
    }
    return acc;
  }, {});

  const latestAssignmentsByLead = activities.reduce<Record<string, Record<ClientCaseRoleType, string>>>(
    (acc, activity) => {
      if (activity.kind !== "note" || !activity.body.startsWith(CASE_ASSIGNMENT_PREFIX)) {
        return acc;
      }

      const payload = activity.body.replace(CASE_ASSIGNMENT_PREFIX, "").trim();
      const [role, assignee] = payload.split("::");
      if (!role || !caseRoles.includes(role as ClientCaseRoleType)) {
        return acc;
      }

      const leadAssignments = acc[activity.leadId] ?? {};
      if (leadAssignments[role as ClientCaseRoleType] === undefined) {
        leadAssignments[role as ClientCaseRoleType] = assignee ?? "";
        acc[activity.leadId] = leadAssignments;
      }

      return acc;
    },
    {},
  );

  const latestLinkedEntityByLead = activities.reduce<Record<string, ClientCaseLink | null>>((acc, activity) => {
    if (activity.kind !== "note" || !activity.body.startsWith(CASE_LINK_PREFIX)) {
      return acc;
    }

    const payload = activity.body.replace(CASE_LINK_PREFIX, "").trim();
    try {
      const parsed = JSON.parse(payload) as ClientCaseLink | null;
      if (!(activity.leadId in acc)) {
        if (parsed === null) {
          acc[activity.leadId] = null;
          return acc;
        }
      }
      if (!(activity.leadId in acc) && parsed?.kind && parsed?.id && parsed?.label) {
        acc[activity.leadId] = parsed;
      }
    } catch {
      // Ignore malformed historical payloads.
    }

    return acc;
  }, {});

  const latestDeliveryReadinessByLead = activities.reduce<Record<string, DeliveryReadiness | null>>((acc, activity) => {
    if (activity.kind !== "note" || !activity.body.startsWith(DELIVERY_READINESS_PREFIX)) {
      return acc;
    }

    const payload = activity.body.replace(DELIVERY_READINESS_PREFIX, "").trim();
    try {
      const parsed = JSON.parse(payload) as DeliveryReadiness | null;
      if (!(activity.leadId in acc)) {
        acc[activity.leadId] = parsed;
      }
    } catch {
      // Ignore malformed historical payloads.
    }

    return acc;
  }, {});

  const latestSiteTrackingByLead = activities.reduce<Record<string, SiteTracking | null>>((acc, activity) => {
    if (activity.kind !== "note" || !activity.body.startsWith(SITE_TRACKING_PREFIX)) {
      return acc;
    }

    const payload = activity.body.replace(SITE_TRACKING_PREFIX, "").trim();
    try {
      const parsed = JSON.parse(payload) as SiteTracking | null;
      if (!(activity.leadId in acc)) {
        acc[activity.leadId] = parsed;
      }
    } catch {
      // Ignore malformed historical payloads.
    }

    return acc;
  }, {});

  const latestCaseFilesByLead = activities.reduce<Record<string, ClientCaseFile[]>>((acc, activity) => {
    if (activity.kind !== "note" || !activity.body.startsWith(CASE_FILES_PREFIX)) {
      return acc;
    }

    const payload = activity.body.replace(CASE_FILES_PREFIX, "").trim();
    try {
      const parsed = JSON.parse(payload) as ClientCaseFile[];
      if (!(activity.leadId in acc)) {
        acc[activity.leadId] = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Ignore malformed historical payloads.
    }

    return acc;
  }, {});

  const projectOptions = projects.map((project) => ({
    id: project.id,
    label: project.name,
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

  const enrichedLeads = leads.map((lead) => ({
    ...lead,
    lostReason: latestLostReasonByLead[lead.id] ?? lead.lostReason,
    linkedEntity:
      lead.id in latestLinkedEntityByLead
        ? latestLinkedEntityByLead[lead.id] ?? undefined
        : lead.linkedEntity,
    deliveryReadiness:
      lead.id in latestDeliveryReadinessByLead
        ? latestDeliveryReadinessByLead[lead.id] ?? undefined
        : lead.deliveryReadiness,
    siteTracking:
      lead.id in latestSiteTrackingByLead
        ? latestSiteTrackingByLead[lead.id] ?? undefined
        : lead.siteTracking,
    caseFiles: lead.id in latestCaseFilesByLead ? latestCaseFilesByLead[lead.id] : lead.caseFiles,
    caseAssignments: caseRoles.map((role) => {
      const assignee =
        role === "sales"
          ? latestAssignmentsByLead[lead.id]?.[role] ?? lead.assignedTo ?? ""
          : latestAssignmentsByLead[lead.id]?.[role] ?? "";

      return {
        role,
        assignee: assignee || undefined,
        status: assignee ? "assigned" : "unassigned",
      } satisfies ClientCaseAssignment;
    }),
  }));

  const highPriority = enrichedLeads.filter((lead) => lead.priority === "high").length;
  const overdueFollowUps = enrichedLeads.filter(
    (lead) => !closedStages.has(lead.stage) && getLeadAgeInDays(lead) >= 2,
  ).length;
  const unassignedLeads = enrichedLeads.filter((lead) => !lead.assignedTo && !closedStages.has(lead.stage)).length;
  const closedWon = enrichedLeads.filter((lead) => lead.stage === "closed_won").length;
  const closedLost = enrichedLeads.filter((lead) => lead.stage === "closed_lost").length;

  const actionQueue = enrichedLeads
    .filter(
      (lead) =>
        !closedStages.has(lead.stage) &&
        (lead.priority === "high" || !lead.assignedTo || getLeadAgeInDays(lead) >= 2),
    )
    .sort((a, b) => {
      const scoreA =
        getLeadPriorityWeight(a) + (!a.assignedTo ? 3 : 0) + Math.min(getLeadAgeInDays(a), 4);
      const scoreB =
        getLeadPriorityWeight(b) + (!b.assignedTo ? 3 : 0) + Math.min(getLeadAgeInDays(b), 4);
      return scoreB - scoreA;
    })
    .slice(0, 6);

  const sourcePerformance = Array.from(
    enrichedLeads.reduce<
      Map<string, { source: string; total: number; open: number; hot: number; visits: number; won: number }>
    >((acc, lead) => {
      const source =
        lead.source?.trim() || pickAdminText(locale, "Direct / unknown", "مباشر / غير محدد");
      const current = acc.get(source) ?? { source, total: 0, open: 0, hot: 0, visits: 0, won: 0 };
      current.total += 1;
      if (!closedStages.has(lead.stage)) current.open += 1;
      if (lead.priority === "high") current.hot += 1;
      if (lead.stage === "site_visit") current.visits += 1;
      if (lead.stage === "closed_won") current.won += 1;
      acc.set(source, current);
      return acc;
    }, new Map()).values(),
  )
    .sort((a, b) => b.total - a.total || b.hot - a.hot)
    .slice(0, 5);

  const salesRepPerformance = users
    .filter((user) => user.status === "active")
    .map((user) => {
      const ownedLeads = enrichedLeads.filter((lead) => lead.assignedTo === user.fullName);
      return {
        id: user.id,
        fullName: user.fullName,
        active: ownedLeads.filter((lead) => !closedStages.has(lead.stage)).length,
        hot: ownedLeads.filter((lead) => !closedStages.has(lead.stage) && lead.priority === "high").length,
        visits: ownedLeads.filter((lead) => lead.stage === "site_visit").length,
        won: ownedLeads.filter((lead) => lead.stage === "closed_won").length,
      };
    })
    .sort((a, b) => b.active - a.active || b.won - a.won || b.visits - a.visits)
    .slice(0, 5);

  const lostReasonsSummary = Array.from(
    enrichedLeads
      .filter((lead) => lead.stage === "closed_lost" && lead.lostReason?.trim())
      .reduce<Map<string, { label: string; count: number }>>((acc, lead) => {
        const label = lead.lostReason!.trim();
        const current = acc.get(label) ?? { label, count: 0 };
        current.count += 1;
        acc.set(label, current);
        return acc;
      }, new Map())
      .values(),
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const ownerCases = enrichedLeads.filter((lead) => !closedStages.has(lead.stage));
  const activeExecutionCases = ownerCases.filter(
    (lead) =>
      (lead.deliveryReadiness?.status === "in_progress" ||
        (lead.siteTracking?.progressPercent ?? 0) > 0) &&
      (lead.siteTracking?.progressPercent ?? 0) < 100,
  );
  const blockedExecutionCases = ownerCases.filter(
    (lead) =>
      lead.deliveryReadiness?.status === "blocked" ||
      Boolean(lead.siteTracking?.blocker?.trim()),
  );
  const missingExecutionLinkCases = ownerCases.filter((lead) => !lead.linkedEntity);
  const trackedSiteCases = ownerCases.filter((lead) => typeof lead.siteTracking?.progressPercent === "number");
  const averageSiteProgress = trackedSiteCases.length
    ? Math.round(
        trackedSiteCases.reduce((sum, lead) => sum + (lead.siteTracking?.progressPercent ?? 0), 0) /
          trackedSiteCases.length,
      )
    : 0;
  const readyButQuietCases = ownerCases.filter(
    (lead) =>
      lead.deliveryReadiness?.status === "ready_for_delivery" &&
      !lead.siteTracking,
  );
  const docsNotReadyCases = ownerCases.filter(
    (lead) => lead.deliveryReadiness && !lead.deliveryReadiness.checklist.docsReady,
  );
  const casesWithFiles = ownerCases.filter((lead) => (lead.caseFiles?.length ?? 0) > 0);
  const totalCaseFiles = ownerCases.reduce((sum, lead) => sum + (lead.caseFiles?.length ?? 0), 0);
  const pendingDocumentReviews = ownerCases.reduce(
    (sum, lead) =>
      sum + (lead.caseFiles?.filter((file) => file.approvalStatus === "submitted").length ?? 0),
    0,
  );
  const rejectedDocuments = ownerCases.reduce(
    (sum, lead) => sum + (lead.caseFiles?.filter((file) => file.approvalStatus === "rejected").length ?? 0),
    0,
  );

  const ownerAttentionQueue = ownerCases
    .map((lead) => {
      const submittedDocs = lead.caseFiles?.filter((file) => file.approvalStatus === "submitted").length ?? 0;
      const rejectedDocs = lead.caseFiles?.filter((file) => file.approvalStatus === "rejected").length ?? 0;
      let score = getLeadPriorityWeight(lead);
      if (!lead.linkedEntity) score += 3;
      if (!lead.assignedTo) score += 3;
      if (lead.deliveryReadiness?.status === "blocked" || lead.siteTracking?.blocker) score += 5;
      if (lead.deliveryReadiness?.status === "ready_for_delivery" && !lead.siteTracking) score += 3;
      if (lead.deliveryReadiness && !lead.deliveryReadiness.checklist.docsReady) score += 2;
      if (submittedDocs > 0) score += Math.min(submittedDocs, 3);
      if (rejectedDocs > 0) score += 4;
      if ((lead.siteTracking?.progressPercent ?? 0) > 0 && (lead.siteTracking?.progressPercent ?? 0) < 40) score += 1;
      return { lead, score, submittedDocs, rejectedDocs };
    })
    .filter(({ score }) => score >= 5)
    .sort((a, b) => b.score - a.score || getLeadAgeInDays(b.lead) - getLeadAgeInDays(a.lead))
    .slice(0, 6);

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Operations Hub", "مركز العمليات")}
      description={pickAdminText(
        locale,
        "Client cases, sales follow-up, and first delivery readiness signals in one organized workspace.",
        "ملفات العملاء، والمتابعة التجارية، وإشارات الجاهزية الأولى للتنفيذ داخل مساحة عمل واحدة منظمة.",
      )}
    >
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <div className="admin-shell-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              {pickAdminText(locale, "Open client cases", "ملفات عملاء مفتوحة")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold tabular-nums text-white">
              {clientCaseSnapshot.openCases}
            </strong>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-red-400 font-medium">
              {pickAdminText(locale, "Needs assignment", "يحتاج إسناد")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold tabular-nums text-white">
              {clientCaseSnapshot.unassignedCases}
            </strong>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              {pickAdminText(locale, "Ready for delivery", "جاهز للتسليم للتنفيذ")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold tabular-nums text-white">
              {clientCaseSnapshot.deliveryReadyCases}
            </strong>
          </div>
          <div className="admin-shell-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-orange-400 font-medium">
              {pickAdminText(locale, "Blocked cases", "ملفات متعثرة")}
            </p>
            <strong className="mt-2 block text-3xl font-semibold tabular-nums text-white">
              {clientCaseSnapshot.blockedCases}
            </strong>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="admin-shell-panel p-5">
            <p className="text-[11px] uppercase tracking-wider text-[#f2c16b] font-medium">
              {pickAdminText(locale, "Owner readings", "قراءات المالك")}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {pickAdminText(locale, "Where owner attention is needed", "أين يحتاج العمل إلى تدخلك الآن")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/50">
                  {pickAdminText(locale, "Active execution", "تنفيذ جارٍ")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{activeExecutionCases.length}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/50">
                  {pickAdminText(locale, "Blocked sites", "مواقع متعثرة")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-rose-300">{blockedExecutionCases.length}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/50">
                  {pickAdminText(locale, "Average progress", "متوسط التقدم")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{averageSiteProgress}%</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/50">
                  {pickAdminText(locale, "Missing execution link", "بدون ربط تنفيذي")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-amber-200">{missingExecutionLinkCases.length}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {pickAdminText(locale, "Ready but quiet", "جاهز لكن بلا نبضة تنفيذ")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{readyButQuietCases.length}</p>
                <p className="mt-2 text-sm text-white/58">
                  {pickAdminText(
                    locale,
                    "Cases marked ready for delivery without any site update yet.",
                    "ملفات جاهزة للتنفيذ لكن بدون أي تحديث موقع حتى الآن.",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {pickAdminText(locale, "Docs not ready", "المستندات غير جاهزة")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{docsNotReadyCases.length}</p>
                <p className="mt-2 text-sm text-white/58">
                  {pickAdminText(
                    locale,
                    "Files or approvals are still missing before clean execution handoff.",
                    "لا تزال هناك ملفات أو اعتمادات ناقصة قبل تسليم التنفيذ بشكل نظيف.",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {pickAdminText(locale, "Tracked sites", "مواقع تحت التتبع")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{trackedSiteCases.length}</p>
                <p className="mt-2 text-sm text-white/58">
                  {pickAdminText(
                    locale,
                    "Client cases that already carry field progress updates.",
                    "ملفات العملاء التي لديها بالفعل تحديثات تقدم ميدانية.",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {pickAdminText(locale, "Case files", "ملفات العملاء")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{totalCaseFiles}</p>
                <p className="mt-2 text-sm text-white/58">
                  {pickAdminText(
                    locale,
                    `${casesWithFiles.length} case(s) already have attached documents.`,
                    `${casesWithFiles.length} ملف/ملفات لديها مستندات مرتبطة بالفعل.`,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {pickAdminText(locale, "Pending review", "بانتظار المراجعة")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{pendingDocumentReviews}</p>
                <p className="mt-2 text-sm text-white/58">
                  {pickAdminText(
                    locale,
                    "Submitted documents waiting for approval.",
                    "مستندات مرفوعة وتنتظر الاعتماد.",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {pickAdminText(locale, "Rejected docs", "مستندات مرفوضة")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-rose-300">{rejectedDocuments}</p>
                <p className="mt-2 text-sm text-white/58">
                  {pickAdminText(
                    locale,
                    "Documents that need replacement or correction.",
                    "مستندات تحتاج استبدالًا أو تصحيحًا.",
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="admin-shell-panel p-5">
            <p className="text-[11px] uppercase tracking-wider text-[#f2c16b] font-medium">
              {pickAdminText(locale, "Immediate intervention", "تدخل فوري")}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {pickAdminText(locale, "Cases that need a decision", "ملفات تحتاج قرارًا أو متابعة مباشرة")}
            </h2>
            <div className="mt-4 grid gap-3">
              {ownerAttentionQueue.length ? (
                ownerAttentionQueue.map(({ lead, score, submittedDocs, rejectedDocs }) => (
                  <div key={lead.id} className="admin-shell-muted-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{lead.fullName}</p>
                        <p className="mt-1 text-xs text-white/52">
                          {lead.linkedEntity
                            ? lead.linkedEntity.kind === "project"
                              ? pickAdminText(locale, `Project: ${lead.linkedEntity.label}`, `المشروع: ${lead.linkedEntity.label}`)
                              : pickAdminText(locale, `Service: ${lead.linkedEntity.label}`, `الخدمة: ${lead.linkedEntity.label}`)
                            : pickAdminText(locale, "No linked project or service yet", "لا يوجد مشروع أو خدمة مرتبطة بعد")}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                        {pickAdminText(locale, `Score ${score}`, `درجة ${score}`)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {lead.deliveryReadiness ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/72">
                          {pickAdminText(
                            locale,
                            `Delivery: ${getDeliveryStatusLabel(lead.deliveryReadiness.status, "en")}`,
                            `التنفيذ: ${getDeliveryStatusLabel(lead.deliveryReadiness.status, "ar")}`,
                          )}
                        </span>
                      ) : null}
                      {lead.siteTracking ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/72">
                          {pickAdminText(
                            locale,
                            `${lead.siteTracking.progressPercent}% progress`,
                            `${lead.siteTracking.progressPercent}% تقدم`,
                          )}
                        </span>
                      ) : null}
                      {!lead.assignedTo ? (
                        <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[11px] text-rose-200">
                          {pickAdminText(locale, "Missing case owner", "لا يوجد مسؤول للملف")}
                        </span>
                      ) : null}
                      {submittedDocs ? (
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-100">
                          {pickAdminText(locale, `${submittedDocs} doc(s) need review`, `${submittedDocs} مستند بانتظار المراجعة`)}
                        </span>
                      ) : null}
                      {rejectedDocs ? (
                        <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[11px] text-rose-100">
                          {pickAdminText(locale, `${rejectedDocs} rejected doc(s)`, `${rejectedDocs} مستند مرفوض`)}
                        </span>
                      ) : null}
                    </div>

                    <ul className="mt-3 grid gap-2 text-sm text-white/68">
                      {lead.siteTracking?.blocker ? (
                        <li>
                          {pickAdminText(locale, `Blocker: ${lead.siteTracking.blocker}`, `العائق: ${lead.siteTracking.blocker}`)}
                        </li>
                      ) : null}
                      {!lead.linkedEntity ? (
                        <li>
                          {pickAdminText(
                            locale,
                            "Execution path still not linked to a project or service.",
                            "مسار التنفيذ لم يُربط بعد بمشروع أو خدمة.",
                          )}
                        </li>
                      ) : null}
                      {lead.deliveryReadiness && !lead.deliveryReadiness.checklist.docsReady ? (
                        <li>
                          {pickAdminText(
                            locale,
                            "Documents or approvals are still incomplete.",
                            "الملفات أو الاعتمادات ما زالت غير مكتملة.",
                          )}
                        </li>
                      ) : null}
                      {submittedDocs ? (
                        <li>
                          {pickAdminText(
                            locale,
                            "There are uploaded documents waiting for owner approval.",
                            "يوجد مستندات مرفوعة تنتظر اعتماد المالك.",
                          )}
                        </li>
                      ) : null}
                      {rejectedDocs ? (
                        <li>
                          {pickAdminText(
                            locale,
                            "Some documents were rejected and need replacement or correction.",
                            "بعض المستندات مرفوضة وتحتاج استبدال أو تصحيح.",
                          )}
                        </li>
                      ) : null}
                      {lead.deliveryReadiness?.status === "ready_for_delivery" && !lead.siteTracking ? (
                        <li>
                          {pickAdminText(
                            locale,
                            "Ready for delivery but the site has not started reporting yet.",
                            "جاهز للتنفيذ لكن الموقع لم يبدأ إرسال تحديثات بعد.",
                          )}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
                  {pickAdminText(
                    locale,
                    "No urgent owner interventions are standing out right now.",
                    "لا توجد ملفات حرجة تحتاج تدخلك الفوري الآن.",
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <div className="admin-shell-panel p-5">
            <p className="text-[11px] uppercase tracking-wider text-[#f2c16b] font-medium">
              {pickAdminText(locale, "Case health", "صحة ملفات العملاء")}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {pickAdminText(locale, "Today's case picture", "صورة الملفات اليوم")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/50">
                  {pickAdminText(locale, "Overdue follow-ups", "متابعات متأخرة")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{overdueFollowUps}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/50">
                  {pickAdminText(locale, "Cases without owner", "ملفات بدون مسؤول")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{unassignedLeads}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/50">
                  {pickAdminText(locale, "Won and ready for handoff", "رابح وجاهز للتسليم")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">{closedWon}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs text-white/50">
                  {pickAdminText(locale, "Lost or blocked", "خاسر أو متعثر")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-rose-300">{closedLost}</p>
              </div>
            </div>
          </div>

          <div className="admin-shell-panel p-5">
            <p className="text-[11px] uppercase tracking-wider text-[#f2c16b] font-medium">
              {pickAdminText(locale, "Source performance", "أداء المصادر")}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {pickAdminText(locale, "Where demand is coming from", "من أين يأتي الطلب")}
            </h2>
            <div className="mt-4 grid gap-3">
              {sourcePerformance.length ? (
                sourcePerformance.map((source) => (
                  <div key={source.source} className="admin-shell-muted-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{source.source}</p>
                      <span className="text-xs text-white/55">{source.total}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-white/5 px-2 py-2">
                        <p className="text-[10px] text-white/45">
                          {pickAdminText(locale, "Open", "مفتوح")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">{source.open}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-2 py-2">
                        <p className="text-[10px] text-white/45">
                          {pickAdminText(locale, "Hot", "ساخن")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-amber-200">{source.hot}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-2 py-2">
                        <p className="text-[10px] text-white/45">
                          {pickAdminText(locale, "Visits", "زيارات")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">{source.visits}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-2 py-2">
                        <p className="text-[10px] text-white/45">
                          {pickAdminText(locale, "Won", "رابح")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-300">{source.won}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
                  {pickAdminText(locale, "No source data available yet.", "لا توجد بيانات مصادر متاحة بعد.")}
                </div>
              )}
            </div>
          </div>

          <div className="admin-shell-panel p-5">
            <p className="text-[11px] uppercase tracking-wider text-[#f2c16b] font-medium">
              {pickAdminText(locale, "Sales rep performance", "أداء فريق المبيعات")}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {pickAdminText(locale, "Assignment load and outcomes", "حمل التعيين والنتائج")}
            </h2>
            <div className="mt-4 grid gap-3">
              {salesRepPerformance.length ? (
                salesRepPerformance.map((rep) => (
                  <div key={rep.id} className="admin-shell-muted-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{rep.fullName}</p>
                      <span className="text-xs text-white/55">
                        {rep.active} {pickAdminText(locale, "active", "نشط")}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-white/5 px-2 py-2">
                        <p className="text-[10px] text-white/45">
                          {pickAdminText(locale, "Hot", "ساخن")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-amber-200">{rep.hot}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-2 py-2">
                        <p className="text-[10px] text-white/45">
                          {pickAdminText(locale, "Visits", "زيارات")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">{rep.visits}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-2 py-2">
                        <p className="text-[10px] text-white/45">
                          {pickAdminText(locale, "Won", "رابح")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-300">{rep.won}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
                  {pickAdminText(locale, "No active sales users found.", "لا يوجد أعضاء مبيعات نشطون حاليًا.")}
                </div>
              )}
            </div>
          </div>
        </section>

        <LeadPipelineBoard
          initialLeads={enrichedLeads}
          users={users.filter((user) => user.status === "active")}
          projectOptions={projectOptions}
          serviceOptions={serviceOptions}
        />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_420px]">
          <div className="admin-shell-panel overflow-hidden">
            <div className="border-b border-neutral-800 px-5 py-4">
              <h2 className="text-base font-semibold text-white">
                {pickAdminText(locale, "Activity", "النشاط المكتمل")}
              </h2>
            </div>

            <div className="divide-y divide-neutral-800">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex justify-between gap-4 p-5">
                    <div className="flex flex-col gap-2">
                      <span className="w-max rounded-sm border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                        {translateDbText(locale, activity.kind.replace("_", " "))}
                      </span>
                      <p className="text-sm font-medium text-white">{activity.body}</p>
                      <p className="text-[11px] text-neutral-500">
                        {pickAdminText(locale, "By", "بواسطة")}{" "}
                        <span className="text-white">{activity.createdBy}</span>
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-neutral-500">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-5 text-sm text-white/55">
                  {pickAdminText(locale, "No operations activity recorded yet.", "لا توجد أحداث تشغيلية حتى الآن.")}
                </div>
              )}
            </div>
          </div>

          <div className="admin-shell-panel p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#f2c16b]">
              {pickAdminText(locale, "Lost reasons", "أسباب الخسارة")}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {pickAdminText(locale, "Why cases are dropping", "لماذا تتعثر أو تسقط الملفات")}
            </h2>
            <div className="mt-4 grid gap-3">
              {lostReasonsSummary.length ? (
                lostReasonsSummary.map((reason) => (
                  <div key={reason.label} className="admin-shell-muted-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-6 text-white">{reason.label}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                        {reason.count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
                  {pickAdminText(locale, "No lost reasons have been captured yet.", "لم يتم تسجيل أسباب خسارة بعد.")}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </SaaSPageShell>
  );
}
