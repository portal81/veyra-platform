"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type {
  ClientCaseAssignment,
  ClientCaseRoleTask,
  ClientCaseRoleTaskStatus,
  ClientCaseRoleType,
} from "@/lib/types";

type ClientCaseRoleTasksEditorProps = {
  leadId: string;
  assignments: ClientCaseAssignment[];
  initialTasks: ClientCaseRoleTask[];
  linkedEntity?: {
    kind: "project" | "service";
    id: string;
    label: string;
  };
  files: Array<{
    id: string;
    displayName: string;
    approvalStatus: string;
  }>;
  siteTracking?: {
    currentPhase?: string;
    progressPercent?: number;
    blocker?: string;
  };
};

const roleLabels: Record<ClientCaseRoleType, { label: string; labelAr: string; defaultTask: string; defaultTaskAr: string }> = {
  sales: {
    label: "Sales",
    labelAr: "المبيعات",
    defaultTask: "Keep commercial follow-up moving.",
    defaultTaskAr: "متابعة العميل تجاريًا وتحريك القرار.",
  },
  operations: {
    label: "Operations",
    labelAr: "العمليات",
    defaultTask: "Coordinate handoff between all roles.",
    defaultTaskAr: "تنسيق التسليم بين كل الأدوار.",
  },
  engineer: {
    label: "Engineer",
    labelAr: "المهندس",
    defaultTask: "Confirm technical/site readiness.",
    defaultTaskAr: "تأكيد الجاهزية الفنية وحالة الموقع.",
  },
  worker: {
    label: "Worker",
    labelAr: "العامل",
    defaultTask: "Report field execution progress.",
    defaultTaskAr: "تسجيل تقدم التنفيذ الميداني.",
  },
  lawyer: {
    label: "Legal",
    labelAr: "القانوني",
    defaultTask: "Review contracts and approvals.",
    defaultTaskAr: "مراجعة العقود والاعتمادات.",
  },
  accountant: {
    label: "Accounting",
    labelAr: "المحاسبة",
    defaultTask: "Track payments and financial readiness.",
    defaultTaskAr: "متابعة الدفع والجاهزية المالية.",
  },
  marketer: {
    label: "Marketing",
    labelAr: "التسويق",
    defaultTask: "Keep campaign/source context clear.",
    defaultTaskAr: "توضيح المصدر والحملة وسياق الطلب.",
  },
};

const taskStatuses: Array<{ id: ClientCaseRoleTaskStatus; label: string; labelAr: string }> = [
  { id: "todo", label: "To do", labelAr: "لم يبدأ" },
  { id: "in_progress", label: "In progress", labelAr: "جار العمل" },
  { id: "blocked", label: "Blocked", labelAr: "متعثر" },
  { id: "done", label: "Done", labelAr: "تم" },
];

const taskTargets: Array<{ id: NonNullable<ClientCaseRoleTask["linkedTo"]>; label: string; labelAr: string }> = [
  { id: "client_case", label: "Client case", labelAr: "ملف العميل" },
  { id: "project", label: "Project", labelAr: "المشروع" },
  { id: "service", label: "Service", labelAr: "الخدمة" },
  { id: "site", label: "Site update", labelAr: "تحديث الموقع" },
  { id: "document", label: "Document", labelAr: "مستند" },
];

function getStatusTone(status: ClientCaseRoleTaskStatus) {
  if (status === "done") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "blocked") return "border-rose-400/20 bg-rose-400/10 text-rose-100";
  if (status === "in_progress") return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-white/10 bg-white/5 text-white/65";
}

function getTargetLabel(target: ClientCaseRoleTask["linkedTo"], t: (en: string, ar: string) => string) {
  const meta = taskTargets.find((item) => item.id === (target ?? "client_case")) ?? taskTargets[0];
  return t(meta.label, meta.labelAr);
}

function buildLinkedOptions(
  task: ClientCaseRoleTask,
  linkedEntity: ClientCaseRoleTasksEditorProps["linkedEntity"],
  files: ClientCaseRoleTasksEditorProps["files"],
  siteTracking: ClientCaseRoleTasksEditorProps["siteTracking"],
) {
  if (task.linkedTo === "document") {
    return files.map((file) => ({
      id: file.id,
      label: `${file.displayName} - ${file.approvalStatus}`,
    }));
  }

  if (task.linkedTo === "project" && linkedEntity?.kind === "project") {
    return [{ id: linkedEntity.id, label: linkedEntity.label }];
  }

  if (task.linkedTo === "service" && linkedEntity?.kind === "service") {
    return [{ id: linkedEntity.id, label: linkedEntity.label }];
  }

  if (task.linkedTo === "site" && siteTracking) {
    return [
      {
        id: "site-progress",
        label: `${siteTracking.currentPhase ?? "Site update"} - ${siteTracking.progressPercent ?? 0}%`,
      },
    ];
  }

  return [];
}

function buildDefaultTasks(assignments: ClientCaseAssignment[]): ClientCaseRoleTask[] {
  return assignments.map((assignment) => ({
    id: `role-task-${assignment.role}`,
    role: assignment.role,
    title: roleLabels[assignment.role].defaultTask,
    status: "todo",
    linkedTo: "client_case",
    note: assignment.assignee ? `Assigned to ${assignment.assignee}` : undefined,
    updatedAt: new Date().toISOString(),
  }));
}

export function ClientCaseRoleTasksEditor({
  leadId,
  assignments,
  initialTasks,
  linkedEntity,
  files,
  siteTracking,
}: ClientCaseRoleTasksEditorProps) {
  const { t } = useAdminLocale();
  const router = useRouter();
  const [tasks, setTasks] = React.useState<ClientCaseRoleTask[]>(
    initialTasks.length ? initialTasks : buildDefaultTasks(assignments),
  );
  const [feedback, setFeedback] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setTasks(initialTasks.length ? initialTasks : buildDefaultTasks(assignments));
  }, [assignments, initialTasks]);

  const updateTask = (id: string, patch: Partial<ClientCaseRoleTask>) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    );
  };

  const saveTasks = async (nextTasks = tasks, message = t("Role tasks saved.", "تم حفظ مهام الأدوار.")) => {
    setIsSaving(true);
    setFeedback("");

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTasks: nextTasks }),
      });
      const json = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(json.message ?? t("Could not save role tasks.", "تعذر حفظ مهام الأدوار."));
      }

      setFeedback(message);
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t("Could not save role tasks.", "تعذر حفظ مهام الأدوار."));
    } finally {
      setIsSaving(false);
    }
  };

  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const blockedTasks = tasks.filter((task) => task.status === "blocked").length;
  const linkedTasks = tasks.filter((task) => task.linkedTo && task.linkedTo !== "client_case").length;
  const blockedSummary = tasks
    .filter((task) => task.status === "blocked")
    .map((task) => `${t(roleLabels[task.role].label, roleLabels[task.role].labelAr)}: ${task.title}`)
    .slice(0, 3);

  return (
    <section id="role-tasks" className="admin-shell-panel scroll-mt-6 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
            {t("Role tasks", "مهام الأدوار")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {t("What each role needs to do next", "ما المطلوب من كل دور الآن")}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-100">
            {doneTasks}/{tasks.length} {t("done", "تم")}
          </span>
          <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-rose-100">
            {blockedTasks} {t("blocked", "متعثر")}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Owner reading", "قراءة المالك")}</p>
          <p className="mt-2 text-sm leading-7 text-white/70">
            {t(
              "Every role now has a clear next action and a practical target.",
              "كل دور له إجراء تالي واضح ومرتبط بمكان تنفيذه داخل الملف.",
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Linked work", "العمل المرتبط")}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{linkedTasks}/{tasks.length}</p>
          <p className="mt-1 text-xs text-white/48">{t("tasks tied to project, service, site, or documents", "مهام مرتبطة بمشروع أو خدمة أو موقع أو مستندات")}</p>
        </div>
        <div id="blocked-role-tasks" className="scroll-mt-6 rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-rose-100/70">{t("Blocked snapshot", "ملخص التعطيل")}</p>
          <p className="mt-2 text-sm leading-7 text-white/70">
            {blockedSummary.length ? blockedSummary.join(" | ") : t("No blocked role tasks.", "لا توجد مهام أدوار متعثرة.")}
          </p>
        </div>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl border border-[#f2c16b]/20 bg-[#f2c16b]/10 px-4 py-3 text-sm text-[#f2c16b]">
          {feedback}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {tasks.map((task) => {
          const assignment = assignments.find((item) => item.role === task.role);
          const meta = roleLabels[task.role];
          const linkedOptions = buildLinkedOptions(task, linkedEntity, files, siteTracking);
          return (
            <div
              key={task.id}
              id={task.status === "blocked" ? `blocked-role-task-${task.id}` : undefined}
              className="admin-shell-muted-card scroll-mt-6 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{t(meta.label, meta.labelAr)}</p>
                  <p className="mt-1 text-xs text-white/48">
                    {assignment?.assignee || t("Unassigned", "غير معين")}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs ${getStatusTone(task.status)}`}>
                  {t(
                    task.status.replaceAll("_", " "),
                    task.status === "done"
                      ? "تم"
                      : task.status === "blocked"
                        ? "متعثر"
                        : task.status === "in_progress"
                          ? "جار العمل"
                          : "لم يبدأ",
                  )}
                </span>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
                <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {t("Task", "المهمة")}
                  <input
                    value={task.title}
                    onChange={(event) => updateTask(task.id, { title: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  />
                </label>
                <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {t("Status", "الحالة")}
                  <select
                    value={task.status}
                    onChange={(event) => updateTask(task.id, { status: event.target.value as ClientCaseRoleTaskStatus })}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  >
                    {taskStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {t(status.label, status.labelAr)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {t("Linked to", "مرتبط بـ")}
                  <select
                    value={task.linkedTo ?? "client_case"}
                    onChange={(event) =>
                      updateTask(task.id, {
                        linkedTo: event.target.value as NonNullable<ClientCaseRoleTask["linkedTo"]>,
                        linkedItemId: undefined,
                        linkedItemLabel: undefined,
                      })
                    }
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  >
                    {taskTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {t(target.label, target.labelAr)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {linkedOptions.length ? (
                <label className="mt-3 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                  {t("Linked item", "العنصر المرتبط")}
                  <select
                    value={task.linkedItemId ?? ""}
                    onChange={(event) => {
                      const selected = linkedOptions.find((item) => item.id === event.target.value);
                      updateTask(task.id, {
                        linkedItemId: selected?.id,
                        linkedItemLabel: selected?.label,
                      });
                    }}
                    className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  >
                    <option value="">{t("Choose exact item", "اختر العنصر المحدد")}</option>
                    {linkedOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : task.linkedTo && task.linkedTo !== "client_case" ? (
                <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-100">
                  {t("No exact item is available for this target yet.", "لا يوجد عنصر محدد متاح لهذا الربط بعد.")}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-white/55">
                  {t("Current target", "الهدف الحالي")}: {getTargetLabel(task.linkedTo, t)}
                </span>
                {task.linkedItemLabel ? (
                  <span className="rounded-full border border-[#f2c16b]/20 bg-[#f2c16b]/10 px-3 py-1.5 text-[#f2c16b]">
                    {task.linkedItemLabel}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-white/55">
                  {t("Updated", "آخر تحديث")}: {new Date(task.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <label className="mt-3 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                {t("Role note", "ملاحظة الدور")}
                <textarea
                  value={task.note ?? ""}
                  onChange={(event) => updateTask(task.id, { note: event.target.value || undefined })}
                  rows={2}
                  className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  placeholder={t("What should this role report or finish?", "ماذا يجب أن ينجز أو يوضح هذا الدور؟")}
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextTasks = tasks.map((item) =>
                      item.id === task.id ? { ...item, status: "done" as const, updatedAt: new Date().toISOString() } : item,
                    );
                    setTasks(nextTasks);
                    void saveTasks(nextTasks, t("Task marked as done.", "تم تعليم المهمة كمكتملة."));
                  }}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100"
                >
                  {t("Mark done", "تم")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextTasks = tasks.map((item) =>
                      item.id === task.id ? { ...item, status: "blocked" as const, updatedAt: new Date().toISOString() } : item,
                    );
                    setTasks(nextTasks);
                    void saveTasks(nextTasks, t("Task marked as blocked.", "تم تعليم المهمة كمتعطلة."));
                  }}
                  className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-100"
                >
                  {t("Mark blocked", "متعثر")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => void saveTasks()}
        disabled={isSaving}
        className="admin-shell-button-primary mt-4 rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d] disabled:opacity-50"
      >
        {isSaving ? t("Saving...", "جاري الحفظ...") : t("Save role tasks", "حفظ مهام الأدوار")}
      </button>
    </section>
  );
}
