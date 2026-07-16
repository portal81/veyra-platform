"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type {
  ClientCaseAssignment,
  ClientCaseLink,
  ClientCaseRoleType,
  DeliverySiteState,
  DeliveryReadiness,
  SiteTracking,
  TeamUser,
} from "@/lib/types";

type ClientCaseTeamEditorProps = {
  leadId: string;
  users: TeamUser[];
  projectOptions: Array<{
    id: string;
    label: string;
    siteState: DeliverySiteState;
    progressPercent: number;
    currentPhase: string;
    operationsNote?: string;
  }>;
  serviceOptions: Array<{ id: string; label: string; serviceType: string }>;
  initialAssignments: ClientCaseAssignment[];
  focusRole?: ClientCaseRoleType;
  initialLinkedEntity?: ClientCaseLink;
  initialDeliveryReadiness?: DeliveryReadiness;
  initialSiteTracking?: SiteTracking;
};

const caseRoleMeta: Array<{
  role: ClientCaseRoleType;
  label: string;
  labelAr: string;
  helper: string;
  helperAr: string;
  userRoles: TeamUser["role"][];
}> = [
  {
    role: "sales",
    label: "Sales owner",
    labelAr: "مسؤول المبيعات",
    helper: "Owns the commercial follow-up for this case.",
    helperAr: "يمسك المتابعة التجارية لهذا الملف.",
    userRoles: ["sales", "owner", "admin", "operations"],
  },
  {
    role: "operations",
    label: "Operations",
    labelAr: "العمليات",
    helper: "Coordinates handoff and cross-team readiness.",
    helperAr: "ينسق التسليم وجاهزية الفرق المختلفة.",
    userRoles: ["operations", "owner", "admin"],
  },
  {
    role: "engineer",
    label: "Engineer",
    labelAr: "المهندس",
    helper: "Owns technical readiness and execution guidance.",
    helperAr: "يمسك الجاهزية الفنية وتوجيه التنفيذ.",
    userRoles: ["engineer", "owner", "admin", "operations"],
  },
  {
    role: "worker",
    label: "Worker / Technician",
    labelAr: "العامل / الفني",
    helper: "Handles field execution or on-site follow-up.",
    helperAr: "يتابع التنفيذ الميداني أو الزيارة على الأرض.",
    userRoles: ["worker", "owner", "admin", "operations"],
  },
  {
    role: "lawyer",
    label: "Legal",
    labelAr: "القانوني",
    helper: "Covers contracts, review, and approvals.",
    helperAr: "يتابع العقود والمراجعة والموافقات.",
    userRoles: ["lawyer", "owner", "admin", "operations"],
  },
  {
    role: "accountant",
    label: "Accounting",
    labelAr: "المحاسبة",
    helper: "Tracks payment and finance preparation.",
    helperAr: "يتابع الدفع والتحضير المالي.",
    userRoles: ["accountant", "owner", "admin", "operations"],
  },
  {
    role: "marketer",
    label: "Marketing",
    labelAr: "التسويق",
    helper: "Keeps source, campaign, and demand context visible.",
    helperAr: "يحافظ على وضوح المصدر والحملة وسياق الطلب.",
    userRoles: ["marketer", "owner", "admin", "operations"],
  },
];

function normalizeAssignments(assignments?: ClientCaseAssignment[]) {
  return caseRoleMeta.map(({ role }) => {
    const existing = assignments?.find((item) => item.role === role);
    const assignee = existing?.assignee?.trim();
    return {
      role,
      assignee: assignee || undefined,
      status: assignee ? "assigned" : "unassigned",
    } satisfies ClientCaseAssignment;
  });
}

function getDefaultDeliveryReadiness(): DeliveryReadiness {
  return {
    status: "not_started",
    siteState: "not_started",
    checklist: {
      teamAssigned: false,
      projectLinked: false,
      commercialClosed: false,
      docsReady: false,
    },
  };
}

function getDefaultSiteTracking(): SiteTracking {
  return {
    progressPercent: 0,
    currentPhase: "Not started",
    lastUpdate: "",
    siteName: undefined,
    blocker: undefined,
    updatedBy: undefined,
  };
}

function getSiteStateLabel(status: DeliverySiteState, t: (en: string, ar: string) => string) {
  if (status === "existing") return t("Built / existing", "مبني / قائم");
  if (status === "under_construction") return t("Under construction", "تحت الإنشاء");
  return t("Not started", "لم يبدأ");
}

export function ClientCaseTeamEditor({
  leadId,
  users,
  projectOptions,
  serviceOptions,
  initialAssignments,
  focusRole,
  initialLinkedEntity,
  initialDeliveryReadiness,
  initialSiteTracking,
}: ClientCaseTeamEditorProps) {
  const { t } = useAdminLocale();
  const router = useRouter();
  const [assignments, setAssignments] = React.useState(() => normalizeAssignments(initialAssignments));
  const [linkedEntity, setLinkedEntity] = React.useState<ClientCaseLink | undefined>(initialLinkedEntity);
  const [deliveryReadiness, setDeliveryReadiness] = React.useState<DeliveryReadiness>(
    initialDeliveryReadiness ?? getDefaultDeliveryReadiness(),
  );
  const [siteTracking, setSiteTracking] = React.useState<SiteTracking>(
    initialSiteTracking ?? getDefaultSiteTracking(),
  );
  const [feedback, setFeedback] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setAssignments(normalizeAssignments(initialAssignments));
    setLinkedEntity(initialLinkedEntity);
    setDeliveryReadiness(initialDeliveryReadiness ?? getDefaultDeliveryReadiness());
    setSiteTracking(initialSiteTracking ?? getDefaultSiteTracking());
  }, [initialAssignments, initialDeliveryReadiness, initialLinkedEntity, initialSiteTracking]);

  const savePatch = async (payload: Record<string, unknown>, message: string) => {
    setIsSaving(true);
    setFeedback("");

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(json.message ?? t("Could not save changes.", "تعذر حفظ التغييرات."));
      }

      setFeedback(message);
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t("Could not save changes.", "تعذر حفظ التغييرات."));
    } finally {
      setIsSaving(false);
    }
  };

  const updateAssignment = (role: ClientCaseRoleType, assignee: string) => {
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.role === role
          ? {
              ...assignment,
              assignee: assignee || undefined,
              status: assignee ? "assigned" : "unassigned",
            }
          : assignment,
      ),
    );
  };

  const buildProjectOperationsPatch = (project: (typeof projectOptions)[number]) => {
    const nextLinkedEntity: ClientCaseLink = { kind: "project", id: project.id, label: project.label };
    const nextDeliveryReadiness: DeliveryReadiness = {
      ...deliveryReadiness,
      siteState: project.siteState,
      checklist: {
        ...deliveryReadiness.checklist,
        projectLinked: true,
      },
      note: project.operationsNote || deliveryReadiness.note,
    };
    const nextSiteTracking: SiteTracking = {
      ...siteTracking,
      siteName: project.label,
      progressPercent: project.progressPercent,
      currentPhase: project.currentPhase,
      lastUpdate: siteTracking.lastUpdate || project.operationsNote || `Project source: ${project.label}`,
    };

    return {
      linkedEntity: nextLinkedEntity,
      deliveryReadiness: nextDeliveryReadiness,
      siteTracking: nextSiteTracking,
    };
  };

  const applyProjectOperations = (project: (typeof projectOptions)[number]) => {
    const patch = buildProjectOperationsPatch(project);
    setLinkedEntity(patch.linkedEntity);
    setDeliveryReadiness(patch.deliveryReadiness);
    setSiteTracking(patch.siteTracking);
  };
  const selectedProjectSource =
    linkedEntity?.kind === "project" ? projectOptions.find((project) => project.id === linkedEntity.id) : undefined;

  return (
    <div className="mt-4 grid gap-4">
      {feedback ? (
        <p className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-3 text-sm text-brand-gold">
          {feedback}
        </p>
      ) : null}

      <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-white/55">
        {t(
          "Owner readings above update after saving this section.",
          "قراءات المالك بالأعلى تتحدث بعد حفظ هذا القسم.",
        )}
      </p>

      <div id="case-team-assignments" className="admin-shell-muted-card scroll-mt-6 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
              {t("Case team", "فريق الملف")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {t("Multi-role assignments", "إسناد الأدوار")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => void savePatch({ caseAssignments: assignments }, t("Case team saved.", "تم حفظ فريق الملف."))}
            disabled={isSaving}
            className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d] disabled:opacity-50"
          >
            {t("Save case team", "حفظ فريق الملف")}
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {caseRoleMeta.map((meta) => {
            const assignment = assignments.find((item) => item.role === meta.role);
            const roleUsers = users.filter((user) => meta.userRoles.includes(user.role));

            return (
              <div
                key={meta.role}
                id={focusRole === meta.role ? "first-unassigned-role" : `case-role-${meta.role}`}
                className="grid scroll-mt-6 gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[minmax(0,1fr)_250px] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{t(meta.label, meta.labelAr)}</p>
                  <p className="mt-1 text-sm leading-6 text-white/58">{t(meta.helper, meta.helperAr)}</p>
                </div>
                <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {t("Assignee", "المسؤول")}
                  <select
                    value={assignment?.assignee ?? ""}
                    onChange={(event) => updateAssignment(meta.role, event.target.value)}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  >
                    <option value="">{t("Unassigned", "غير معين")}</option>
                    {roleUsers.map((user) => (
                      <option key={`${meta.role}-${user.id}`} value={user.fullName}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div id="execution-link" className="admin-shell-muted-card scroll-mt-6 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
              {t("Execution link", "ربط التنفيذ")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {t("Project or service connection", "ربط المشروع أو الخدمة")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() =>
              void savePatch(
                { linkedEntity: linkedEntity ?? null, deliveryReadiness, siteTracking },
                t("Execution link saved.", "تم حفظ ربط التنفيذ."),
              )
            }
            disabled={isSaving}
            className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d] disabled:opacity-50"
          >
            {t("Save execution link", "حفظ ربط التنفيذ")}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
            {t("Linked project", "المشروع المرتبط")}
            <select
              value={linkedEntity?.kind === "project" ? linkedEntity.id : ""}
              onChange={(event) => {
                const project = projectOptions.find((item) => item.id === event.target.value);
                if (project) {
                  applyProjectOperations(project);
                } else {
                  setLinkedEntity(undefined);
                }
              }}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            >
              <option value="">{t("No linked project", "بدون مشروع مرتبط")}</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.label}
                </option>
              ))}
            </select>
          </label>

          {selectedProjectSource ? (
            <div className="grid gap-3 rounded-2xl border border-brand-gold/20 bg-brand-gold/10 p-4 text-sm text-brand-gold">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold/75">
                  {t("Project source", "مصدر المشروع")}
                </p>
                <p className="mt-1 font-semibold">
                  {getSiteStateLabel(selectedProjectSource.siteState, t)} - {selectedProjectSource.progressPercent}%
                </p>
                <p className="mt-1 text-xs text-brand-gold/75">
                  {selectedProjectSource.currentPhase}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const patch = buildProjectOperationsPatch(selectedProjectSource);
                  setLinkedEntity(patch.linkedEntity);
                  setDeliveryReadiness(patch.deliveryReadiness);
                  setSiteTracking(patch.siteTracking);
                  void savePatch(patch, t("Project source synced and saved.", "تمت مزامنة وحفظ بيانات المشروع."));
                }}
                disabled={isSaving}
                className="rounded-full border border-brand-gold/30 px-3 py-2 text-xs font-semibold text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50"
              >
                {t("Sync from project", "مزامنة من المشروع")}
              </button>
            </div>
          ) : null}

          <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
            {t("Linked service item", "عنصر الخدمة المرتبط")}
            <select
              value={linkedEntity?.kind === "service" ? linkedEntity.id : ""}
              onChange={(event) => {
                const service = serviceOptions.find((item) => item.id === event.target.value);
                setLinkedEntity(
                  service
                    ? { kind: "service", id: service.id, label: service.label, serviceType: service.serviceType }
                    : undefined,
                );
              }}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            >
              <option value="">{t("No linked service item", "بدون عنصر خدمة مرتبط")}</option>
              {serviceOptions.map((service) => (
                <option key={`${service.serviceType}-${service.id}`} value={service.id}>
                  {service.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div id="delivery-readiness" className="admin-shell-muted-card scroll-mt-6 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
              {t("Delivery readiness", "جاهزية التنفيذ")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {t("First execution checkpoint", "أول نقطة جاهزية للتنفيذ")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() =>
              void savePatch(
                { deliveryReadiness },
                t("Delivery readiness saved.", "تم حفظ جاهزية التنفيذ."),
              )
            }
            disabled={isSaving}
            className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d] disabled:opacity-50"
          >
            {t("Save readiness", "حفظ الجاهزية")}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
            {t("Delivery status", "حالة التنفيذ")}
            <select
              value={deliveryReadiness.status}
              onChange={(event) =>
                setDeliveryReadiness((current) => ({
                  ...current,
                  status: event.target.value as DeliveryReadiness["status"],
                }))
              }
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            >
              <option value="not_started">{t("Not started", "لم يبدأ")}</option>
              <option value="needs_assignment">{t("Needs assignment", "يحتاج إسناد")}</option>
              <option value="ready_for_delivery">{t("Ready for delivery", "جاهز للتنفيذ")}</option>
              <option value="in_progress">{t("In progress", "جار التنفيذ")}</option>
              <option value="blocked">{t("Blocked", "متعثر")}</option>
              <option value="completed">{t("Completed", "مكتمل")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
            {t("Site state", "حالة الموقع")}
            <select
              value={deliveryReadiness.siteState}
              onChange={(event) =>
                setDeliveryReadiness((current) => ({
                  ...current,
                  siteState: event.target.value as DeliveryReadiness["siteState"],
                }))
              }
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            >
              <option value="not_started">{t("Not started", "لم يبدأ")}</option>
              <option value="existing">{t("Existing site", "موقع قائم")}</option>
              <option value="under_construction">{t("Under construction", "تحت الإنشاء")}</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["teamAssigned", "Team assigned", "الفريق معين"],
              ["projectLinked", "Project or service linked", "المشروع أو الخدمة مربوط"],
              ["commercialClosed", "Commercial side closed", "الجانب التجاري مقفول"],
              ["docsReady", "Documents ready", "المستندات جاهزة"],
            ] as const
          ).map(([key, label, labelAr]) => (
            <label key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/82">
              <span className="flex items-center justify-between gap-3">
                {t(label, labelAr)}
                <input
                  type="checkbox"
                  checked={deliveryReadiness.checklist[key]}
                  onChange={(event) =>
                    setDeliveryReadiness((current) => ({
                      ...current,
                      checklist: {
                        ...current.checklist,
                        [key]: event.target.checked,
                      },
                    }))
                  }
                />
              </span>
            </label>
          ))}
        </div>

        <label className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
          {t("Readiness note", "ملاحظة الجاهزية")}
          <textarea
            value={deliveryReadiness.note ?? ""}
            onChange={(event) =>
              setDeliveryReadiness((current) => ({ ...current, note: event.target.value || undefined }))
            }
            rows={3}
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
            placeholder={t("What is missing before execution starts?", "ما الذي ينقص قبل بدء التنفيذ؟")}
          />
        </label>
      </div>

      <div className="admin-shell-muted-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
              {t("Site tracking", "متابعة الموقع")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {t("Live delivery pulse", "نبض التنفيذ الحالي")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() =>
              void savePatch(
                { siteTracking },
                t("Site update saved.", "تم حفظ تحديث الموقع."),
              )
            }
            disabled={isSaving}
            className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d] disabled:opacity-50"
          >
            {t("Save site update", "حفظ تحديث الموقع")}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
            {t("Site name", "اسم الموقع")}
            <input
              value={siteTracking.siteName ?? ""}
              onChange={(event) => setSiteTracking((current) => ({ ...current, siteName: event.target.value || undefined }))}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
              placeholder={t("Site or location name", "اسم الموقع أو المكان")}
            />
          </label>

          <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
            {t("Current phase", "المرحلة الحالية")}
            <input
              value={siteTracking.currentPhase}
              onChange={(event) => setSiteTracking((current) => ({ ...current, currentPhase: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
              placeholder={t("Survey, contract, finishing...", "معاينة، عقد، تشطيب...")}
            />
          </label>

          <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
            {t("Progress percent", "نسبة التقدم")}
            <input
              type="number"
              min={0}
              max={100}
              value={siteTracking.progressPercent}
              onChange={(event) =>
                setSiteTracking((current) => ({
                  ...current,
                  progressPercent: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                }))
              }
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
            />
          </label>

          <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
            {t("Updated by", "تم التحديث بواسطة")}
            <input
              value={siteTracking.updatedBy ?? ""}
              onChange={(event) => setSiteTracking((current) => ({ ...current, updatedBy: event.target.value || undefined }))}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
              placeholder={t("Engineer, worker, operations...", "مهندس، فني، عمليات...")}
            />
          </label>
        </div>

        <label className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
          {t("Last update", "آخر تحديث")}
          <textarea
            value={siteTracking.lastUpdate}
            onChange={(event) => setSiteTracking((current) => ({ ...current, lastUpdate: event.target.value }))}
            rows={3}
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
            placeholder={t("What happened on site today?", "ماذا حدث في الموقع اليوم؟")}
          />
        </label>

        <label className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
          {t("Blocker", "العائق")}
          <textarea
            value={siteTracking.blocker ?? ""}
            onChange={(event) => setSiteTracking((current) => ({ ...current, blocker: event.target.value || undefined }))}
            rows={2}
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
            placeholder={t("Leave empty if no blocker exists", "اتركه فارغًا إذا لم يوجد عائق")}
          />
        </label>
      </div>
    </div>
  );
}
