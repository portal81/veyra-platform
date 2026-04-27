import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";
import { createSupabaseServerClient } from "@/lib/supa";

const BUCKET_NAME = "veyra-documents";

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

async function ensureDocumentsBucket() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for document uploads.");
  }

  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    throw new Error(bucketsError.message);
  }

  const exists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 25 * 1024 * 1024,
      allowedMimeTypes,
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new Error(createError.message);
    }
  }

  return supabase;
}

function safeFilename(name: string) {
  const extension = name.includes(".") ? name.split(".").pop() : "file";
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "document"}.${extension}`;
}

export async function POST(request: Request) {
  const guard = await requireAdminRoute("documents.upload");
  if (guard.response) return guard.response;

  try {
    const formData = await request.formData();
    const leadId = String(formData.get("leadId") ?? "unlinked").replace(/[^a-zA-Z0-9-_]/g, "-");
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!files.length) {
      return NextResponse.json({ message: "No files were provided." }, { status: 400 });
    }

    const supabase = await ensureDocumentsBucket();
    const uploads: { path: string; url: string; name: string; mimeType: string; size: number }[] = [];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.type)) {
        return NextResponse.json(
          { message: `Unsupported document type for ${file.name}.` },
          { status: 400 },
        );
      }

      const path = `client-cases/${leadId}/${Date.now()}-${crypto.randomUUID()}-${safeFilename(file.name)}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
      uploads.push({
        path,
        url: data.publicUrl,
        name: file.name,
        mimeType: file.type,
        size: file.size,
      });
    }

    return NextResponse.json({
      message: "Documents uploaded successfully.",
      files: uploads,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document upload failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
