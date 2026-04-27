import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";
import { getServiceCatalog, updateServiceCatalog } from "@/lib/repository";
import type { ServiceCatalog } from "@/lib/types";

export async function GET() {
  const guard = await requireAdminRoute("services.manage");
  if (guard.response) return guard.response;
  const catalog = await getServiceCatalog();
  return NextResponse.json(catalog);
}

export async function PATCH(request: Request) {
  const guard = await requireAdminRoute("services.manage");
  if (guard.response) return guard.response;

  try {
    const payload = (await request.json()) as ServiceCatalog;
    const catalog = await updateServiceCatalog(payload);
    return NextResponse.json({
      message: "Service catalog updated successfully.",
      catalog,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update services.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
