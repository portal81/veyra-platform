import React from "react";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type {
  ClientCaseAssignment,
  ClientCaseFile,
  ClientCaseFileApprovalStatus,
  ClientCaseDocumentType,
  ClientCaseLink,
  ClientCaseRoleType,
  DeliveryReadiness,
  Lead,
  LeadPriority,
  LeadStage,
  SiteTracking,
  TeamUser,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

type LeadQuickEditDrawerProps = {
  quickEditLead: Lead | null;
  drawerMode: "overview" | "team" | "files";
  users: TeamUser[];
  projectOptions: Array<{ id: string; label: string }>;
  serviceOptions: Array<{ id: string; label: string; serviceType: string }>;
  onClose: () => void;
  updateLead: (id: string, payload: any) => void;
  advanceToNextStage: (lead: Lead) => void;
  drawerFeedback: string;
  setDrawerFeedback: (msg: string) => void;
  quickEditLeadTimeline: Array<{ id: string; body: string; at: string }>;
  noteDrafts: Record<string, string>;
  setNoteDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  lostReasonDrafts: Record<string, string>;
  setLostReasonDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  stages: Array<{ id: string; label: string; labelAr: string }>;
  priorities: LeadPriority[];
};

function getLeadAgeInDays(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function getLeadSlaState(lead: Lead) {
  if (lead.stage === "closed_won" || lead.stage === "closed_lost") {
    return "closed" as const;
  }
  const age = getLeadAgeInDays(lead.createdAt);
  if (age >= 3) return "critical" as const;
  if (age >= 2) return "warning" as const;
  return "healthy" as const;
}

function getLeadNextAction(lead: Lead, t: (en: string, ar: string) => string) {
  if (lead.stage === "new") {
    return t("Assign owner and start first contact.", "عيّن مسؤولًا وابدأ أول اتصال.");
  }
  if (lead.stage === "contacted") {
    return t("Confirm budget, need, and timing.", "أكد الميزانية والاحتياج وتوقيت القرار.");
  }
  if (lead.stage === "qualified") {
    return t("Book visit or consultation and confirm attendance.", "احجز الزيارة أو الاستشارة وأكد الحضور.");
  }
  if (lead.stage === "site_visit") {
    return t("Send recap, answer objections, and move toward offer.", "أرسل ملخص الزيارة ورد على الاعتراضات وادفع نحو العرض.");
  }
  if (lead.stage === "negotiation") {
    return t("Push for close or capture the real blocker.", "ادفع نحو الإغلاق أو سجّل سبب التعطيل الحقيقي.");
  }
  if (lead.stage === "closed_won") {
    return t("Complete handover and document the winning pattern.", "أكمل التسليم وسجّل نمط كسب الصفقة.");
  }
  return t("Capture the lost reason and review source quality.", "سجّل سبب الخسارة وراجع جودة المصدر.");
}

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

const documentTypeOptions: Array<{ id: ClientCaseDocumentType; label: string; labelAr: string }> = [
  { id: "contract", label: "Contract", labelAr: "عقد" },
  { id: "quotation", label: "Quotation", labelAr: "عرض سعر" },
  { id: "invoice", label: "Invoice", labelAr: "فاتورة" },
  { id: "receipt", label: "Receipt", labelAr: "إيصال" },
  { id: "drawing", label: "Drawing", labelAr: "رسم هندسي" },
  { id: "site_photo", label: "Site photo", labelAr: "صورة موقع" },
  { id: "legal_doc", label: "Legal document", labelAr: "مستند قانوني" },
  { id: "delivery_report", label: "Delivery report", labelAr: "تقرير تنفيذ" },
  { id: "other", label: "Other", labelAr: "أخرى" },
];

const approvalStatusOptions: Array<{ id: ClientCaseFileApprovalStatus; label: string; labelAr: string }> = [
  { id: "draft", label: "Draft", labelAr: "مسودة" },
  { id: "submitted", label: "Submitted", labelAr: "مرفوع للمراجعة" },
  { id: "approved", label: "Approved", labelAr: "معتمد" },
  { id: "rejected", label: "Rejected", labelAr: "مرفوض" },
];

function getFileStatusTone(status: ClientCaseFileApprovalStatus) {
  if (status === "approved") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "rejected") return "border-rose-400/20 bg-rose-400/10 text-rose-100";
  if (status === "submitted") return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-white/10 bg-white/5 text-white/65";
}

function normalizeCaseAssignments(assignments?: ClientCaseAssignment[]) {
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

export function LeadQuickEditDrawer({
  quickEditLead,
  drawerMode,
  users,
  projectOptions,
  serviceOptions,
  onClose,
  updateLead,
  advanceToNextStage,
  drawerFeedback,
  setDrawerFeedback,
  quickEditLeadTimeline,
  noteDrafts,
  setNoteDrafts,
  lostReasonDrafts,
  setLostReasonDrafts,
  stages,
  priorities,
}: LeadQuickEditDrawerProps) {
  const { t } = useAdminLocale();
  const [assignmentDrafts, setAssignmentDrafts] = React.useState<ClientCaseAssignment[]>([]);
  const [linkedEntityDraft, setLinkedEntityDraft] = React.useState<ClientCaseLink | undefined>();
  const [deliveryReadinessDraft, setDeliveryReadinessDraft] = React.useState<DeliveryReadiness | undefined>();
  const [siteTrackingDraft, setSiteTrackingDraft] = React.useState<SiteTracking | undefined>();
  const [caseFileDrafts, setCaseFileDrafts] = React.useState<ClientCaseFile[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = React.useState(false);
  const [newCaseFile, setNewCaseFile] = React.useState({
    displayName: "",
    documentType: "contract" as ClientCaseDocumentType,
    storagePath: "",
    approvalStatus: "submitted" as ClientCaseFileApprovalStatus,
    uploadedBy: "",
    linkedTo: "client_case" as NonNullable<ClientCaseFile["linkedTo"]>,
  });

  React.useEffect(() => {
    if (!quickEditLead) {
      setAssignmentDrafts([]);
      setLinkedEntityDraft(undefined);
      setDeliveryReadinessDraft(undefined);
      setSiteTrackingDraft(undefined);
      setCaseFileDrafts([]);
      return;
    }
    setAssignmentDrafts(normalizeCaseAssignments(quickEditLead.caseAssignments));
    setLinkedEntityDraft(quickEditLead.linkedEntity);
    setCaseFileDrafts(quickEditLead.caseFiles ?? []);
    setDeliveryReadinessDraft(
      quickEditLead.deliveryReadiness ?? {
        status: "not_started",
        siteState: "not_started",
        checklist: {
          teamAssigned: false,
          projectLinked: false,
          commercialClosed: quickEditLead.stage === "closed_won",
          docsReady: false,
        },
      },
    );
    setSiteTrackingDraft(
      quickEditLead.siteTracking ?? {
        progressPercent: 0,
        currentPhase: "Not started",
        lastUpdate: "",
        siteName: undefined,
        blocker: undefined,
        updatedBy: undefined,
      },
    );
  }, [quickEditLead]);

  if (!quickEditLead) return null;

  const slaState = getLeadSlaState(quickEditLead);
  const nextAction = getLeadNextAction(quickEditLead, t);
  const leadAge = getLeadAgeInDays(quickEditLead.createdAt);
  const assignedRolesCount = assignmentDrafts.filter((item) => item.assignee).length;
  const approvedFilesCount = caseFileDrafts.filter((file) => file.approvalStatus === "approved").length;
  const showOverviewSections = true;
  const showTeamSections = false;
  const showFileSections = false;

  const updateCaseFileDraft = (id: string, patch: Partial<ClientCaseFile>) => {
    setCaseFileDrafts((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const commitCaseFileDrafts = (nextFiles: ClientCaseFile[], message: string) => {
    setCaseFileDrafts(nextFiles);
    updateLead(quickEditLead.id, { caseFiles: nextFiles });
    setDrawerFeedback(message);
  };

  const commitCaseFileStatus = (id: string, approvalStatus: ClientCaseFileApprovalStatus) => {
    const nextFiles = caseFileDrafts.map((item) => (item.id === id ? { ...item, approvalStatus } : item));
    const message =
      approvalStatus === "approved"
        ? t("Document approved and saved.", "تم اعتماد المستند وحفظه.")
        : approvalStatus === "rejected"
          ? t("Document rejected and saved.", "تم رفض المستند وحفظه.")
          : t("Document sent to review and saved.", "تم إرسال المستند للمراجعة وحفظه.");

    commitCaseFileDrafts(nextFiles, message);
  };

  const updateAssignmentDraft = (role: ClientCaseRoleType, assignee: string) => {
    setAssignmentDrafts((current) =>
      current.map((item) =>
        item.role === role
          ? {
              ...item,
              assignee: assignee || undefined,
              status: assignee ? "assigned" : "unassigned",
            }
          : item,
      ),
    );
  };

  const addCaseFileDraft = () => {
    const displayName = newCaseFile.displayName.trim();
    const storagePath = newCaseFile.storagePath.trim();
    if (!displayName || !storagePath) {
      setDrawerFeedback(t("Add a document name and link/path first.", "أضف اسم المستند والرابط أو المسار أولًا."));
      return;
    }

    setCaseFileDrafts((current) => [
      {
        id: `case-file-${crypto.randomUUID()}`,
        displayName,
        documentType: newCaseFile.documentType,
        storagePath,
        approvalStatus: newCaseFile.approvalStatus,
        uploadedBy: newCaseFile.uploadedBy.trim() || undefined,
        linkedTo: newCaseFile.linkedTo,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setNewCaseFile({
      displayName: "",
      documentType: "contract",
      storagePath: "",
      approvalStatus: "submitted",
      uploadedBy: "",
      linkedTo: "client_case",
    });
    setDrawerFeedback("");
  };

  const inferDocumentType = (file: File): ClientCaseDocumentType => {
    const normalizedName = file.name.toLowerCase();
    if (file.type === "application/pdf" && normalizedName.includes("contract")) return "contract";
    if (normalizedName.includes("invoice")) return "invoice";
    if (normalizedName.includes("receipt")) return "receipt";
    if (normalizedName.includes("quote") || normalizedName.includes("quotation")) return "quotation";
    if (normalizedName.includes("drawing") || normalizedName.includes("plan")) return "drawing";
    if (file.type.startsWith("image/")) return "site_photo";
    if (normalizedName.includes("legal")) return "legal_doc";
    if (normalizedName.includes("report")) return "delivery_report";
    return "other";
  };

  const uploadCaseDocument = async (file: File) => {
    setIsUploadingDocument(true);
    setDrawerFeedback("");

    try {
      const formData = new FormData();
      formData.append("leadId", quickEditLead.id);
      formData.append("files", file);

      const response = await fetch("/api/admin/files", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as {
        files?: Array<{ url: string; path: string; name: string; mimeType: string; size: number }>;
        message?: string;
      };

      if (!response.ok || !json.files?.[0]) {
        throw new Error(json.message ?? t("Document upload failed.", "فشل رفع المستند."));
      }

      const uploaded = json.files[0];
      const uploadedCaseFile: ClientCaseFile = {
        id: `case-file-${crypto.randomUUID()}`,
        displayName: uploaded.name,
        documentType: inferDocumentType(file),
        storagePath: uploaded.url,
        approvalStatus: "submitted",
        uploadedBy: "Admin",
        linkedTo: "client_case",
        createdAt: new Date().toISOString(),
      };
      commitCaseFileDrafts(
        [uploadedCaseFile, ...caseFileDrafts],
        t("Document uploaded, attached, and sent to review.", "تم رفع المستند وربطه وإرساله للمراجعة."),
      );
    } catch (error) {
      setDrawerFeedback(error instanceof Error ? error.message : t("Document upload failed.", "فشل رفع المستند."));
    } finally {
      setIsUploadingDocument(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/55 p-4 md:items-center md:p-6">
      <div className="admin-shell-surface max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto p-5 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#f2c16b]">
              {t("Quick edit", "تعديل سريع")}
            </p>
            <h4 className="mt-2 font-serif text-2xl text-white">{quickEditLead.fullName}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-shell-button-ghost rounded-full px-3 py-2 text-xs text-white/70"
          >
            {t("Close", "إغلاق")}
          </button>
        </div>

        {drawerFeedback ? (
          <p className="admin-shell-muted-card mb-4 px-3 py-2 text-xs text-[#f2c16b]">{drawerFeedback}</p>
        ) : null}

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={`rounded-[18px] border p-4 ${
                slaState === "critical"
                  ? "border-rose-400/25 bg-rose-500/10"
                  : slaState === "warning"
                    ? "border-amber-400/25 bg-amber-500/10"
                    : slaState === "closed"
                      ? "border-white/12 bg-white/6"
                      : "border-emerald-400/20 bg-emerald-500/10"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{t("SLA status", "حالة المتابعة")}</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {slaState === "critical"
                  ? t("Critical follow-up", "متابعة حرجة")
                  : slaState === "warning"
                    ? t("Needs attention today", "تحتاج تدخل اليوم")
                    : slaState === "closed"
                      ? t("Closed stage", "مرحلة مغلقة")
                      : t("Within active window", "داخل نافذة المتابعة")}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/72">
                {slaState === "closed"
                  ? t("This lead is already closed.", "هذا العميل في مرحلة مغلقة بالفعل.")
                  : t(`${leadAge} day(s) since capture.`, `مر ${leadAge} يوم منذ دخول العميل.`)}
              </p>
            </div>

            <div className="admin-shell-muted-card p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{t("Next action", "الخطوة التالية")}</p>
              <p className="mt-2 text-sm leading-7 text-white/82">{nextAction}</p>
            </div>
          </div>

          <div className={showOverviewSections ? "admin-shell-panel grid gap-3 p-3 sm:grid-cols-2" : "hidden"}>
            <button
              type="button"
              onClick={() => advanceToNextStage(quickEditLead)}
              disabled={quickEditLead.stage === "closed_won" || quickEditLead.stage === "closed_lost"}
              className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Move to next stage", "نقل للمرحلة التالية")}
            </button>
            <button
              type="button"
              onClick={() => updateLead(quickEditLead.id, { stage: "closed_lost" })}
              disabled={quickEditLead.stage === "closed_lost"}
              className="rounded-full border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Mark as closed lost", "تعليم كمغلق خاسر")}
            </button>
          </div>

          <label className={showOverviewSections ? "grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42" : "hidden"}>
            {t("Stage", "المرحلة")}
            <select
              value={quickEditLead.stage}
              onChange={(event) => updateLead(quickEditLead.id, { stage: event.target.value as LeadStage })}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
            >
              {stages.map((option) => (
                <option key={option.id} value={option.id}>
                  {t(option.label, option.labelAr)}
                </option>
              ))}
            </select>
          </label>

          <div className={showOverviewSections ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
            <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
              {t("Priority", "الأولوية")}
              <select
                value={quickEditLead.priority}
                onChange={(event) => updateLead(quickEditLead.id, { priority: event.target.value as LeadPriority })}
                className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {t(priority, priority === "high" ? "عالي" : priority === "medium" ? "متوسط" : "منخفض")}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
              {t("Assigned to", "معين إلى")}
              <select
                value={quickEditLead.assignedTo ?? ""}
                onChange={(event) => updateLead(quickEditLead.id, { assignedTo: event.target.value || undefined })}
                className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">{t("Unassigned", "غير معين")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.fullName}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={showTeamSections ? "admin-shell-panel p-4" : "hidden"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">{t("Case team", "فريق الملف")}</p>
                <h5 className="mt-2 text-base font-semibold text-white">{t("Multi-role assignments", "إسناد الأدوار")}</h5>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {t(
                    "Connect this client case to the people who will sell, coordinate, approve, and deliver it.",
                    "اربط ملف العميل بالأشخاص الذين سيبيعونه وينسقونه ويعتمدونه وينفذونه.",
                  )}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">
                {t(`${assignedRolesCount} role(s) assigned`, `تم إسناد ${assignedRolesCount} دور/أدوار`)}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {caseRoleMeta.map((meta) => {
                const currentAssignment = assignmentDrafts.find((item) => item.role === meta.role);
                const roleUsers = users.filter((user) => meta.userRoles.includes(user.role));

                return (
                  <div
                    key={meta.role}
                    className="admin-shell-muted-card grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_240px] sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{t(meta.label, meta.labelAr)}</p>
                      <p className="mt-1 text-sm leading-6 text-white/58">{t(meta.helper, meta.helperAr)}</p>
                    </div>
                    <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                      {t("Assignee", "المسؤول")}
                      <select
                        value={currentAssignment?.assignee ?? ""}
                        onChange={(event) => updateAssignmentDraft(meta.role, event.target.value)}
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

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateLead(quickEditLead.id, { caseAssignments: assignmentDrafts })}
                className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d]"
              >
                {t("Save case team", "حفظ فريق الملف")}
              </button>
              <button
                type="button"
                onClick={() => setAssignmentDrafts(normalizeCaseAssignments(quickEditLead.caseAssignments))}
                className="admin-shell-button-secondary rounded-full px-4 py-3 text-sm font-semibold text-white"
              >
                {t("Reset assignments", "إعادة تعيين الإسناد")}
              </button>
            </div>
          </div>

          <div className={showTeamSections ? "admin-shell-panel p-4" : "hidden"}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">{t("Project or service", "المشروع أو الخدمة")}</p>
              <h5 className="mt-2 text-base font-semibold text-white">{t("Execution link", "ربط التنفيذ")}</h5>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {t(
                  "Connect this case to the real project or service item that the team will execute.",
                  "اربط هذا الملف بالمشروع أو عنصر الخدمة الحقيقي الذي سينفذه الفريق.",
                )}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Linked project", "المشروع المرتبط")}
                <select
                  value={linkedEntityDraft?.kind === "project" ? linkedEntityDraft.id : ""}
                  onChange={(event) => {
                    const project = projectOptions.find((item) => item.id === event.target.value);
                    setLinkedEntityDraft(
                      project
                        ? {
                            kind: "project",
                            id: project.id,
                            label: project.label,
                          }
                        : undefined,
                    );
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

              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Linked service item", "عنصر الخدمة المرتبط")}
                <select
                  value={linkedEntityDraft?.kind === "service" ? linkedEntityDraft.id : ""}
                  onChange={(event) => {
                    const service = serviceOptions.find((item) => item.id === event.target.value);
                    setLinkedEntityDraft(
                      service
                        ? {
                            kind: "service",
                            id: service.id,
                            label: service.label,
                            serviceType: service.serviceType,
                          }
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">
                {linkedEntityDraft
                  ? linkedEntityDraft.kind === "project"
                    ? t(`Linked to project: ${linkedEntityDraft.label}`, `مرتبط بالمشروع: ${linkedEntityDraft.label}`)
                    : t(`Linked to service: ${linkedEntityDraft.label}`, `مرتبط بالخدمة: ${linkedEntityDraft.label}`)
                  : t("No execution link yet.", "لا يوجد ربط تنفيذي بعد.")}
              </div>
              <button
                type="button"
                onClick={() => updateLead(quickEditLead.id, { linkedEntity: linkedEntityDraft ?? null })}
                className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d]"
              >
                {t("Save execution link", "حفظ ربط التنفيذ")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkedEntityDraft(undefined);
                  updateLead(quickEditLead.id, { linkedEntity: null });
                }}
                className="admin-shell-button-secondary rounded-full px-4 py-3 text-sm font-semibold text-white"
              >
                {t("Clear link", "مسح الربط")}
              </button>
            </div>
          </div>

          <div className={showTeamSections ? "admin-shell-panel p-4" : "hidden"}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">{t("Delivery readiness", "جاهزية التنفيذ")}</p>
              <h5 className="mt-2 text-base font-semibold text-white">{t("First execution checkpoint", "أول نقطة جاهزية للتنفيذ")}</h5>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {t(
                  "Track whether the case is truly ready to move from sale into delivery and site work.",
                  "تابع هل الملف جاهز فعلاً للانتقال من البيع إلى التنفيذ والعمل على الموقع.",
                )}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Delivery status", "حالة التنفيذ")}
                <select
                  value={deliveryReadinessDraft?.status ?? "not_started"}
                  onChange={(event) =>
                    setDeliveryReadinessDraft((current) =>
                      current
                        ? {
                            ...current,
                            status: event.target.value as DeliveryReadiness["status"],
                          }
                        : current,
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                >
                  <option value="not_started">{t("Not started", "لم يبدأ")}</option>
                  <option value="needs_assignment">{t("Needs assignment", "يحتاج إسناد")}</option>
                  <option value="ready_for_delivery">{t("Ready for delivery", "جاهز للتنفيذ")}</option>
                  <option value="in_progress">{t("In progress", "جارٍ التنفيذ")}</option>
                  <option value="blocked">{t("Blocked", "متعثر")}</option>
                  <option value="completed">{t("Completed", "مكتمل")}</option>
                </select>
              </label>

              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Site state", "حالة الموقع")}
                <select
                  value={deliveryReadinessDraft?.siteState ?? "not_started"}
                  onChange={(event) =>
                    setDeliveryReadinessDraft((current) =>
                      current
                        ? {
                            ...current,
                            siteState: event.target.value as DeliveryReadiness["siteState"],
                          }
                        : current,
                    )
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
              {deliveryReadinessDraft
                ? (
                    [
                      ["teamAssigned", "Team assigned", "الفريق معين"],
                      ["projectLinked", "Project or service linked", "المشروع أو الخدمة مربوط"],
                      ["commercialClosed", "Commercial side closed", "الجانب التجاري مقفول"],
                      ["docsReady", "Documents ready", "المستندات جاهزة"],
                    ] as const
                  ).map(([key, label, labelAr]) => (
                    <label
                      key={key}
                      className="admin-shell-muted-card flex items-center justify-between gap-3 p-4 text-sm text-white/82"
                    >
                      <span>{t(label, labelAr)}</span>
                      <input
                        type="checkbox"
                        checked={deliveryReadinessDraft.checklist[key]}
                        onChange={(event) =>
                          setDeliveryReadinessDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  checklist: {
                                    ...current.checklist,
                                    [key]: event.target.checked,
                                  },
                                }
                              : current,
                          )
                        }
                      />
                    </label>
                  ))
                : null}
            </div>

            <label className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
              {t("Readiness note", "ملاحظة الجاهزية")}
              <textarea
                value={deliveryReadinessDraft?.note ?? ""}
                onChange={(event) =>
                  setDeliveryReadinessDraft((current) =>
                    current
                      ? {
                          ...current,
                          note: event.target.value || undefined,
                        }
                      : current,
                  )
                }
                rows={3}
                className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                placeholder={t("What is missing before execution starts?", "ما الذي ينقص قبل بدء التنفيذ؟")}
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateLead(quickEditLead.id, { deliveryReadiness: deliveryReadinessDraft ?? null })}
                className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d]"
              >
                {t("Save readiness", "حفظ الجاهزية")}
              </button>
            </div>
          </div>

          <div className={showTeamSections ? "admin-shell-panel p-4" : "hidden"}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">{t("Site tracking", "متابعة الموقع")}</p>
              <h5 className="mt-2 text-base font-semibold text-white">{t("Live delivery pulse", "نبض التنفيذ الحالي")}</h5>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {t(
                  "Record the current site, phase, progress, and blockers so the owner can read execution clearly.",
                  "سجل الموقع الحالي والمرحلة ونسبة التقدم والعوائق حتى يرى المالك التنفيذ بوضوح.",
                )}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Site name", "اسم الموقع")}
                <input
                  value={siteTrackingDraft?.siteName ?? ""}
                  onChange={(event) =>
                    setSiteTrackingDraft((current) =>
                      current
                        ? {
                            ...current,
                            siteName: event.target.value || undefined,
                          }
                        : current,
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  placeholder={t("Site or location name", "اسم الموقع أو المكان")}
                />
              </label>

              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Progress", "نسبة التقدم")}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={siteTrackingDraft?.progressPercent ?? 0}
                  onChange={(event) =>
                    setSiteTrackingDraft((current) =>
                      current
                        ? {
                            ...current,
                            progressPercent: Number(event.target.value || 0),
                          }
                        : current,
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Current phase", "المرحلة الحالية")}
                <input
                  value={siteTrackingDraft?.currentPhase ?? ""}
                  onChange={(event) =>
                    setSiteTrackingDraft((current) =>
                      current
                        ? {
                            ...current,
                            currentPhase: event.target.value,
                          }
                        : current,
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  placeholder={t("Example: Civil works, finishing, handover", "مثال: أعمال مدنية، تشطيب، تسليم")}
                />
              </label>

              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Updated by", "تم التحديث بواسطة")}
                <input
                  value={siteTrackingDraft?.updatedBy ?? ""}
                  onChange={(event) =>
                    setSiteTrackingDraft((current) =>
                      current
                        ? {
                            ...current,
                            updatedBy: event.target.value || undefined,
                          }
                        : current,
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  placeholder={t("Engineer, worker, operations...", "مهندس، عامل، عمليات...")}
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
              {t("Last update", "آخر تحديث")}
              <textarea
                value={siteTrackingDraft?.lastUpdate ?? ""}
                onChange={(event) =>
                  setSiteTrackingDraft((current) =>
                    current
                      ? {
                          ...current,
                          lastUpdate: event.target.value,
                        }
                      : current,
                  )
                }
                rows={3}
                className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                placeholder={t("What happened on site today?", "ماذا حدث في الموقع اليوم؟")}
              />
            </label>

            <label className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
              {t("Blocker", "العائق")}
              <textarea
                value={siteTrackingDraft?.blocker ?? ""}
                onChange={(event) =>
                  setSiteTrackingDraft((current) =>
                    current
                      ? {
                          ...current,
                          blocker: event.target.value || undefined,
                        }
                      : current,
                  )
                }
                rows={2}
                className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                placeholder={t("Leave empty if no blocker exists", "اتركه فارغًا إذا لم يوجد عائق")}
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateLead(quickEditLead.id, { siteTracking: siteTrackingDraft ?? null })}
                className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d]"
              >
                {t("Save site update", "حفظ تحديث الموقع")}
              </button>
            </div>
          </div>

          <div className={showFileSections ? "admin-shell-panel p-4" : "hidden"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
                  {t("Case files", "ملفات العميل")}
                </p>
                <h5 className="mt-2 text-base font-semibold text-white">
                  {t("Documents and approvals", "المستندات والاعتمادات")}
                </h5>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {t(
                    "Attach the documents that make this case executable: contracts, quotes, receipts, drawings, reports, or site photos.",
                    "اربط المستندات التي تجعل هذا الملف قابلًا للتنفيذ: العقود، عروض السعر، الإيصالات، الرسومات، التقارير، أو صور الموقع.",
                  )}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">
                {t(
                  `${approvedFilesCount}/${caseFileDrafts.length} approved`,
                  `${approvedFilesCount}/${caseFileDrafts.length} معتمد`,
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {caseFileDrafts.length ? (
                caseFileDrafts.map((file) => (
                  <div key={file.id} className="admin-shell-muted-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words text-sm font-semibold text-white">{file.displayName}</p>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${getFileStatusTone(file.approvalStatus)}`}>
                            {t(
                              file.approvalStatus.replaceAll("_", " "),
                              file.approvalStatus === "approved"
                                ? "معتمد"
                                : file.approvalStatus === "rejected"
                                  ? "مرفوض"
                                  : file.approvalStatus === "submitted"
                                    ? "بانتظار المراجعة"
                                    : "مسودة",
                            )}
                          </span>
                        </div>
                        <p className="mt-1 break-all text-xs text-white/52" dir="ltr">
                          {file.storagePath}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {file.storagePath ? (
                          <a
                            href={file.storagePath}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75 transition hover:border-[#f2c16b]/40 hover:text-[#f2c16b]"
                          >
                            {t("Open file", "فتح الملف")}
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            commitCaseFileDrafts(
                              caseFileDrafts.filter((item) => item.id !== file.id),
                              t("Document removed and saved.", "تم حذف المستند وحفظ التغيير."),
                            )
                          }
                          className="rounded-full border border-red-400/25 px-3 py-1.5 text-xs text-red-200"
                        >
                          {t("Remove", "حذف")}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => commitCaseFileStatus(file.id, "submitted")}
                        className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100"
                      >
                        {t("Send to review", "إرسال للمراجعة")}
                      </button>
                      <button
                        type="button"
                        onClick={() => commitCaseFileStatus(file.id, "approved")}
                        className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100"
                      >
                        {t("Approve", "اعتماد")}
                      </button>
                      <button
                        type="button"
                        onClick={() => commitCaseFileStatus(file.id, "rejected")}
                        className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-100"
                      >
                        {t("Reject", "رفض")}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                        {t("Type", "النوع")}
                        <select
                          value={file.documentType}
                          onChange={(event) =>
                            updateCaseFileDraft(file.id, {
                              documentType: event.target.value as ClientCaseDocumentType,
                            })
                          }
                          className="rounded-2xl border border-white/10 bg-[#151211] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none"
                        >
                          {documentTypeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {t(option.label, option.labelAr)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                        {t("Status", "الحالة")}
                        <select
                          value={file.approvalStatus}
                          onChange={(event) =>
                            updateCaseFileDraft(file.id, {
                              approvalStatus: event.target.value as ClientCaseFileApprovalStatus,
                            })
                          }
                          className="rounded-2xl border border-white/10 bg-[#151211] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none"
                        >
                          {approvalStatusOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {t(option.label, option.labelAr)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                        {t("Owner", "المسؤول")}
                        <input
                          value={file.uploadedBy ?? ""}
                          onChange={(event) =>
                            updateCaseFileDraft(file.id, { uploadedBy: event.target.value || undefined })
                          }
                          className="rounded-2xl border border-white/10 bg-[#151211] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none"
                        />
                      </label>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
                  {t("No documents attached to this case yet.", "لا توجد مستندات مرتبطة بهذا الملف بعد.")}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-[11px] uppercase tracking-[0.18em] text-white/42 sm:col-span-2">
                {t("Upload real file", "رفع ملف فعلي")}
                <input
                  type="file"
                  disabled={isUploadingDocument}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadCaseDocument(file);
                    event.currentTarget.value = "";
                  }}
                  className="text-sm normal-case tracking-normal text-white file:mr-4 file:rounded-full file:border-0 file:bg-[#f2c16b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1d140d] disabled:opacity-50"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/png,image/jpeg,image/webp"
                />
                <span className="text-xs normal-case tracking-normal text-white/55">
                  {isUploadingDocument
                    ? t("Uploading document...", "جاري رفع المستند...")
                    : t("PDF, Word, Excel, text, or image files up to 25MB.", "PDF أو Word أو Excel أو نص أو صور حتى 25MB.")}
                </span>
              </label>

              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Document name", "اسم المستند")}
                <input
                  value={newCaseFile.displayName}
                  onChange={(event) => setNewCaseFile((current) => ({ ...current, displayName: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  placeholder={t("Signed contract, invoice, site photo...", "عقد موقع، فاتورة، صورة موقع...")}
                />
              </label>
              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Link or path", "الرابط أو المسار")}
                <input
                  value={newCaseFile.storagePath}
                  onChange={(event) => setNewCaseFile((current) => ({ ...current, storagePath: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  placeholder={t("Paste file link or storage path", "ضع رابط الملف أو مساره")}
                  dir="ltr"
                />
              </label>
              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Document type", "نوع المستند")}
                <select
                  value={newCaseFile.documentType}
                  onChange={(event) =>
                    setNewCaseFile((current) => ({
                      ...current,
                      documentType: event.target.value as ClientCaseDocumentType,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                >
                  {documentTypeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {t(option.label, option.labelAr)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Approval status", "حالة الاعتماد")}
                <select
                  value={newCaseFile.approvalStatus}
                  onChange={(event) =>
                    setNewCaseFile((current) => ({
                      ...current,
                      approvalStatus: event.target.value as ClientCaseFileApprovalStatus,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                >
                  {approvalStatusOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {t(option.label, option.labelAr)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Uploaded by", "تم الرفع بواسطة")}
                <input
                  value={newCaseFile.uploadedBy}
                  onChange={(event) => setNewCaseFile((current) => ({ ...current, uploadedBy: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  placeholder={t("Engineer, legal, accountant...", "مهندس، قانوني، محاسب...")}
                />
              </label>
              <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Attached to", "مرتبط بـ")}
                <select
                  value={newCaseFile.linkedTo}
                  onChange={(event) =>
                    setNewCaseFile((current) => ({
                      ...current,
                      linkedTo: event.target.value as NonNullable<ClientCaseFile["linkedTo"]>,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                >
                  <option value="client_case">{t("Client case", "ملف العميل")}</option>
                  <option value="project">{t("Project", "المشروع")}</option>
                  <option value="service">{t("Service", "الخدمة")}</option>
                  <option value="site">{t("Site", "الموقع")}</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addCaseFileDraft}
                className="admin-shell-button-secondary rounded-full px-4 py-3 text-sm font-semibold text-white"
              >
                {t("Add document", "إضافة مستند")}
              </button>
              <button
                type="button"
                onClick={() => updateLead(quickEditLead.id, { caseFiles: caseFileDrafts })}
                className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d]"
              >
                {t("Save documents", "حفظ المستندات")}
              </button>
            </div>
          </div>

          <label className={showOverviewSections ? "grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42" : "hidden"}>
            {t("Quick note", "ملاحظة سريعة")}
            <textarea
              value={noteDrafts[quickEditLead.id] ?? ""}
              onChange={(event) => setNoteDrafts((current) => ({ ...current, [quickEditLead.id]: event.target.value }))}
              rows={3}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
              placeholder={t("Add a quick follow-up note...", "أضف ملاحظة متابعة سريعة...")}
            />
          </label>

          {quickEditLead.stage === "closed_lost" ? (
            <label className={showOverviewSections ? "grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42" : "hidden"}>
              {t("Lost reason", "سبب الخسارة")}
              <textarea
                value={lostReasonDrafts[quickEditLead.id] ?? ""}
                onChange={(event) =>
                  setLostReasonDrafts((current) => ({ ...current, [quickEditLead.id]: event.target.value }))
                }
                rows={3}
                className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                placeholder={t("Capture why this deal was lost...", "اذكر سبب خسارة هذه الصفقة...")}
              />
            </label>
          ) : null}

          <div className={showOverviewSections ? "grid gap-3 sm:grid-cols-2" : "hidden"}>
            <button
              type="button"
              onClick={() => updateLead(quickEditLead.id, { note: noteDrafts[quickEditLead.id] })}
              disabled={!noteDrafts[quickEditLead.id]?.trim()}
              className="rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-4 py-3 text-sm font-semibold text-[#1d140d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Save note", "حفظ الملاحظة")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (quickEditLead.stage === "closed_lost") {
                  updateLead(quickEditLead.id, { lostReason: lostReasonDrafts[quickEditLead.id] });
                }
                onClose();
              }}
              className="admin-shell-button-secondary rounded-full px-4 py-3 text-sm font-semibold text-white"
            >
              {t("Done", "تم")}
            </button>
          </div>

          <div className="admin-shell-panel p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[#f2c16b]">{t("Lead timeline", "سجل الليد")}</p>
            <div className="mt-3 grid gap-2">
              {quickEditLeadTimeline.length ? (
                quickEditLeadTimeline.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-sm text-white/82">{item.body}</p>
                    <p className="mt-1 text-[11px] text-white/45">{formatDate(item.at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/55">{t("No timeline activity yet.", "لا يوجد سجل نشاط بعد.")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
