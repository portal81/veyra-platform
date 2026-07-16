"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type {
  ClientCaseAssignment,
  ClientCaseFile,
  ClientCaseLink,
  DeliveryReadiness,
  Lead,
  LeadPriority,
  LeadStage,
  SiteTracking,
  TeamUser,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LeadQuickEditDrawer } from "./crm/lead-quick-edit-drawer";
import { LeadCardList } from "./crm/lead-card-list";

const stages: Array<{ id: LeadStage; label: string; labelAr: string; description: string; descriptionAr: string }> = [
  { id: "new", label: "New", labelAr: "جديد", description: "Fresh enquiries waiting for first response.", descriptionAr: "استفسارات جديدة في انتظار الرد الأول." },
  { id: "contacted", label: "Contacted", labelAr: "تم التواصل", description: "Initial outreach completed and acknowledged.", descriptionAr: "تم التواصل الأولي وتم تأكيده." },
  { id: "qualified", label: "Qualified", labelAr: "مؤهل", description: "Confirmed fit, budget, and intent.", descriptionAr: "تم تأكيد الملاءمة، الميزانية، والنية بالشراء." },
  { id: "site_visit", label: "Site Visit", labelAr: "زيارة الموقع", description: "Visit arranged or ready for scheduling.", descriptionAr: "تم ترتيب الزيارة أو جاهزة للجدولة." },
  { id: "negotiation", label: "Negotiation", labelAr: "تفاوض", description: "Commercial details are under discussion.", descriptionAr: "التفاصيل التجارية قيد المناقشة." },
  { id: "closed_won", label: "Closed Won", labelAr: "مغلق بصفقة", description: "Converted opportunities and successful deals.", descriptionAr: "فرص تم تحويلها وصفقات ناجحة." },
  { id: "closed_lost", label: "Closed Lost", labelAr: "مغلق بالخسارة", description: "Archived opportunities with a known outcome.", descriptionAr: "فرص مؤرشفة بنتائج معروفة." },
];

const priorities: LeadPriority[] = ["low", "medium", "high"];

type LeadPipelineBoardProps = {
  initialLeads: Lead[];
  users: TeamUser[];
  projectOptions: Array<{ id: string; label: string }>;
  serviceOptions: Array<{ id: string; label: string; serviceType: string }>;
};
type LeadActivityItem = {
  id: string;
  action: string;
  at: string;
};
type LeadTimelineItem = {
  id: string;
  leadId: string;
  body: string;
  at: string;
};
type CrmSavedView = {
  id: string;
  name: string;
  stage: LeadStage;
  priority: LeadPriority | "all";
  query: string;
  source: string;
  assignment: "all" | "assigned" | "unassigned";
};
const CRM_SAVED_VIEWS_KEY = "veyra:admin:crm:saved-views:v1";

const priorityAccent: Record<LeadPriority, string> = {
  low: "text-emerald-200 border-emerald-400/20 bg-emerald-400/10",
  medium: "text-sky-200 border-sky-400/20 bg-sky-400/10",
  high: "text-amber-200 border-amber-400/20 bg-amber-400/10",
};

function getLeadAgeInDays(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function getLeadWeight(lead: Lead) {
  return (
    (lead.priority === "high" ? 30 : lead.priority === "medium" ? 20 : 10) +
    (!lead.assignedTo ? 14 : 0) +
    Math.min(getLeadAgeInDays(lead.createdAt), 7)
  );
}

export function LeadPipelineBoard({ initialLeads, users, projectOptions, serviceOptions }: LeadPipelineBoardProps) {
  const { t } = useAdminLocale();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState(initialLeads);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [createCaseDraft, setCreateCaseDraft] = useState({
    fullName: "",
    phone: "",
    email: "",
    service: "Project Visit" as Lead["service"],
    source: "",
    assignedTo: "",
    budget: "",
    message: "",
    linkedProjectId: "",
    linkedServiceId: "",
  });
  const [selectedStage, setSelectedStage] = useState<LeadStage>(() => {
    return stages.find((stage) => initialLeads.some((lead) => lead.stage === stage.id))?.id ?? "new";
  });
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | "all">("all");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [query, setQuery] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [lostReasonDrafts, setLostReasonDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialLeads.map((lead) => [lead.id, lead.lostReason ?? ""])),
  );
  const [feedback, setFeedback] = useState<string>("");
  const [activityLog, setActivityLog] = useState<LeadActivityItem[]>([]);
  const [leadTimeline, setLeadTimeline] = useState<Record<string, LeadTimelineItem[]>>({});
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<LeadStage | "">("");
  const [bulkPriority, setBulkPriority] = useState<LeadPriority | "">("");
  const [bulkAssignedTo, setBulkAssignedTo] = useState<string>("__no_change__");
  const [quickEditLeadId, setQuickEditLeadId] = useState<string | null>(null);
  const [quickEditDrawerMode, setQuickEditDrawerMode] = useState<"overview" | "team" | "files">("overview");
  const [drawerFeedback, setDrawerFeedback] = useState<string>("");
  const [savedViews, setSavedViews] = useState<CrmSavedView[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(CRM_SAVED_VIEWS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CrmSavedView[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [savedViewName, setSavedViewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"tabs" | "kanban">("tabs");

  useEffect(() => {
    const leadId = searchParams.get("open");
    const modeParam = searchParams.get("mode");
    const mode = modeParam === "team" || modeParam === "files" ? modeParam : "overview";

    if (leadId && initialLeads.some((lead) => lead.id === leadId)) {
      setQuickEditDrawerMode(mode);
      setQuickEditLeadId(leadId);
    }
  }, [initialLeads, searchParams]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CRM_SAVED_VIEWS_KEY, JSON.stringify(savedViews));
    } catch {
      // Ignore local storage errors.
    }
  }, [savedViews]);

  const uniqueSources = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.source).filter(Boolean) as string[])),
    [leads],
  );

  const stageCounts = useMemo(
    () =>
      stages.map((stage) => ({
        ...stage,
        count: leads.filter((lead) => lead.stage === stage.id).length,
      })),
    [leads],
  );

  const selectedStageMeta = stageCounts.find((stage) => stage.id === selectedStage) ?? stageCounts[0];

  const visibleLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leads
      .filter((lead) => {
      if (lead.stage !== selectedStage) {
        return false;
      }

      if (priorityFilter !== "all" && lead.priority !== priorityFilter) {
        return false;
      }

      if (assignmentFilter === "assigned" && !lead.assignedTo) {
        return false;
      }

      if (assignmentFilter === "unassigned" && lead.assignedTo) {
        return false;
      }

      if (sourceFilter && (lead.source ?? "") !== sourceFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [lead.fullName, lead.email, lead.phone, lead.service, lead.source, lead.status, lead.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => getLeadWeight(b) - getLeadWeight(a));
  }, [assignmentFilter, leads, priorityFilter, query, selectedStage, sourceFilter]);

  const unassignedCount = leads.filter((lead) => !lead.assignedTo).length;
  const highPriorityCount = leads.filter((lead) => lead.priority === "high").length;
  const quickEditLead = quickEditLeadId ? leads.find((lead) => lead.id === quickEditLeadId) ?? null : null;
  const quickEditLeadTimeline = quickEditLead ? leadTimeline[quickEditLead.id] ?? [] : [];

  const updateCreateCaseDraft = (field: keyof typeof createCaseDraft, value: string) => {
    setCreateCaseDraft((current) => ({ ...current, [field]: value }));
  };

  const openQuickEditLead = (id: string, mode: "overview" | "team" | "files") => {
    setQuickEditDrawerMode(mode);
    setQuickEditLeadId(id);
  };

  const handleCreateCase = () => {
    startTransition(async () => {
      setFeedback("");
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: createCaseDraft.fullName,
            phone: createCaseDraft.phone,
          email: createCaseDraft.email,
          service: createCaseDraft.service,
          source: createCaseDraft.source,
            assignedTo: createCaseDraft.assignedTo,
            budget: createCaseDraft.budget ? Number(createCaseDraft.budget) : undefined,
            message: createCaseDraft.message,
            linkedEntity: createCaseDraft.linkedProjectId
              ? {
                  kind: "project",
                  id: createCaseDraft.linkedProjectId,
                  label:
                    projectOptions.find((project) => project.id === createCaseDraft.linkedProjectId)?.label ??
                    createCaseDraft.linkedProjectId,
                }
              : createCaseDraft.linkedServiceId
                ? (() => {
                    const linkedService = serviceOptions.find((service) => service.id === createCaseDraft.linkedServiceId);
                    return linkedService
                      ? {
                          kind: "service" as const,
                          id: linkedService.id,
                          label: linkedService.label,
                          serviceType: linkedService.serviceType,
                        }
                      : undefined;
                  })()
                : undefined,
          }),
      });

      const json = (await response.json()) as { lead?: Lead; message?: string };
      if (!response.ok || !json.lead) {
        const failMessage = json.message ?? t("Could not create client case.", "تعذر إنشاء ملف العميل.");
        setFeedback(failMessage);
        toast.error(failMessage);
        return;
      }

      setLeads((current) => [json.lead!, ...current]);
      setSelectedStage("new");
      setShowCreateCase(false);
      setCreateCaseDraft({
        fullName: "",
        phone: "",
        email: "",
        service: "Project Visit",
        source: "",
        assignedTo: "",
        budget: "",
        message: "",
        linkedProjectId: "",
        linkedServiceId: "",
      });
      setActivityLog((current) =>
        [
          {
            id: `lead-act-${crypto.randomUUID()}`,
            action: `Created client case for ${json.lead!.fullName}`,
            at: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 25),
      );
      const successMessage = json.message ?? t("Client case created.", "تم إنشاء ملف العميل.");
      setFeedback(successMessage);
      toast.success(successMessage);
    });
  };

  const updateLead = (
    id: string,
    payload: Partial<Pick<Lead, "stage" | "priority" | "assignedTo" | "lostReason">> & {
      note?: string;
      caseAssignments?: ClientCaseAssignment[];
      linkedEntity?: ClientCaseLink;
      deliveryReadiness?: DeliveryReadiness | null;
      siteTracking?: SiteTracking | null;
      caseFiles?: ClientCaseFile[];
    },
  ) => {
    startTransition(async () => {
      setFeedback("");
      setDrawerFeedback("");
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as { lead?: Lead; message?: string };
      if (!response.ok || !json.lead) {
        const failMessage = json.message ?? t("Could not update lead.", "تعذر تحديث العميل.");
        setFeedback(failMessage);
        setDrawerFeedback(failMessage);
        toast.error(failMessage);
        return;
      }

      setLeads((current) =>
        current.map((lead) => (lead.id === id ? { ...lead, ...json.lead! } : lead)),
      );
      const actions: string[] = [];
      if (payload.stage) actions.push(`stage -> ${payload.stage}`);
      if (payload.priority) actions.push(`priority -> ${payload.priority}`);
      if (payload.assignedTo !== undefined) actions.push(`assigned -> ${payload.assignedTo || "unassigned"}`);
      if (payload.note) actions.push("note saved");
      if (payload.lostReason !== undefined) actions.push("lost reason updated");
      if (payload.caseAssignments) actions.push("case team updated");
      if (payload.linkedEntity) actions.push("case link updated");
      if ("deliveryReadiness" in payload) actions.push("delivery readiness updated");
      if ("siteTracking" in payload) actions.push("site tracking updated");
      if (payload.caseFiles) actions.push("case files updated");
      if (actions.length) {
        setActivityLog((current) =>
          [
            { id: `lead-act-${crypto.randomUUID()}`, action: `${id}: ${actions.join(", ")}`, at: new Date().toISOString() },
            ...current,
          ].slice(0, 25),
        );
        setLeadTimeline((current) => ({
          ...current,
          [id]: [
            { id: `lead-line-${crypto.randomUUID()}`, leadId: id, body: actions.join(" • "), at: new Date().toISOString() },
            ...(current[id] ?? []),
          ].slice(0, 20),
        }));
      }
      if (payload.note) {
        setNoteDrafts((current) => ({ ...current, [id]: "" }));
      }
      if (payload.lostReason !== undefined) {
        setLostReasonDrafts((current) => ({ ...current, [id]: payload.lostReason ?? "" }));
      }
      const successMessage = json.message ?? t("Lead updated.", "تم تحديث العميل.");
      setFeedback(successMessage);
      setDrawerFeedback(successMessage);
      toast.success(successMessage);
    });
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((current) =>
      current.includes(leadId) ? current.filter((id) => id !== leadId) : [...current, leadId],
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = visibleLeads.map((lead) => lead.id);
    const shouldSelectAll = visibleIds.some((id) => !selectedLeadIds.includes(id));
    setSelectedLeadIds(shouldSelectAll ? visibleIds : []);
  };

  const saveCurrentView = () => {
    const trimmedName = savedViewName.trim();
    if (!trimmedName) {
      setFeedback(t("Name this view before saving.", "اكتب اسم العرض قبل الحفظ."));
      return;
    }
    const nextView: CrmSavedView = {
      id: `view-${crypto.randomUUID()}`,
      name: trimmedName,
      stage: selectedStage,
      priority: priorityFilter,
      query,
      source: sourceFilter,
      assignment: assignmentFilter,
    };
    setSavedViews((current) => [nextView, ...current].slice(0, 12));
    setSavedViewName("");
    setFeedback(t("View saved.", "تم حفظ العرض."));
  };

  const applySavedView = (view: CrmSavedView) => {
    setSelectedStage(view.stage);
    setPriorityFilter(view.priority);
    setQuery(view.query);
    setSourceFilter(view.source);
    setAssignmentFilter(view.assignment);
    setFeedback(t("Saved view applied.", "تم تطبيق العرض المحفوظ."));
  };

  const deleteSavedView = (viewId: string) => {
    setSavedViews((current) => current.filter((view) => view.id !== viewId));
    setFeedback(t("Saved view removed.", "تم حذف العرض المحفوظ."));
  };

  const applyBulkUpdate = () => {
    if (!selectedLeadIds.length) return;
    const payload: Partial<Pick<Lead, "stage" | "priority" | "assignedTo">> = {};
    if (bulkStage) payload.stage = bulkStage;
    if (bulkPriority) payload.priority = bulkPriority;
    if (bulkAssignedTo !== "__no_change__") payload.assignedTo = bulkAssignedTo || undefined;
    if (!Object.keys(payload).length) {
      setFeedback(t("Select at least one field for bulk update.", "اختر حقلاً واحدًا على الأقل للتعديل الجماعي."));
      return;
    }

    startTransition(async () => {
      setFeedback("");
      const results = await Promise.all(
        selectedLeadIds.map(async (leadId) => {
          const response = await fetch(`/api/admin/leads/${leadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = (await response.json()) as { lead?: Lead };
          return { ok: response.ok, lead: json.lead, leadId };
        }),
      );

      const okResults = results.filter((item) => item.ok && item.lead);
      if (okResults.length) {
        const nextById = new Map(okResults.map((item) => [item.leadId, item.lead as Lead]));
        setLeads((current) => current.map((lead) => nextById.get(lead.id) ?? lead));
        setActivityLog((current) =>
          [
            {
              id: `lead-act-${crypto.randomUUID()}`,
              action: `Bulk update for ${okResults.length} leads`,
              at: new Date().toISOString(),
            },
            ...current,
          ].slice(0, 25),
        );
      }

      const bulkMsg = okResults.length
          ? t(
              `Updated ${okResults.length} lead(s).`,
              `تم تحديث ${okResults.length} عميل/عملاء.`,
            )
          : t("Bulk update failed.", "فشل التعديل الجماعي.");
      setFeedback(bulkMsg);
      if (okResults.length) toast.success(bulkMsg); else toast.error(bulkMsg);
      setSelectedLeadIds([]);
      setBulkStage("");
      setBulkPriority("");
      setBulkAssignedTo("__no_change__");
    });
  };

  const bulkDeleteSelected = () => {
    if (!selectedLeadIds.length) return;
    startTransition(async () => {
      setFeedback("");
      const results = await Promise.all(
        selectedLeadIds.map(async (leadId) => {
          const response = await fetch(`/api/admin/leads/${leadId}`, { method: "DELETE" });
          return { ok: response.ok, leadId };
        }),
      );
      const deletedIds = results.filter((item) => item.ok).map((item) => item.leadId);
      if (deletedIds.length) {
        const deletedSet = new Set(deletedIds);
        setLeads((current) => current.filter((lead) => !deletedSet.has(lead.id)));
        setLeadTimeline((current) => {
          const next = { ...current };
          for (const deletedId of deletedIds) {
            delete next[deletedId];
          }
          return next;
        });
        setActivityLog((current) =>
          [
            {
              id: `lead-act-${crypto.randomUUID()}`,
              action: `Deleted ${deletedIds.length} selected leads`,
              at: new Date().toISOString(),
            },
            ...current,
          ].slice(0, 25),
        );
      }
      setSelectedLeadIds([]);
      const delMsg = deletedIds.length
          ? t(`Deleted ${deletedIds.length} lead(s).`, `تم حذف ${deletedIds.length} عميل/عملاء.`)
          : t("Could not delete selected leads.", "تعذر حذف الليدات المحددة.");
      setFeedback(delMsg);
      if (deletedIds.length) toast.success(delMsg); else toast.error(delMsg);
    });
  };

  const stageOrder: LeadStage[] = [
    "new",
    "contacted",
    "qualified",
    "site_visit",
    "negotiation",
    "closed_won",
    "closed_lost",
  ];

  const advanceToNextStage = (lead: Lead) => {
    const currentIndex = stageOrder.indexOf(lead.stage);
    if (currentIndex < 0 || currentIndex >= stageOrder.length - 1) {
      setDrawerFeedback(t("This lead is already in a final stage.", "هذا الليد بالفعل في مرحلة نهائية."));
      return;
    }
    const nextStage = stageOrder[currentIndex + 1];
    updateLead(lead.id, { stage: nextStage });
  };

  return (
    <div className="grid gap-6">
      <section className="admin-shell-surface p-5 md:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">{t("Lead workspace", "مساحة العملاء")}</p>
                <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">{t("Organized pipeline without stacked lanes or overlapping cards.", "مراحل منظمة بدون أعمدة متراكبة أو كروت متداخلة.")}</h2>
                <p className="mt-3 text-sm leading-7 text-white/66 md:text-base">
                  {t("Pick a stage, focus on the leads inside it, and update ownership, priority, and notes from one clean board.", "اختر مرحلة، وركّز على العملاء بداخلها، ثم حدّث المسؤولية والأولوية والملاحظات من لوحة واحدة مرتبة.")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCase((current) => !current)}
                  className="rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-4 py-2.5 text-sm font-semibold text-[#1d140d] transition hover:-translate-y-0.5"
                >
                  {showCreateCase
                    ? t("Hide intake", "إخفاء الإدخال")
                    : t("Add client case", "إضافة ملف عميل")}
                </button>
                {feedback ? (
                  <span className="admin-shell-muted-card px-3 py-2 text-xs text-brand-gold">
                    {feedback}
                  </span>
                ) : null}
                {isPending ? (
                  <span className="admin-shell-muted-card px-3 py-2 text-xs text-white/60">
                    {t("Saving...", "جارٍ الحفظ...")}
                  </span>
                ) : null}
              </div>
            </div>

            {showCreateCase ? (
              <div className="admin-shell-panel border border-white/10 p-4 md:p-5">
                <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-gold">
                      {t("Manual intake", "إدخال يدوي")}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {t("Create a client case directly from operations", "أنشئ ملف عميل مباشرة من مركز العمليات")}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      {t(
                        "Use this when a lead arrives by phone, referral, site visit, or owner follow-up instead of the website form.",
                        "استخدم هذا المسار عندما يصل العميل هاتفيًا أو عبر ترشيح أو زيارة أو متابعة مباشرة من المالك بدل نموذج الموقع.",
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <input
                    value={createCaseDraft.fullName}
                    onChange={(event) => updateCreateCaseDraft("fullName", event.target.value)}
                    placeholder={t("Full name", "الاسم الكامل")}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  />
                  <input
                    value={createCaseDraft.phone}
                    onChange={(event) => updateCreateCaseDraft("phone", event.target.value)}
                    placeholder={t("Phone", "الهاتف")}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  />
                  <input
                    value={createCaseDraft.email}
                    onChange={(event) => updateCreateCaseDraft("email", event.target.value)}
                    placeholder={t("Email (optional)", "البريد الإلكتروني (اختياري)")}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  />
                  <select
                    value={createCaseDraft.service}
                    onChange={(event) => updateCreateCaseDraft("service", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="Project Visit">{t("Project Visit", "زيارة مشروع")}</option>
                    <option value="Finishing Quote">{t("Finishing Quote", "عرض تشطيب")}</option>
                    <option value="Smart Home Setup">{t("Smart Home Setup", "تجهيز منزل ذكي")}</option>
                  </select>
                  <input
                    value={createCaseDraft.source}
                    onChange={(event) => updateCreateCaseDraft("source", event.target.value)}
                    placeholder={t("Source", "المصدر")}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  />
                  <select
                    value={createCaseDraft.assignedTo}
                    onChange={(event) => updateCreateCaseDraft("assignedTo", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="">{t("No owner yet", "بدون مسؤول الآن")}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.fullName}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                  <input
                    value={createCaseDraft.budget}
                    onChange={(event) => updateCreateCaseDraft("budget", event.target.value)}
                    placeholder={t("Budget (optional)", "الميزانية (اختياري)")}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  />
                  <select
                    value={createCaseDraft.linkedProjectId}
                    onChange={(event) => {
                      updateCreateCaseDraft("linkedProjectId", event.target.value);
                      if (event.target.value) {
                        updateCreateCaseDraft("linkedServiceId", "");
                      }
                    }}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="">{t("Link to project (optional)", "ربط بمشروع (اختياري)")}</option>
                    {projectOptions.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={createCaseDraft.linkedServiceId}
                    onChange={(event) => {
                      updateCreateCaseDraft("linkedServiceId", event.target.value);
                      if (event.target.value) {
                        updateCreateCaseDraft("linkedProjectId", "");
                      }
                    }}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="">{t("Link to service item (optional)", "ربط بعنصر خدمة (اختياري)")}</option>
                    {serviceOptions.map((service) => (
                      <option key={`${service.serviceType}-${service.id}`} value={service.id}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={createCaseDraft.message}
                    onChange={(event) => updateCreateCaseDraft("message", event.target.value)}
                    placeholder={t("Case notes", "ملاحظات الملف")}
                    className="min-h-[108px] rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none md:col-span-2 xl:col-span-2"
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateCase(false)}
                    className="admin-shell-button-ghost rounded-full px-4 py-2.5 text-sm text-white/80"
                  >
                    {t("Cancel", "إلغاء")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCase}
                    disabled={!createCaseDraft.fullName.trim() || !createCaseDraft.phone.trim()}
                    className="rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-4 py-2.5 text-sm font-semibold text-[#1d140d] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPending ? t("Creating...", "جارٍ الإنشاء...") : t("Create client case", "إنشاء ملف العميل")}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Open stages", "المراحل المفتوحة")}</p>
                <strong className="mt-3 block font-serif text-3xl text-white">{stageCounts.filter((stage) => stage.count > 0).length}</strong>
                <p className="mt-2 text-sm text-white/62">{t("Stages that currently contain active leads.", "المراحل التي تحتوي حاليًا على عملاء نشطين.")}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Unassigned", "بدون مسؤول")}</p>
                <strong className="mt-3 block font-serif text-3xl text-white">{unassignedCount}</strong>
                <p className="mt-2 text-sm text-white/62">{t("Leads still waiting for owner assignment.", "عملاء ما زالوا ينتظرون تحديد مسؤول.")}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("High priority", "أولوية عالية")}</p>
                <strong className="mt-3 block font-serif text-3xl text-white">{highPriorityCount}</strong>
                <p className="mt-2 text-sm text-white/62">{t("Deals that need urgent follow-up today.", "صفقات تحتاج متابعة عاجلة اليوم.")}</p>
              </div>
            </div>
          </div>

          <div className="admin-shell-panel p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">{t("Pipeline rule", "قاعدة المراحل")}</p>
            <p className="mt-3 text-sm leading-7 text-white/66">
              {t("The board now shows one active stage at a time, so the team can work clearly without narrow columns or crowded forms.", "تعرض اللوحة الآن مرحلة واحدة نشطة في كل مرة، حتى يعمل الفريق بوضوح بدون أعمدة ضيقة أو نماذج مزدحمة.")}
            </p>
            <div className="mt-4 grid gap-3">
              <div className="admin-shell-muted-card p-3 text-sm text-white/66">
                {t("Use the stage rail below to move between lanes.", "استخدم شريط المراحل بالأسفل للتنقل بين المسارات.")}
              </div>
              <div className="admin-shell-muted-card p-3 text-sm text-white/66">
                {t("Search, filter by priority, then update the lead card in place.", "ابحث ثم صفِّ حسب الأولوية وبعدها عدّل كارت العميل مباشرة.")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-shell-panel p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            {stageCounts.map((stage) => {
              const isActive = stage.id === selectedStage;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStage(stage.id)}
                  className={`min-w-[170px] rounded-[24px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-brand-gold/35 bg-brand-gold/10 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/7"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{t(stage.label, stage.labelAr)}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
                        {stage.count} {t(stage.count === 1 ? "lead" : "leads", stage.count === 1 ? "عميل" : "عملاء")}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-brand-gold">
                      {String(stage.count).padStart(2, "0")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <section className="admin-shell-panel p-5 md:p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">{t("Current stage", "المرحلة الحالية")}</p>
              <h3 className="mt-3 font-serif text-3xl text-white">{t(selectedStageMeta.label, selectedStageMeta.labelAr)}</h3>
              <p className="mt-2 text-sm leading-7 text-white/62">{t(selectedStageMeta.description, selectedStageMeta.descriptionAr)}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:w-[780px]">
              <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-white/42">
                {t("Search leads", "ابحث عن العملاء")}
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  placeholder={t("Name, email, phone, service...", "الاسم أو البريد أو الهاتف أو الخدمة...")}
                />
              </label>

              <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-white/42">
                {t("Priority filter", "تصفية الأولوية")}
                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value as LeadPriority | "all")}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                >
                  <option value="all">{t("All priorities", "كل الأولويات")}</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-white/42">
                {t("Assignment", "التعيين")}
                <select
                  value={assignmentFilter}
                  onChange={(event) => setAssignmentFilter(event.target.value as "all" | "assigned" | "unassigned")}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                >
                  <option value="all">{t("All", "الكل")}</option>
                  <option value="assigned">{t("Assigned", "معين")}</option>
                  <option value="unassigned">{t("Unassigned", "غير معين")}</option>
                </select>
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-white/42">
                {t("Source", "المصدر")}
                <select
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                >
                  <option value="">{t("All sources", "كل المصادر")}</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="admin-shell-panel xl:col-span-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAllVisible}
                  className="admin-shell-button-ghost rounded-full px-3 py-2 text-xs text-white/80"
                >
                  {selectedLeadIds.length === visibleLeads.length && visibleLeads.length
                    ? t("Clear selection", "إلغاء التحديد")
                    : t("Select visible", "تحديد الظاهر")}
                </button>
                <span className="text-xs text-white/60">
                  {t("Selected", "المحدد")}: <span className="font-semibold text-white">{selectedLeadIds.length}</span>
                </span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <select
                  value={bulkStage}
                  onChange={(event) => setBulkStage(event.target.value as LeadStage | "")}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">{t("Bulk stage (optional)", "مرحلة جماعية (اختياري)")}</option>
                  {stages.map((option) => (
                    <option key={option.id} value={option.id}>
                      {t(option.label, option.labelAr)}
                    </option>
                  ))}
                </select>
                <select
                  value={bulkPriority}
                  onChange={(event) => setBulkPriority(event.target.value as LeadPriority | "")}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">{t("Bulk priority (optional)", "أولوية جماعية (اختياري)")}</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
                <select
                  value={bulkAssignedTo}
                  onChange={(event) => setBulkAssignedTo(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="__no_change__">{t("Assignee (no change)", "المسؤول (بدون تغيير)")}</option>
                  <option value="">{t("Unassigned", "غير معين")}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.fullName}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyBulkUpdate}
                  disabled={!selectedLeadIds.length}
                  className="rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-4 py-3 text-sm font-semibold text-[#1d140d] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("Apply bulk update", "تطبيق التعديل الجماعي")}
                </button>
                <button
                  type="button"
                  onClick={bulkDeleteSelected}
                  disabled={!selectedLeadIds.length}
                  className="rounded-full border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("Delete selected leads", "حذف الليدات المحددة")}
                </button>
              </div>
            </div>
            {visibleLeads.length === 0 ? (
              <div className="xl:col-span-2 rounded-[24px] border border-dashed border-white/10 bg-black/15 px-5 py-14 text-center">
                <p className="font-serif text-3xl text-white">{t("No leads match this stage yet.", "لا يوجد عملاء مطابقون لهذه المرحلة بعد.")}</p>
                <p className="mt-3 text-sm text-white/52">
                  {t("Adjust the search or priority filter, or move leads from another stage.", "عدّل البحث أو تصفية الأولوية أو انقل العملاء من مرحلة أخرى.")}
                </p>
              </div>
            ) : null}

            {visibleLeads.map((lead) => (
              <LeadCardList
                key={lead.id}
                lead={lead}
                selectedLeadIds={selectedLeadIds}
                toggleLeadSelection={toggleLeadSelection}
                priorityAccent={priorityAccent}
                stages={stages}
                priorities={priorities}
                users={users}
                updateLead={updateLead}
                noteDrafts={noteDrafts}
                setNoteDrafts={setNoteDrafts}
                lostReasonDrafts={lostReasonDrafts}
                setLostReasonDrafts={setLostReasonDrafts}
                setDrawerFeedback={setDrawerFeedback}
                openQuickEditLead={openQuickEditLead}
              />
            ))}
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="admin-shell-panel p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-gold">{t("Pipeline map", "خريطة المراحل")}</p>
            <h3 className="mt-3 font-serif text-2xl text-white">{t("Stage health", "صحة المراحل")}</h3>

            <div className="mt-5 grid gap-3">
              {stageCounts.map((stage) => {
                const isActive = stage.id === selectedStage;
                const ratio = leads.length > 0 ? Math.max(10, Math.round((stage.count / leads.length) * 100)) : 0;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedStage(stage.id)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-brand-gold/35 bg-brand-gold/10"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/6"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{t(stage.label, stage.labelAr)}</p>
                      <span className="text-xs uppercase tracking-[0.18em] text-white/48">{stage.count}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="admin-shell-panel p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-gold">{t("Team focus", "تركيز الفريق")}</p>
            <h3 className="mt-3 font-serif text-2xl text-white">{t("Next actions", "الخطوات القادمة")}</h3>

            <div className="mt-5 grid gap-3">
              <div className="admin-shell-muted-card p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Unassigned leads", "عملاء بدون مسؤول")}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{unassignedCount}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{t("Assign ownership quickly so no enquiry gets lost.", "قم بتعيين المسؤولية بسرعة حتى لا يُفقد أي استفسار.")}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("High priority follow-ups", "متابعات ذات أولوية عالية")}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{highPriorityCount}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{t("Review these first before switching stages.", "راجع هؤلاء أولاً قبل الانتقال بين المراحل.")}</p>
              </div>
              <div className="admin-shell-muted-card p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Active sales team", "فريق المبيعات النشطين")}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{users.length}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{t("Available users for assignment and invite expansion.", "المستخدمون المتاحون للتعيين ونشر الدعوات.")}</p>
              </div>
            </div>
          </section>

          <section className="admin-shell-panel p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-gold">{t("Saved views", "العروض المحفوظة")}</p>
            <h3 className="mt-3 font-serif text-2xl text-white">{t("Filter presets", "إعدادات الفلاتر")}</h3>
            <div className="mt-4 grid gap-2">
              <input
                value={savedViewName}
                onChange={(event) => setSavedViewName(event.target.value)}
                placeholder={t("View name", "اسم العرض")}
                className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={saveCurrentView}
                className="admin-shell-button-secondary rounded-full px-4 py-2 text-sm text-white"
              >
                {t("Save current filters", "حفظ الفلاتر الحالية")}
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {savedViews.length ? (
                savedViews.map((view) => (
                  <div key={view.id} className="admin-shell-muted-card p-3">
                    <p className="text-sm font-semibold text-white">{view.name}</p>
                    <p className="mt-1 text-[11px] text-white/52">
                      {view.stage} • {view.priority} • {view.assignment} • {view.source || t("all sources", "كل المصادر")}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => applySavedView(view)}
                        className="admin-shell-button-ghost rounded-full px-3 py-1 text-xs text-white/75"
                      >
                        {t("Apply", "تطبيق")}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedView(view.id)}
                        className="rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-200 hover:bg-red-500/10"
                      >
                        {t("Delete", "حذف")}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/55">{t("No saved views yet.", "لا توجد عروض محفوظة بعد.")}</p>
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-brand-gold">{t("Activity log", "سجل النشاط")}</p>
              <button
                type="button"
                onClick={() => setActivityLog([])}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
              >
                {t("Clear", "مسح")}
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {activityLog.length ? (
                activityLog.map((item) => (
                  <div key={item.id} className="rounded-[16px] border border-white/10 bg-black/20 p-3">
                    <p className="text-sm text-white/82">{item.action}</p>
                    <p className="mt-1 text-[11px] text-white/45">{formatDate(item.at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/55">{t("No CRM actions recorded yet.", "لا توجد أحداث CRM حتى الآن.")}</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <LeadQuickEditDrawer
        quickEditLead={quickEditLead}
        drawerMode={quickEditDrawerMode}
        users={users}
        projectOptions={projectOptions}
        serviceOptions={serviceOptions}
        onClose={() => {
          setDrawerFeedback("");
          setQuickEditLeadId(null);
          setQuickEditDrawerMode("overview");
        }}
        updateLead={updateLead}
        advanceToNextStage={advanceToNextStage}
        drawerFeedback={drawerFeedback}
        setDrawerFeedback={setDrawerFeedback}
        quickEditLeadTimeline={quickEditLeadTimeline}
        noteDrafts={noteDrafts}
        setNoteDrafts={setNoteDrafts}
        lostReasonDrafts={lostReasonDrafts}
        setLostReasonDrafts={setLostReasonDrafts}
        stages={stages}
        priorities={priorities}
      />
    </div>
  );
}
