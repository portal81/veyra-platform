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
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ message: "Projects payload must be an array." }, { status: 400 });
    }
    const projects = await updateProjectsCatalog(body as Project[]);
    return NextResponse.json({
      message: "Projects catalog updated successfully.",
      projects,
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update projects." }, { status: 400 });
  }
}
