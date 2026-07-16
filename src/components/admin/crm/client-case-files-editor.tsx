"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type {
  ClientCaseDocumentType,
  ClientCaseFile,
  ClientCaseFileApprovalStatus,
} from "@/lib/types";

type ClientCaseFilesEditorProps = {
  leadId: string;
  initialFiles: ClientCaseFile[];
};

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
  { id: "submitted", label: "Submitted", labelAr: "بانتظار المراجعة" },
  { id: "approved", label: "Approved", labelAr: "معتمد" },
  { id: "rejected", label: "Rejected", labelAr: "مرفوض" },
];

function getFileStatusTone(status: ClientCaseFileApprovalStatus) {
  if (status === "approved") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "rejected") return "border-rose-400/20 bg-rose-400/10 text-rose-100";
  if (status === "submitted") return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-white/10 bg-white/5 text-white/65";
}

function inferDocumentType(file: File): ClientCaseDocumentType {
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
}

export function ClientCaseFilesEditor({ leadId, initialFiles }: ClientCaseFilesEditorProps) {
  const { t } = useAdminLocale();
  const router = useRouter();
  const [files, setFiles] = React.useState<ClientCaseFile[]>(initialFiles);
  const [feedback, setFeedback] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [newFile, setNewFile] = React.useState({
    displayName: "",
    storagePath: "",
    documentType: "contract" as ClientCaseDocumentType,
    approvalStatus: "submitted" as ClientCaseFileApprovalStatus,
    uploadedBy: "",
    linkedTo: "client_case" as NonNullable<ClientCaseFile["linkedTo"]>,
  });

  React.useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const commitFiles = async (nextFiles: ClientCaseFile[], message: string) => {
    setFiles(nextFiles);
    setIsSaving(true);
    setFeedback("");

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseFiles: nextFiles }),
      });
      const json = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(json.message ?? t("Could not save files.", "تعذر حفظ الملفات."));
      }

      setFeedback(message);
      router.refresh();
    } catch (error) {
      setFiles(files);
      setFeedback(error instanceof Error ? error.message : t("Could not save files.", "تعذر حفظ الملفات."));
    } finally {
      setIsSaving(false);
    }
  };

  const updateFileDraft = (id: string, patch: Partial<ClientCaseFile>) => {
    setFiles((current) => current.map((file) => (file.id === id ? { ...file, ...patch } : file)));
  };

  const commitFileStatus = (id: string, approvalStatus: ClientCaseFileApprovalStatus) => {
    const nextFiles = files.map((file) => (file.id === id ? { ...file, approvalStatus } : file));
    const message =
      approvalStatus === "approved"
        ? t("Document approved and saved.", "تم اعتماد المستند وحفظه.")
        : approvalStatus === "rejected"
          ? t("Document rejected and saved.", "تم رفض المستند وحفظه.")
          : t("Document sent to review and saved.", "تم إرسال المستند للمراجعة وحفظه.");
    void commitFiles(nextFiles, message);
  };

  const addManualFile = () => {
    const displayName = newFile.displayName.trim();
    const storagePath = newFile.storagePath.trim();

    if (!displayName || !storagePath) {
      setFeedback(t("Add a document name and link/path first.", "أضف اسم المستند والرابط أو المسار أولًا."));
      return;
    }

    const nextFiles = [
      {
        id: `case-file-${crypto.randomUUID()}`,
        displayName,
        documentType: newFile.documentType,
        storagePath,
        approvalStatus: newFile.approvalStatus,
        uploadedBy: newFile.uploadedBy.trim() || undefined,
        linkedTo: newFile.linkedTo,
        createdAt: new Date().toISOString(),
      },
      ...files,
    ];

    setNewFile({
      displayName: "",
      storagePath: "",
      documentType: "contract",
      approvalStatus: "submitted",
      uploadedBy: "",
      linkedTo: "client_case",
    });
    void commitFiles(nextFiles, t("Document added and saved.", "تمت إضافة المستند وحفظه."));
  };

  const uploadCaseDocument = async (file: File) => {
    setIsUploading(true);
    setFeedback("");

    try {
      const formData = new FormData();
      formData.append("leadId", leadId);
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
      const uploadedFile: ClientCaseFile = {
        id: `case-file-${crypto.randomUUID()}`,
        displayName: uploaded.name,
        documentType: inferDocumentType(file),
        storagePath: uploaded.url,
        approvalStatus: "submitted",
        uploadedBy: "Admin",
        linkedTo: "client_case",
        createdAt: new Date().toISOString(),
      };

      await commitFiles(
        [uploadedFile, ...files],
        t("Document uploaded, attached, and sent to review.", "تم رفع المستند وربطه وإرساله للمراجعة."),
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t("Document upload failed.", "فشل رفع المستند."));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="files-review" className="mt-4 grid scroll-mt-6 gap-4">
      {feedback ? (
        <p className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-3 text-sm text-brand-gold">
          {feedback}
        </p>
      ) : null}

      <label className="grid gap-2 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-[11px] uppercase tracking-[0.18em] text-white/42">
        {t("Upload real file", "رفع ملف فعلي")}
        <input
          type="file"
          disabled={isUploading || isSaving}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadCaseDocument(file);
            event.currentTarget.value = "";
          }}
          className="text-sm normal-case tracking-normal text-white file:mr-4 file:rounded-full file:border-0 file:bg-brand-gold file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1d140d] disabled:opacity-50"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/png,image/jpeg,image/webp"
        />
        <span className="text-xs normal-case tracking-normal text-white/55">
          {isUploading
            ? t("Uploading document...", "جاري رفع المستند...")
            : t("PDF, Word, Excel, text, or image files up to 25MB.", "PDF أو Word أو Excel أو نص أو صور حتى 25MB.")}
        </span>
      </label>

      <div className="grid gap-3">
        {files.length ? (
          files.map((file) => (
            <div
              key={file.id}
              id={file.approvalStatus === "submitted" || file.approvalStatus === "rejected" ? `file-action-${file.id}` : undefined}
              className="admin-shell-muted-card scroll-mt-6 p-4"
            >
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
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75 transition hover:border-brand-gold/40 hover:text-brand-gold"
                    >
                      {t("Open file", "فتح الملف")}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      void commitFiles(
                        files.filter((item) => item.id !== file.id),
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
                  onClick={() => commitFileStatus(file.id, "submitted")}
                  className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100"
                >
                  {t("Send to review", "إرسال للمراجعة")}
                </button>
                <button
                  type="button"
                  onClick={() => commitFileStatus(file.id, "approved")}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100"
                >
                  {t("Approve", "اعتماد")}
                </button>
                <button
                  type="button"
                  onClick={() => commitFileStatus(file.id, "rejected")}
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
                      updateFileDraft(file.id, { documentType: event.target.value as ClientCaseDocumentType })
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
                      updateFileDraft(file.id, { approvalStatus: event.target.value as ClientCaseFileApprovalStatus })
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
                    onChange={(event) => updateFileDraft(file.id, { uploadedBy: event.target.value || undefined })}
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

      <div className="admin-shell-muted-card grid gap-3 p-4 sm:grid-cols-2">
        <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
          {t("Document name", "اسم المستند")}
          <input
            value={newFile.displayName}
            onChange={(event) => setNewFile((current) => ({ ...current, displayName: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            placeholder={t("Signed contract, invoice, site photo...", "عقد موقع، فاتورة، صورة موقع...")}
          />
        </label>
        <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
          {t("Link or path", "الرابط أو المسار")}
          <input
            value={newFile.storagePath}
            onChange={(event) => setNewFile((current) => ({ ...current, storagePath: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            placeholder={t("Paste file link or storage path", "ضع رابط الملف أو مساره")}
            dir="ltr"
          />
        </label>
        <label className="grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
          {t("Document type", "نوع المستند")}
          <select
            value={newFile.documentType}
            onChange={(event) =>
              setNewFile((current) => ({ ...current, documentType: event.target.value as ClientCaseDocumentType }))
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
            value={newFile.approvalStatus}
            onChange={(event) =>
              setNewFile((current) => ({ ...current, approvalStatus: event.target.value as ClientCaseFileApprovalStatus }))
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
        <button
          type="button"
          onClick={addManualFile}
          disabled={isSaving}
          className="admin-shell-button-primary rounded-full px-4 py-3 text-sm font-semibold text-[#1d140d] disabled:opacity-50 sm:col-span-2"
        >
          {t("Add document and save", "إضافة المستند وحفظه")}
        </button>
        <button
          type="button"
          onClick={() => void commitFiles(files, t("File details saved.", "تم حفظ تفاصيل الملفات."))}
          disabled={isSaving}
          className="admin-shell-button-secondary rounded-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2"
        >
          {isSaving ? t("Saving...", "جاري الحفظ...") : t("Save edited file details", "حفظ تفاصيل الملفات المعدلة")}
        </button>
      </div>
    </div>
  );
}
