import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";
import { createSupabaseServerClient } from "@/lib/supa";

const BUCKET_NAME = "veyra-assets";

async function ensureBucket() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for media uploads.");
  }

  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    throw new Error(bucketsError.message);
  }

  const exists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new Error(createError.message);
    }
  }

  return supabase;
}

export async function POST(request: Request) {
  const guard = await requireAdminRoute("media.upload");
  if (guard.response) return guard.response;

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!files.length) {
      return NextResponse.json({ message: "No files were provided." }, { status: 400 });
    }

    const supabase = await ensureBucket();
    const uploads: { path: string; url: string; name: string }[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/") && file.type !== "image/svg+xml") {
        return NextResponse.json(
          { message: `Unsupported file type for ${file.name}.` },
          { status: 400 },
        );
      }

      const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
      const safeName = file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const path = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName || "asset"}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
      uploads.push({ path, url: data.publicUrl, name: file.name });
    }

    return NextResponse.json({
      message: "Media uploaded successfully.",
      files: uploads,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media upload failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
