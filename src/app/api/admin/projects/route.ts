import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";
import { getProjects, updateProjectsCatalog } from "@/lib/repository";
import type { Project } from "@/lib/types";

export async function GET() {
  const guard = await requireAdminRoute("projects.view");
  if (guard.response) return guard.response;
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function PATCH(request: Request) {
  const guard = await requireAdminRoute("projects.manage");
  if (guard.response) return guard.response;

  try {
    const payload = (await request.json()) as Project[];
    const projects = await updateProjectsCatalog(payload);
    return NextResponse.json({
      message: "Projects catalog updated successfully.",
      projects,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update projects.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
