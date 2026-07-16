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
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Invalid services payload." }, { status: 400 });
    }
    const catalog = await updateServiceCatalog(body as ServiceCatalog);
    return NextResponse.json({
      message: "Service catalog updated successfully.",
      catalog,
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update services." }, { status: 400 });
  }
}
