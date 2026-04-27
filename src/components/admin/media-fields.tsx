"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";

async function uploadFiles(files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/admin/media", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    message: string;
    files?: { url: string; path: string; name: string }[];
  };

  if (!response.ok || !payload.files) {
    throw new Error(payload.message || "Upload failed.");
  }

  return payload.files;
}

type MediaDropzoneProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
};

export function MediaDropzone({ label, value, onChange, helperText }: MediaDropzoneProps) {
  const { t } = useAdminLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    setIsUploading(true);
    setStatus("");

    try {
      const [file] = await uploadFiles([fileList[0]]);
      onChange(file.url);
      setStatus(t("Uploaded successfully.", "تم الرفع بنجاح."));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("Upload failed.", "فشل الرفع."));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white/82">{label}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/5"
        >
          {isUploading ? t("Uploading...", "جاري الرفع...") : t("Choose file", "اختر ملفًا")}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.svg"
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-[22px] border border-dashed p-4 transition ${
          dragging ? "border-[#f2c16b] bg-[#f2c16b]/8" : "border-white/10 bg-black/25"
        }`}
      >
        <p className="text-sm text-white/72">
          {t("Drag and drop an image here, or use file picker.", "اسحب وأفلت صورة هنا، أو استخدم متصفح الملفات.")}
        </p>
        {helperText ? <p className="mt-1 text-xs text-white/45">{helperText}</p> : null}

        {value ? (
          <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10 bg-black/30 p-2">
            <img src={value} alt={label} className="h-32 w-full rounded-[14px] object-cover" />
          </div>
        ) : null}
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
        placeholder={t("Image URL", "رابط الصورة (URL)")}
      />

      {status ? <p className="text-xs text-[#f2c16b]">{status}</p> : null}
    </div>
  );
}

type MediaGalleryFieldProps = {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  helperText?: string;
};

export function MediaGalleryField({ label, values, onChange, helperText }: MediaGalleryFieldProps) {
  const { t } = useAdminLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    setIsUploading(true);
    setStatus("");

    try {
      const uploaded = await uploadFiles(Array.from(fileList));
      onChange([...values, ...uploaded.map((file) => file.url)]);
      setStatus(t("Gallery updated.", "تم تحديث المعرض."));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("Upload failed.", "فشل الرفع."));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white/82">{label}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/5"
        >
          {isUploading ? t("Uploading...", "جاري الرفع...") : t("Add images", "أضف صورًا")}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.svg"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-[22px] border border-dashed p-4 transition ${
          dragging ? "border-[#f2c16b] bg-[#f2c16b]/8" : "border-white/10 bg-black/25"
        }`}
      >
        <p className="text-sm text-white/72">
          {t("Drag and drop one or more images here.", "اسحب وأفلت صورة أو أكثر هنا.")}
        </p>
        {helperText ? <p className="mt-1 text-xs text-white/45">{helperText}</p> : null}
      </div>

      {values.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {values.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="overflow-hidden rounded-[18px] border border-white/10 bg-black/30 p-2"
            >
              <img src={url} alt={`${label} ${index + 1}`} className="h-24 w-full rounded-[12px] object-cover" />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange(values.filter((_, currentIndex) => currentIndex !== index))}
                  className="flex-1 rounded-xl border border-red-400/30 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10"
                >
                  {t("Delete", "حذف")}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <textarea
        value={values.join(", ")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
        className="min-h-24 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
        placeholder={t("Comma-separated image URLs", "عناوين صور مفصولة بفاصلة (,)")}
      />

      {status ? <p className="text-xs text-[#f2c16b]">{status}</p> : null}
    </div>
  );
}
