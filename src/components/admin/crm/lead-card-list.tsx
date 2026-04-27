import React from "react";
import Link from "next/link";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type { ClientCaseFileApprovalStatus, Lead, LeadPriority, LeadStage, TeamUser } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type LeadCardListProps = {
  lead: Lead;
  selectedLeadIds: string[];
  toggleLeadSelection: (id: string) => void;
  priorityAccent: Record<LeadPriority, string>;
  stages: Array<{ id: string; label: string; labelAr: string }>;
  priorities: LeadPriority[];
  users: TeamUser[];
  updateLead: (id: string, payload: any) => void;
  noteDrafts: Record<string, string>;
  setNoteDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  lostReasonDrafts: Record<string, string>;
  setLostReasonDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDrawerFeedback: (msg: string) => void;
  openQuickEditLead: (id: string, mode: "overview" | "team" | "files") => void;
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
    return t("First contact and qualification call.", "ابدأ أول اتصال وحدد مدى جدية العميل.");
  }
  if (lead.stage === "contacted") {
    return t("Confirm budget, need, and qualified fit.", "أكد الميزانية والاحتياج وهل العميل مناسب.");
  }
  if (lead.stage === "qualified") {
    return t("Schedule the site visit or service consultation.", "رتب الزيارة أو الاستشارة التالية.");
  }
  if (lead.stage === "site_visit") {
    return t("Send recap and move toward offer discussion.", "ابعت ملخص الزيارة وابدأ مناقشة العرض.");
  }
  if (lead.stage === "negotiation") {
    return t("Push for decision, close, or capture blocker.", "ادفع نحو القرار النهائي أو سجل سبب التعطيل.");
  }
  if (lead.stage === "closed_won") {
    return t("Hand over cleanly and document the winning path.", "أكمل التسليم وسجل سبب كسب الصفقة.");
  }
  return t("Capture the exact lost reason and review the source.", "سجل سبب الخسارة بدقة وراجع مصدر العميل.");
}

function getFileStatusTone(status: ClientCaseFileApprovalStatus) {
  if (status === "approved") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "rejected") return "border-rose-400/20 bg-rose-400/10 text-rose-100";
  if (status === "submitted") return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-white/10 bg-white/5 text-white/65";
}

export function LeadCardList({
  lead,
  selectedLeadIds,
  toggleLeadSelection,
  priorityAccent,
  stages,
  priorities,
  users,
  updateLead,
  noteDrafts,
  setNoteDrafts,
  lostReasonDrafts,
  setLostReasonDrafts,
  setDrawerFeedback,
  openQuickEditLead,
}: LeadCardListProps) {
  const { t } = useAdminLocale();
  const slaState = getLeadSlaState(lead);
  const nextAction = getLeadNextAction(lead, t);
  const leadAge = getLeadAgeInDays(lead.createdAt);
  const assignedRoles = lead.caseAssignments?.filter((item) => item.assignee) ?? [];
  const readiness = lead.deliveryReadiness;
  const siteTracking = lead.siteTracking;
  const caseFiles = lead.caseFiles ?? [];
  const approvedCaseFiles = caseFiles.filter((file) => file.approvalStatus === "approved").length;
  const submittedCaseFiles = caseFiles.filter((file) => file.approvalStatus === "submitted").length;

  return (
    <article className="admin-shell-card min-w-0 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <label className="mb-2 inline-flex items-center gap-2 text-xs text-white/65">
            <input
              type="checkbox"
              checked={selectedLeadIds.includes(lead.id)}
              onChange={() => toggleLeadSelection(lead.id)}
            />
            {t("Select", "تحديد")}
          </label>
          <h4 className="break-words text-xl font-semibold text-white">{lead.fullName}</h4>
          <p className="mt-2 break-words text-xs uppercase tracking-[0.24em] text-[#f2c16b]">{lead.service}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!lead.assignedTo ? (
            <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-rose-200">
              {t("Needs owner", "يحتاج مسؤول")}
            </span>
          ) : null}
          {leadAge >= 3 ? (
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-sky-200">
              {t(`${leadAge}d open`, `مفتوح منذ ${leadAge} يوم`)}
            </span>
          ) : null}
          <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${priorityAccent[lead.priority]}`}>
            {t(lead.priority, lead.priority === "high" ? "عالي" : lead.priority === "medium" ? "متوسط" : "منخفض")}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/58">
            {lead.status}
          </span>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="admin-shell-muted-card p-3">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Phone", "الهاتف")}</dt>
          <dd className="mt-2 text-sm text-white/82" dir="ltr">{lead.phone}</dd>
        </div>
        <div className="admin-shell-muted-card p-3">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Email", "البريد الإلكتروني")}</dt>
          <dd className="mt-2 break-all text-sm text-white/82" dir="ltr">{lead.email ?? t("Not provided", "غير متوفر")}</dd>
        </div>
        <div className="admin-shell-muted-card p-3">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Source", "المصدر")}</dt>
          <dd className="mt-2 break-words text-sm text-white/82">{lead.source ?? t("Direct lead", "عميل مباشر")}</dd>
        </div>
        <div className="admin-shell-muted-card p-3">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Budget", "الميزانية")}</dt>
          <dd className="mt-2 text-sm text-white/82">{lead.budget ? formatCurrency(lead.budget) : t("Not specified", "غير محدد")}</dd>
        </div>
        <div className="admin-shell-muted-card p-3 sm:col-span-2">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Created", "تاريخ الإضافة")}</dt>
          <dd className="mt-2 text-sm text-white/82">{formatDate(lead.createdAt)}</dd>
        </div>
      </dl>

      {lead.message ? (
        <div className="admin-shell-muted-card mt-5 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Lead note", "رسالة العميل")}</p>
          <p className="mt-3 break-words text-sm leading-7 text-white/72" dir="auto">{lead.message}</p>
        </div>
      ) : null}

      <div className="admin-shell-muted-card mt-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Case team", "فريق الملف")}</p>
            <p className="mt-2 text-sm text-white/78">
              {assignedRoles.length
                ? t(
                    `${assignedRoles.length} role(s) assigned`,
                    `تم إسناد ${assignedRoles.length} دور/أدوار`,
                  )
                : t("No execution roles assigned yet.", "لم يتم إسناد أدوار التنفيذ بعد.")}
            </p>
          </div>
          <Link
            href={`/admin/leads/${lead.id}#team`}
            className="admin-shell-button-ghost rounded-full px-3 py-2 text-xs text-white/75"
          >
            {t("Edit case team", "تعديل فريق الملف")}
          </Link>
        </div>
        {assignedRoles.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {assignedRoles.slice(0, 4).map((assignment) => (
              <span
                key={`${lead.id}-${assignment.role}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/72"
              >
                {assignment.role}: {assignment.assignee}
              </span>
            ))}
            {assignedRoles.length > 4 ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/52">
                +{assignedRoles.length - 4}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="admin-shell-muted-card mt-5 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Execution link", "ربط التنفيذ")}</p>
        <p className="mt-2 text-sm text-white/78">
          {lead.linkedEntity
            ? lead.linkedEntity.kind === "project"
              ? t(`Linked project: ${lead.linkedEntity.label}`, `المشروع المرتبط: ${lead.linkedEntity.label}`)
              : t(`Linked service: ${lead.linkedEntity.label}`, `الخدمة المرتبطة: ${lead.linkedEntity.label}`)
            : t("No project or service linked yet.", "لا يوجد مشروع أو خدمة مرتبطة بعد.")}
        </p>
      </div>

      <div className="admin-shell-muted-card mt-5 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Delivery readiness", "جاهزية التنفيذ")}</p>
        <p className="mt-2 text-sm text-white/78">
          {readiness
            ? t(
                `Status: ${readiness.status.replaceAll("_", " ")}`,
                `الحالة: ${readiness.status === "not_started"
                  ? "لم يبدأ"
                  : readiness.status === "needs_assignment"
                    ? "يحتاج إسناد"
                    : readiness.status === "ready_for_delivery"
                      ? "جاهز للتنفيذ"
                      : readiness.status === "in_progress"
                        ? "جارٍ التنفيذ"
                        : readiness.status === "blocked"
                          ? "متعثر"
                          : "مكتمل"}`,
              )
            : t("No delivery readiness recorded yet.", "لم يتم تسجيل جاهزية التنفيذ بعد.")}
        </p>
        {readiness ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/72">
              {t(
                `Site: ${readiness.siteState.replaceAll("_", " ")}`,
                `الموقع: ${readiness.siteState === "existing"
                  ? "قائم"
                  : readiness.siteState === "under_construction"
                    ? "تحت الإنشاء"
                    : "لم يبدأ"}`,
              )}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/72">
              {t(
                `${Object.values(readiness.checklist).filter(Boolean).length}/4 checks ready`,
                `${Object.values(readiness.checklist).filter(Boolean).length}/4 عناصر جاهزة`,
              )}
            </span>
          </div>
        ) : null}
      </div>

      <div className="admin-shell-muted-card mt-5 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Site tracking", "متابعة الموقع")}</p>
        <p className="mt-2 text-sm text-white/78">
          {siteTracking
            ? t(
                `${siteTracking.progressPercent}% progress in ${siteTracking.currentPhase}`,
                `${siteTracking.progressPercent}% تقدم في مرحلة ${siteTracking.currentPhase}`,
              )
            : t("No site update recorded yet.", "لم يتم تسجيل تحديث موقع بعد.")}
        </p>
        {siteTracking ? (
          <div className="mt-3 grid gap-2">
            {siteTracking.siteName ? (
              <p className="text-xs text-white/58">
                {t(`Site: ${siteTracking.siteName}`, `الموقع: ${siteTracking.siteName}`)}
              </p>
            ) : null}
            <p className="text-xs text-white/58">
              {t(`Last update: ${siteTracking.lastUpdate}`, `آخر تحديث: ${siteTracking.lastUpdate}`)}
            </p>
            {siteTracking.blocker ? (
              <p className="text-xs text-rose-200">
                {t(`Blocker: ${siteTracking.blocker}`, `العائق: ${siteTracking.blocker}`)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="admin-shell-muted-card mt-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Case files", "ملفات العميل")}</p>
            <p className="mt-2 text-sm text-white/78">
              {caseFiles.length
                ? t(
                    `${caseFiles.length} document(s), ${approvedCaseFiles} approved`,
                    `${caseFiles.length} مستند/مستندات، ${approvedCaseFiles} معتمد`,
                  )
                : t("No documents attached yet.", "لا توجد مستندات مرفقة بعد.")}
            </p>
          </div>
          <Link
            href={`/admin/leads/${lead.id}#files`}
            className="admin-shell-button-ghost rounded-full px-3 py-2 text-xs text-white/75"
          >
            {t("Manage files", "إدارة الملفات")}
          </Link>
        </div>
        {caseFiles.length ? (
          <div className="mt-3 grid gap-2">
            {submittedCaseFiles ? (
              <span className="w-fit rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-100">
                {t(`${submittedCaseFiles} pending review`, `${submittedCaseFiles} بانتظار المراجعة`)}
              </span>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {caseFiles.slice(0, 3).map((file) => {
                const statusLabel =
                  file.approvalStatus === "approved"
                    ? t("Approved", "معتمد")
                    : file.approvalStatus === "rejected"
                      ? t("Rejected", "مرفوض")
                      : file.approvalStatus === "submitted"
                        ? t("Review", "مراجعة")
                        : t("Draft", "مسودة");

                return file.storagePath ? (
                  <a
                    key={file.id}
                    href={file.storagePath}
                    target="_blank"
                    rel="noreferrer"
                    className={`rounded-full border px-3 py-1 text-[11px] transition hover:border-[#f2c16b]/40 hover:text-[#f2c16b] ${getFileStatusTone(file.approvalStatus)}`}
                  >
                    {file.displayName} · {statusLabel}
                  </a>
                ) : (
                  <span
                    key={file.id}
                    className={`rounded-full border px-3 py-1 text-[11px] ${getFileStatusTone(file.approvalStatus)}`}
                  >
                    {file.displayName} · {statusLabel}
                  </span>
                );
              })}
            </div>
            {caseFiles.length > 3 ? (
              <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/52">
                +{caseFiles.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {lead.lostReason ? (
        <div className="mt-5 rounded-[20px] border border-rose-400/20 bg-rose-400/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-rose-200">{t("Lost reason", "سبب الخسارة")}</p>
          <p className="mt-3 break-words text-sm leading-7 text-rose-100/90" dir="auto">{lead.lostReason}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-[20px] border p-4 ${
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
              ? t("This lead is already in a closed stage.", "هذا العميل في مرحلة مغلقة بالفعل.")
              : t(`${leadAge} day(s) since capture.`, `مر ${leadAge} يوم منذ دخول العميل.`)}
          </p>
        </div>

        <div className="admin-shell-muted-card p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{t("Next action", "الخطوة التالية")}</p>
          <p className="mt-2 text-sm leading-7 text-white/82">{nextAction}</p>
        </div>
      </div>

      <div className="admin-shell-panel mt-5 grid gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
            {t("Stage", "المرحلة")}
            <select
              value={lead.stage}
              onChange={(event) => updateLead(lead.id, { stage: event.target.value as LeadStage })}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            >
              {stages.map((option) => (
                <option key={option.id} value={option.id}>{t(option.label, option.labelAr)}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
            {t("Priority", "الأولوية")}
            <select
              value={lead.priority}
              onChange={(event) => updateLead(lead.id, { priority: event.target.value as LeadPriority })}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>{t(priority, priority === "high" ? "عالي" : priority === "medium" ? "متوسط" : "منخفض")}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
          {t("Assigned to", "مُعين إلى")}
          <select
            value={lead.assignedTo ?? ""}
            onChange={(event) => updateLead(lead.id, { assignedTo: event.target.value || undefined })}
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
          >
            <option value="">{t("Unassigned", "غير مُعين")}</option>
            {users.map((user) => (
              <option key={user.id} value={user.fullName}>{user.fullName}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
          {t("Quick note", "ملاحظة سريعة")}
          <textarea
            value={noteDrafts[lead.id] ?? ""}
            onChange={(event) => setNoteDrafts((current) => ({ ...current, [lead.id]: event.target.value }))}
            rows={4}
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            placeholder={t("Add a follow-up note, visit reminder, or sales update...", "أضف ملاحظة متابعة، أو تذكير بزيارة، أو تحديث مبيعات...")}
          />
        </label>

        {lead.stage === "closed_lost" ? (
          <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
            {t("Lost reason", "سبب الخسارة")}
            <textarea
              value={lostReasonDrafts[lead.id] ?? ""}
              onChange={(event) => setLostReasonDrafts((current) => ({ ...current, [lead.id]: event.target.value }))}
              rows={3}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
              placeholder={t("Capture why this deal was lost...", "اذكر سبب خسارة هذه الصفقة...")}
            />
          </label>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => updateLead(lead.id, { note: noteDrafts[lead.id] })}
            disabled={!noteDrafts[lead.id]?.trim()}
            className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("Save note", "حفظ الملاحظة")}
          </button>

          {lead.stage === "closed_lost" ? (
            <button
              type="button"
              onClick={() => updateLead(lead.id, { lostReason: lostReasonDrafts[lead.id] })}
              disabled={!lostReasonDrafts[lead.id]?.trim()}
              className="admin-shell-button-secondary rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Save lost reason", "حفظ سبب الخسارة")}
            </button>
          ) : null}
        </div>

        <Link
          href={`/admin/leads/${lead.id}`}
          className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-3 text-center text-sm font-semibold text-[#f2c16b] transition hover:-translate-y-0.5"
        >
          {t("Open client case", "فتح ملف العميل")}
        </Link>

        <button
          type="button"
          onClick={() => {
            setDrawerFeedback("");
            openQuickEditLead(lead.id, "overview");
          }}
          className="rounded-full border border-white/12 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          {t("Quick edit drawer", "فتح التعديل السريع")}
        </button>
      </div>
    </article>
  );
}
