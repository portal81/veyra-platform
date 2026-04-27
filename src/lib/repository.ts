import { demoStore } from "@/lib/demo-store";
import { blogCategories as fallbackBlogCategories, blogPosts as fallbackBlogPosts, blogTags as fallbackBlogTags, seoPageConfigs as fallbackSeoPages } from "@/lib/blog-seo-mock";
import { dashboardStats, finishingPackages, projects as fallbackProjects, siteSettings as fallbackSiteSettings, smartDevices, smartPackages } from "@/lib/mock-data";
import { resolvePermissions } from "@/lib/permissions";
import { defaultPageContent, defaultSiteLayouts, defaultSystemBlocks } from "@/lib/site-content-defaults";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supa";
import { repairTextDeep } from "@/lib/text-fixes";
import type {
  ClientCase,
  ClientCaseAssignment,
  ClientCaseExecutionStatus,
  ClientCaseSnapshot,
  CrmSnapshot,
  FinishingPackage,
  Lead,
  LeadActivity,
  PermissionKey,
  Project,
  ServiceCatalog,
  SiteSettings,
  SmartDevice,
  SmartPackage,
  TeamUser,
  UserInvitation,
  AccessMode,
  BlogPost,
  MarketingTrackingSettings,
  SeoPageConfig,
  ClientCaseFile,
  ClientCaseLink,
  ClientCaseRoleTask,
  DeliveryReadiness,
  SiteTracking,
  UserRole,
} from "@/lib/types";

function isBrandAsset(value?: string | null) {
  return Boolean(value && /veyra-logo|veyra-mark|\/brand\//i.test(value));
}

function resolveMedia(current?: string | null, fallback?: string | null) {
  if (!current || isBrandAsset(current)) {
    return fallback ?? current ?? "";
  }

  return current;
}

function mergeProject(project: Project): Project {
  const fallback = fallbackProjects.find((item) => item.id === project.id);
  const unitsSource = project.units?.length ? project.units : fallback?.units ?? [];

  return repairTextDeep({
    ...fallback,
    ...project,
    heroImage: resolveMedia(project.heroImage, fallback?.heroImage),
    gallery:
      project.gallery?.length
        ? project.gallery.map((image, index) =>
            resolveMedia(image, fallback?.gallery?.[index] ?? fallback?.heroImage),
          )
        : fallback?.gallery ?? [],
    content: {
      ...fallback?.content,
      ...project.content,
    },
    units: unitsSource.map((unit) => {
      const fallbackUnit = fallback?.units.find((candidate) => candidate.id === unit.id);

      return {
        ...fallbackUnit,
        ...unit,
        image: resolveMedia(unit.image, fallbackUnit?.image ?? fallback?.heroImage),
      };
    }),
    highlights: project.highlights ?? fallback?.highlights ?? [],
  });
}

function mergeFinishingPackage(item: FinishingPackage): FinishingPackage {
  const fallback = finishingPackages.find((candidate) => candidate.id === item.id);
  return repairTextDeep({
    ...fallback,
    ...item,
    content: {
      ...fallback?.content,
      ...item.content,
    },
    features: item.features ?? fallback?.features ?? [],
  });
}

async function ensureCrmSeeded(supabase: ReturnType<typeof createSupabaseServerClient>) {
  if (!supabase) {
    return;
  }

  const [{ count: leadCount, error: leadCountError }, { count: activityCount, error: activityCountError }] =
    await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("lead_activities").select("id", { count: "exact", head: true }),
    ]);

  if (leadCountError) {
    throw new Error(leadCountError.message);
  }

  if (activityCountError) {
    throw new Error(activityCountError.message);
  }

  if (!leadCount) {
    const seedLeads = repairTextDeep(demoStore.leads);
    const { error: seedLeadsError } = await supabase.from("leads").upsert(seedLeads);
    if (seedLeadsError) {
      throw new Error(seedLeadsError.message);
    }
  }

  if (!activityCount) {
    const seedActivities = repairTextDeep(demoStore.leadActivities);
    const { error: seedActivitiesError } = await supabase.from("lead_activities").upsert(seedActivities);
    if (seedActivitiesError) {
      throw new Error(seedActivitiesError.message);
    }
  }
}

function mergeSmartDevice(item: SmartDevice): SmartDevice {
  const fallback = smartDevices.find((candidate) => candidate.id === item.id);
  return repairTextDeep({
    ...fallback,
    ...item,
    content: {
      ...fallback?.content,
      ...item.content,
    },
    benefits: item.benefits ?? fallback?.benefits ?? [],
  });
}

function mergeSmartPackage(item: SmartPackage): SmartPackage {
  const fallback = smartPackages.find((candidate) => candidate.id === item.id);
  return repairTextDeep({
    ...fallback,
    ...item,
    content: {
      ...fallback?.content,
      ...item.content,
    },
    devices: item.devices ?? fallback?.devices ?? [],
  });
}

function mergeSiteSettings(input?: Partial<SiteSettings> | null): SiteSettings {
  if (!input) {
    return repairTextDeep(structuredClone(fallbackSiteSettings));
  }
  const hazemFromContent = (input as Record<string, unknown>)?.content
    ? ((input as Record<string, unknown>).content as Record<string, unknown>)?.hazemAi
    : undefined;
  const hazemInput = (input.hazemAi ?? hazemFromContent) as SiteSettings["hazemAi"] | undefined;

  return repairTextDeep({
    ...fallbackSiteSettings,
    ...input,
    branding: {
      ...fallbackSiteSettings.branding,
      ...input.branding,
      logoAlt: {
        ...fallbackSiteSettings.branding.logoAlt,
        ...input.branding?.logoAlt,
      },
    },
    supportedLocales: input.supportedLocales ?? fallbackSiteSettings.supportedLocales,
    palettes: [
      ...fallbackSiteSettings.palettes,
      ...(input.palettes ?? []).filter(
        (candidate) => !fallbackSiteSettings.palettes.some((fallback) => fallback.id === candidate.id),
      ),
    ],
    hazemAi: {
      ...fallbackSiteSettings.hazemAi,
      ...hazemInput,
      systemPrompts: {
        ...fallbackSiteSettings.hazemAi.systemPrompts,
        ...hazemInput?.systemPrompts,
      },
      analysis: {
        ...fallbackSiteSettings.hazemAi.analysis,
        ...hazemInput?.analysis,
        autoInsights:
          hazemInput?.analysis?.autoInsights ?? fallbackSiteSettings.hazemAi.analysis.autoInsights,
      },
    },
    content: {
      ...fallbackSiteSettings.content,
      ...input.content,
      nav: {
        ...fallbackSiteSettings.content.nav,
        ...input.content?.nav,
      },
      hero: {
        ...fallbackSiteSettings.content.hero,
        ...input.content?.hero,
      },
      footer: {
        ...fallbackSiteSettings.content.footer,
        ...input.content?.footer,
      },
      leadForm: {
        ...fallbackSiteSettings.content.leadForm,
        ...input.content?.leadForm,
      },
      calculators: {
        installment: {
          ...fallbackSiteSettings.content.calculators.installment,
          ...input.content?.calculators?.installment,
        },
        finishing: {
          ...fallbackSiteSettings.content.calculators.finishing,
          ...input.content?.calculators?.finishing,
        },
      },
      pages: {
        ...defaultPageContent,
        ...input.content?.pages,
        home: {
          ...defaultPageContent.home,
          ...input.content?.pages?.home,
          serviceLines: input.content?.pages?.home?.serviceLines ?? defaultPageContent.home.serviceLines,
          marketSignals: input.content?.pages?.home?.marketSignals ?? defaultPageContent.home.marketSignals,
          ribbons: input.content?.pages?.home?.ribbons ?? defaultPageContent.home.ribbons,
          dashboardStats: input.content?.pages?.home?.dashboardStats ?? defaultPageContent.home.dashboardStats,
          intentCards: input.content?.pages?.home?.intentCards ?? defaultPageContent.home.intentCards,
          trustItems: input.content?.pages?.home?.trustItems ?? defaultPageContent.home.trustItems,
          bookingItems: input.content?.pages?.home?.bookingItems ?? defaultPageContent.home.bookingItems,
        },
        projects: {
          ...defaultPageContent.projects,
          ...input.content?.pages?.projects,
          compareItems: input.content?.pages?.projects?.compareItems ?? defaultPageContent.projects.compareItems,
          visitReasons: input.content?.pages?.projects?.visitReasons ?? defaultPageContent.projects.visitReasons,
        },
        finishing: {
          ...defaultPageContent.finishing,
          ...input.content?.pages?.finishing,
          whyCards: input.content?.pages?.finishing?.whyCards ?? defaultPageContent.finishing.whyCards,
          processSteps:
            input.content?.pages?.finishing?.processSteps ?? defaultPageContent.finishing.processSteps,
          faqs: input.content?.pages?.finishing?.faqs ?? defaultPageContent.finishing.faqs,
        },
        smartHome: {
          ...defaultPageContent.smartHome,
          ...input.content?.pages?.smartHome,
          steps: input.content?.pages?.smartHome?.steps ?? defaultPageContent.smartHome.steps,
          whyCards: input.content?.pages?.smartHome?.whyCards ?? defaultPageContent.smartHome.whyCards,
          useCases: input.content?.pages?.smartHome?.useCases ?? defaultPageContent.smartHome.useCases,
          faqs: input.content?.pages?.smartHome?.faqs ?? defaultPageContent.smartHome.faqs,
        },
        projectDetail: {
          ...defaultPageContent.projectDetail,
          ...input.content?.pages?.projectDetail,
          whyCards:
            input.content?.pages?.projectDetail?.whyCards ?? defaultPageContent.projectDetail.whyCards,
          fitItems:
            input.content?.pages?.projectDetail?.fitItems ?? defaultPageContent.projectDetail.fitItems,
          processSteps:
            input.content?.pages?.projectDetail?.processSteps ??
            defaultPageContent.projectDetail.processSteps,
          faqs: input.content?.pages?.projectDetail?.faqs ?? defaultPageContent.projectDetail.faqs,
        },
      },
      layouts: {
        ...defaultSiteLayouts,
        ...input.content?.layouts,
        home: input.content?.layouts?.home ?? defaultSiteLayouts.home,
        projects: input.content?.layouts?.projects ?? defaultSiteLayouts.projects,
        finishing: input.content?.layouts?.finishing ?? defaultSiteLayouts.finishing,
        smartHome: input.content?.layouts?.smartHome ?? defaultSiteLayouts.smartHome,
        book: input.content?.layouts?.book ?? defaultSiteLayouts.book,
      },
      systemBlocks: input.content?.systemBlocks ?? defaultSystemBlocks,
    },
    installmentCalculator: {
      ...fallbackSiteSettings.installmentCalculator,
      ...input.installmentCalculator,
      unitTypes:
        input.installmentCalculator?.unitTypes ?? fallbackSiteSettings.installmentCalculator.unitTypes,
      areaOptions:
        input.installmentCalculator?.areaOptions ?? fallbackSiteSettings.installmentCalculator.areaOptions,
      downPaymentOptions:
        input.installmentCalculator?.downPaymentOptions ??
        fallbackSiteSettings.installmentCalculator.downPaymentOptions,
      plans: input.installmentCalculator?.plans ?? fallbackSiteSettings.installmentCalculator.plans,
    },
    finishingCalculator: {
      ...fallbackSiteSettings.finishingCalculator,
      ...input.finishingCalculator,
      areaOptions:
        input.finishingCalculator?.areaOptions ?? fallbackSiteSettings.finishingCalculator.areaOptions,
      tiers: input.finishingCalculator?.tiers ?? fallbackSiteSettings.finishingCalculator.tiers,
      addOns: input.finishingCalculator?.addOns ?? fallbackSiteSettings.finishingCalculator.addOns,
    },
  });
}

function normalizeSiteSettingsRecord(input: Record<string, unknown> | null | undefined): Partial<SiteSettings> {
  if (!input || typeof input !== "object") return {};
  const row = input as Record<string, unknown>;
  const rowContent = (row.content as Record<string, unknown> | undefined) ?? undefined;
  return {
    ...(row as Partial<SiteSettings>),
    hazemAi: (row.hazemAi ?? row.hazem_ai ?? rowContent?.hazemAi) as SiteSettings["hazemAi"] | undefined,
  };
}

function makeCrmSnapshot(leads: Lead[], invitations: UserInvitation[], users: TeamUser[]): CrmSnapshot {
  const stageCounts: CrmSnapshot["stageCounts"] = {
    new: 0,
    contacted: 0,
    qualified: 0,
    site_visit: 0,
    negotiation: 0,
    closed_won: 0,
    closed_lost: 0,
  };

  for (const lead of leads) {
    stageCounts[lead.stage] += 1;
  }

  return {
    stageCounts,
    totalLeads: leads.length,
    pendingInvites: invitations.filter((invite) => invite.status === "pending").length,
    activeUsers: users.filter((user) => user.status === "active").length,
  };
}

function resolveClientCaseAssignments(lead: Lead): ClientCaseAssignment[] {
  return [
    {
      role: "sales",
      assignee: lead.assignedTo,
      status: lead.assignedTo ? "assigned" : "unassigned",
    },
    { role: "operations", status: "unassigned" },
    { role: "engineer", status: "unassigned" },
    { role: "worker", status: "unassigned" },
    { role: "lawyer", status: "unassigned" },
    { role: "accountant", status: "unassigned" },
    { role: "marketer", status: "unassigned" },
  ];
}

function resolveClientCaseExecutionStatus(lead: Lead): ClientCaseExecutionStatus {
  if (lead.stage === "closed_won") {
    return "ready_for_delivery";
  }

  if (lead.stage === "closed_lost") {
    return "blocked";
  }

  if (!lead.assignedTo) {
    return "needs_assignment";
  }

  if (lead.stage === "site_visit" || lead.stage === "negotiation") {
    return "in_progress";
  }

  return "not_started";
}

function makeClientCaseFromLead(lead: Lead, lastActivityAt?: string): ClientCase {
  const commercialStatus =
    lead.stage === "closed_won" ? "won" : lead.stage === "closed_lost" ? "lost" : "open";

  return {
    id: `case-${lead.id}`,
    leadId: lead.id,
    title: `${lead.fullName} - ${lead.service}`,
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    service: lead.service,
    stage: lead.stage,
    priority: lead.priority,
    commercialStatus,
    executionStatus: resolveClientCaseExecutionStatus(lead),
    assignedTo: lead.assignedTo,
    assignments: resolveClientCaseAssignments(lead),
    nextAction:
      lead.stage === "new"
        ? "First outreach"
        : lead.stage === "contacted"
          ? "Qualification follow-up"
          : lead.stage === "qualified"
            ? "Schedule visit"
            : lead.stage === "site_visit"
              ? "Post-visit decision"
              : lead.stage === "negotiation"
                ? "Close commercial terms"
                : lead.stage === "closed_won"
                  ? "Hand off to delivery"
                  : "Archive or review loss reason",
    lastActivityAt: lastActivityAt ?? lead.createdAt,
    createdAt: lead.createdAt,
    budget: lead.budget,
    lostReason: lead.lostReason,
  };
}

async function logNotificationEvent(input: {
  eventType: string;
  targetType: string;
  targetId?: string;
  recipientEmail?: string;
  deliveryStatus: "pending" | "sent" | "updated" | "deleted" | "failed";
  payload?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("notification_events").insert({
    event_type: input.eventType,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    recipient_email: input.recipientEmail ?? null,
    delivery_provider: "supabase-auth",
    delivery_status: input.deliveryStatus,
    payload: input.payload ?? {},
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Best-effort logging. Older environments may not have this table yet.
    return;
  }
}

export async function getProjects() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase
      .from("projects")
      .select("*, units(*)")
      .order("featured", { ascending: false })
      .order("name");

    if (data?.length) {
      return (data as Project[]).map(mergeProject);
    }
  }

  return demoStore.projects.map(mergeProject);
}

export async function getProjectBySlug(slug: string) {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function updateProjectsCatalog(projects: Project[]) {
  const normalized = repairTextDeep(projects).map(mergeProject);
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data: existingProjects } = await supabase.from("projects").select("id");
    const desiredProjectIds = new Set(normalized.map((project) => project.id));
    const staleProjectIds =
      existingProjects?.map((item) => item.id).filter((id) => !desiredProjectIds.has(id)) ?? [];

    if (staleProjectIds.length) {
      await supabase.from("projects").delete().in("id", staleProjectIds);
    }

    const projectRows = normalized.map(
      (project) =>
        Object.fromEntries(Object.entries(project).filter(([key]) => key !== "units")) as Omit<Project, "units">,
    );
    const { error: projectError } = await supabase.from("projects").upsert(projectRows);
    if (projectError) {
      throw new Error(projectError.message);
    }

    const { data: existingUnits } = await supabase
      .from("units")
      .select("id, project_id")
      .in("project_id", normalized.map((project) => project.id));
    const desiredUnitIds = new Set(normalized.flatMap((project) => project.units.map((unit) => unit.id)));
    const staleUnitIds =
      existingUnits?.map((item) => item.id).filter((id) => !desiredUnitIds.has(id)) ?? [];

    if (staleUnitIds.length) {
      await supabase.from("units").delete().in("id", staleUnitIds);
    }

    const unitRows = normalized.flatMap((project) =>
      project.units.map((unit) => ({
        ...unit,
        project_id: project.id,
      })),
    );

    if (unitRows.length) {
      const { error: unitsError } = await supabase.from("units").upsert(unitRows);
      if (unitsError) {
        throw new Error(unitsError.message);
      }
    }

    return normalized;
  }

  demoStore.projects = normalized;
  return normalized;
}

export async function getLeads() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    await ensureCrmSeeded(supabase);
    const { data } = await supabase.from("leads").select("*").order("createdAt", { ascending: false });
    if (data?.length) {
      return data as Lead[];
    }
  }

  return [...demoStore.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLeadActivities() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    await ensureCrmSeeded(supabase);
    const { data } = await supabase
      .from("lead_activities")
      .select("*")
      .order("createdAt", { ascending: false });

    if (data?.length) {
      return data as LeadActivity[];
    }
  }

  return [...demoStore.leadActivities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateLeadCrm(
  id: string,
  payload: Partial<Pick<Lead, "stage" | "priority" | "assignedTo" | "lostReason" | "caseAssignments">> & {
    linkedEntity?: ClientCaseLink | null;
    deliveryReadiness?: DeliveryReadiness | null;
    siteTracking?: SiteTracking | null;
    caseFiles?: ClientCaseFile[] | null;
    roleTasks?: ClientCaseRoleTask[] | null;
    note?: string;
  },
) {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    await ensureCrmSeeded(supabase);
    const updates: Partial<Lead> = {};
    if (payload.stage) updates.stage = payload.stage;
    if (payload.priority) updates.priority = payload.priority;
    if (payload.assignedTo !== undefined) updates.assignedTo = payload.assignedTo;
    if (payload.stage === "contacted" || payload.stage === "qualified" || payload.stage === "site_visit" || payload.stage === "negotiation" || payload.stage === "closed_won" || payload.stage === "closed_lost") {
      updates.status = "contacted";
    }

    const { data, error } = await supabase.from("leads").update(updates).eq("id", id).select();
    if (error) {
      throw new Error(error.message);
    }
    const updatedLead = Array.isArray(data) ? (data[0] as Lead | undefined) : (data as Lead | undefined);

    const activityEvents: LeadActivity[] = [];

    if (payload.stage) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "stage_change",
        body: `Lead moved to ${payload.stage.replace("_", " ")}.`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if (payload.assignedTo !== undefined) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "assignment",
        body: payload.assignedTo ? `Assigned to ${payload.assignedTo}.` : "Lead unassigned.",
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if (payload.lostReason) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "note",
        body: `[LOST_REASON] ${payload.lostReason}`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if (payload.note) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "note",
        body: payload.note,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if (payload.caseAssignments?.length) {
      for (const assignment of payload.caseAssignments) {
        activityEvents.push({
          id: `act-${crypto.randomUUID()}`,
          leadId: id,
          kind: "note",
          body: `[CASE_ASSIGNMENT] ${assignment.role}::${assignment.assignee ?? ""}`,
          createdAt: new Date().toISOString(),
          createdBy: "Admin",
        });
      }
    }

    if ("linkedEntity" in payload) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "note",
        body: `[CASE_LINK] ${JSON.stringify(payload.linkedEntity ?? null)}`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if ("deliveryReadiness" in payload) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "note",
        body: `[DELIVERY_READINESS] ${JSON.stringify(payload.deliveryReadiness ?? null)}`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if ("siteTracking" in payload) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "note",
        body: `[SITE_TRACKING] ${JSON.stringify(payload.siteTracking ?? null)}`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if ("caseFiles" in payload) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "note",
        body: `[CASE_FILES] ${JSON.stringify(payload.caseFiles ?? [])}`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if ("roleTasks" in payload) {
      activityEvents.push({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "note",
        body: `[ROLE_TASKS] ${JSON.stringify(payload.roleTasks ?? [])}`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }

    if (activityEvents.length > 0) {
      await supabase.from("lead_activities").insert(activityEvents);
    }

    if (updatedLead) {
      return {
        ...updatedLead,
        ...(payload.lostReason ? { lostReason: payload.lostReason } : {}),
        ...("linkedEntity" in payload ? { linkedEntity: payload.linkedEntity ?? undefined } : {}),
        ...("deliveryReadiness" in payload
          ? { deliveryReadiness: payload.deliveryReadiness ?? undefined }
          : {}),
        ...("siteTracking" in payload ? { siteTracking: payload.siteTracking ?? undefined } : {}),
        ...("caseFiles" in payload ? { caseFiles: payload.caseFiles ?? [] } : {}),
      } as Lead;
    }

    // Some Supabase setups can apply the update but not return the row (RLS/returning constraints).
    // Return a safe patch object so the client can merge changes locally instead of failing.
    return {
      id,
      ...(updates as Partial<Lead>),
      ...(payload.lostReason !== undefined ? { lostReason: payload.lostReason } : {}),
      ...("linkedEntity" in payload ? { linkedEntity: payload.linkedEntity ?? undefined } : {}),
      ...("deliveryReadiness" in payload
        ? { deliveryReadiness: payload.deliveryReadiness ?? undefined }
        : {}),
      ...("siteTracking" in payload ? { siteTracking: payload.siteTracking ?? undefined } : {}),
      ...("caseFiles" in payload ? { caseFiles: payload.caseFiles ?? [] } : {}),
    } as Lead;
  }

  const target = demoStore.leads.find((lead) => lead.id === id);
  if (!target) {
    throw new Error("Lead not found.");
  }

  if (payload.stage) {
    target.stage = payload.stage;
    if (payload.stage !== "new") {
      target.status = "contacted";
    }
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "stage_change",
      body: `Lead moved to ${payload.stage.replace("_", " ")}.`,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  if (payload.priority) {
    target.priority = payload.priority;
  }

  if (payload.lostReason !== undefined) {
    target.lostReason = payload.lostReason;
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "note",
      body: `[LOST_REASON] ${payload.lostReason}`,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  if (payload.assignedTo !== undefined) {
    target.assignedTo = payload.assignedTo;
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "assignment",
      body: payload.assignedTo ? `Assigned to ${payload.assignedTo}.` : "Lead unassigned.",
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  if (payload.note) {
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "note",
      body: payload.note,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  if (payload.caseAssignments?.length) {
    for (const assignment of payload.caseAssignments) {
      demoStore.leadActivities.unshift({
        id: `act-${crypto.randomUUID()}`,
        leadId: id,
        kind: "note",
        body: `[CASE_ASSIGNMENT] ${assignment.role}::${assignment.assignee ?? ""}`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }
  }

  if ("linkedEntity" in payload) {
    target.linkedEntity = payload.linkedEntity ?? undefined;
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "note",
      body: `[CASE_LINK] ${JSON.stringify(payload.linkedEntity ?? null)}`,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  if ("deliveryReadiness" in payload) {
    target.deliveryReadiness = payload.deliveryReadiness ?? undefined;
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "note",
      body: `[DELIVERY_READINESS] ${JSON.stringify(payload.deliveryReadiness ?? null)}`,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  if ("siteTracking" in payload) {
    target.siteTracking = payload.siteTracking ?? undefined;
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "note",
      body: `[SITE_TRACKING] ${JSON.stringify(payload.siteTracking ?? null)}`,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  if ("caseFiles" in payload) {
    target.caseFiles = payload.caseFiles ?? [];
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "note",
      body: `[CASE_FILES] ${JSON.stringify(payload.caseFiles ?? [])}`,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  if ("roleTasks" in payload) {
    target.roleTasks = payload.roleTasks ?? [];
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      kind: "note",
      body: `[ROLE_TASKS] ${JSON.stringify(payload.roleTasks ?? [])}`,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }

  return target;
}

export async function deleteLeadCrm(id: string) {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    await supabase.from("lead_activities").delete().eq("leadId", id);
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
    return { id };
  }

  const leadIndex = demoStore.leads.findIndex((lead) => lead.id === id);
  if (leadIndex === -1) {
    throw new Error("Lead not found.");
  }
  demoStore.leads.splice(leadIndex, 1);
  demoStore.leadActivities = demoStore.leadActivities.filter((activity) => activity.leadId !== id);
  return { id };
}

export async function createLead(
  lead: Omit<Lead, "id" | "createdAt" | "status" | "stage" | "priority">,
) {
  const record: Lead = repairTextDeep({
    ...lead,
    id: `lead-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    status: "new",
    stage: "new",
    priority: "medium",
  });
  const { linkedEntity, ...leadRow } = record;

  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from("leads").insert(leadRow);
    if (error) {
      throw new Error(error.message);
    }

    if (linkedEntity) {
      await supabase.from("lead_activities").insert({
        id: `act-${crypto.randomUUID()}`,
        leadId: record.id,
        kind: "note",
        body: `[CASE_LINK] ${JSON.stringify(linkedEntity)}`,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
      });
    }
    return { record, mode: "supabase" as const };
  }

  demoStore.leads.unshift(record);
  if (linkedEntity) {
    demoStore.leadActivities.unshift({
      id: `act-${crypto.randomUUID()}`,
      leadId: record.id,
      kind: "note",
      body: `[CASE_LINK] ${JSON.stringify(linkedEntity)}`,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    });
  }
  return { record, mode: "demo" as const };
}

export async function getTeamUsers() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data: invitationRows } = await supabase.from("user_invitations").select("*");
    const { data: authData } = await supabase.auth.admin.listUsers();

    if (authData?.users?.length) {
      const users = authData.users.map(
        (user): TeamUser => ({
          id: user.id,
          email: user.email ?? "unknown",
          fullName:
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            user.email?.split("@")[0] ??
            "User",
          role: (user.user_metadata?.role as UserRole | undefined) ?? "viewer",
          permissions: resolvePermissions(
            (user.user_metadata?.role as UserRole | undefined) ?? "viewer",
            user.user_metadata?.permissions as PermissionKey[] | undefined,
          ),
          accessMode: (user.user_metadata?.accessMode as AccessMode | undefined) ?? "role",
          status: "active",
          invitedAt: user.created_at,
          lastSeenAt: user.last_sign_in_at ?? undefined,
        }),
      );

      const pendingInvites =
        invitationRows?.map(
          (invite): TeamUser => ({
            id: invite.id,
            email: invite.email,
            fullName: invite.email.split("@")[0],
            role: invite.role as UserRole,
            permissions: resolvePermissions(
              invite.role as UserRole,
              invite.permissions as PermissionKey[] | undefined,
            ),
            accessMode: (invite.accessMode as AccessMode | undefined) ?? "role",
            status: "invited",
            invitedAt: invite.createdAt,
          }),
        ).filter((invite) => invite.status === "invited") ?? [];

      return [...users, ...pendingInvites];
    }
  }

  return demoStore.users.map((user) => ({
    ...user,
    permissions: resolvePermissions(user.role, user.permissions),
    accessMode: user.accessMode ?? "role",
  }));
}

export async function getInvitations() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase
      .from("user_invitations")
      .select("*")
      .order("createdAt", { ascending: false });

    if (data?.length) {
      return (data as UserInvitation[]).map((invite) => ({
        ...invite,
        permissions: resolvePermissions(invite.role, invite.permissions),
        accessMode: invite.accessMode ?? "role",
      }));
    }
  }

  return [...demoStore.invitations]
    .map((invite) => ({
      ...invite,
      permissions: resolvePermissions(invite.role, invite.permissions),
      accessMode: invite.accessMode ?? "role",
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLatestInvitationByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("email", normalizedEmail)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const invite = data as UserInvitation;
      return {
        ...invite,
        permissions: resolvePermissions(invite.role, invite.permissions),
        accessMode: invite.accessMode ?? "role",
      };
    }
  }

  const invite = [...demoStore.invitations]
    .filter((item) => item.email.toLowerCase() === normalizedEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!invite) {
    return null;
  }

  return {
    ...invite,
    permissions: resolvePermissions(invite.role, invite.permissions),
    accessMode: invite.accessMode ?? "role",
  };
}

export async function createInvitation(
  email: string,
  role: UserRole,
  permissions?: PermissionKey[],
  invitedBy = "owner@veyra.com",
  accessMode: AccessMode = "role",
) {
  const supabase = createSupabaseServerClient();
  const record: UserInvitation = repairTextDeep({
    id: `inv-${crypto.randomUUID()}`,
    email,
    role,
    permissions: resolvePermissions(role, permissions),
    accessMode,
    status: "pending",
    invitedBy,
    createdAt: new Date().toISOString(),
    lastSentAt: new Date().toISOString(),
  });

  if (supabase) {
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://veyra-admin.vercel.app"}/auth/accept-invite`;
    const inviteResult = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        role,
        permissions: record.permissions,
        accessMode: record.accessMode,
      },
    });

    if (inviteResult.error) {
      await logNotificationEvent({
        eventType: "user_invitation.failed",
        targetType: "user_invitation",
        targetId: record.id,
        recipientEmail: email,
        deliveryStatus: "failed",
        payload: {
          role,
          accessMode: record.accessMode,
          error: inviteResult.error.message,
        },
      });
      throw new Error(inviteResult.error.message);
    }

    const { error } = await supabase.from("user_invitations").insert(record);
    if (error) {
      if (/permissions|accessMode/i.test(error.message)) {
        const { error: fallbackError } = await supabase.from("user_invitations").insert({
          id: record.id,
          email: record.email,
          role: record.role,
          status: record.status,
          invitedBy: record.invitedBy,
          createdAt: record.createdAt,
          lastSentAt: record.lastSentAt,
        });

        if (fallbackError) {
          throw new Error(fallbackError.message);
        }
      } else {
        throw new Error(error.message);
      }
    }

    await logNotificationEvent({
      eventType: "user_invitation.sent",
      targetType: "user_invitation",
      targetId: record.id,
      recipientEmail: email,
      deliveryStatus: "sent",
      payload: {
        role,
        accessMode: record.accessMode,
      },
    });

    return { record, mode: "supabase" as const };
  }

  demoStore.invitations.unshift(record);
  return { record, mode: "demo" as const };
}

export async function markInvitationAccepted(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data: existing } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) {
      return null;
    }

    const { data, error } = await supabase
      .from("user_invitations")
      .update({
        status: "accepted",
        lastSentAt: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    await logNotificationEvent({
      eventType: "user_invitation.accepted",
      targetType: "user_invitation",
      targetId: existing.id,
      recipientEmail: normalizedEmail,
      deliveryStatus: "updated",
      payload: {
        acceptedAt: new Date().toISOString(),
      },
    });

    return {
      ...(data as UserInvitation),
      permissions: resolvePermissions((data as UserInvitation).role, (data as UserInvitation).permissions),
      accessMode: (data as UserInvitation).accessMode ?? "role",
    };
  }

  const target = demoStore.invitations.find(
    (invite) => invite.email.toLowerCase() === normalizedEmail && invite.status === "pending",
  );

  if (!target) {
    return null;
  }

  target.status = "accepted";
  target.lastSentAt = new Date().toISOString();
  return target;
}

export async function updateTeamUserAccess(
  id: string,
  payload: { role: UserRole; permissions: PermissionKey[]; accessMode: AccessMode },
) {
  const permissions = resolvePermissions(payload.role, payload.permissions);
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const userResult = await supabase.auth.admin.updateUserById(id, {
      user_metadata: {
        role: payload.role,
        permissions,
        accessMode: payload.accessMode,
      },
    });

    if (userResult.error) {
      throw new Error(userResult.error.message);
    }

    return {
      id,
      email: userResult.data.user.email ?? "unknown",
      fullName:
        (userResult.data.user.user_metadata?.full_name as string | undefined) ??
        (userResult.data.user.user_metadata?.name as string | undefined) ??
        userResult.data.user.email?.split("@")[0] ??
        "User",
      role: payload.role,
      permissions,
      accessMode: payload.accessMode,
      status: "active" as const,
      invitedAt: userResult.data.user.created_at,
      lastSeenAt: userResult.data.user.last_sign_in_at ?? undefined,
    };
  }

  const target = demoStore.users.find((user) => user.id === id);
  if (!target) {
    throw new Error("User not found.");
  }

  target.role = payload.role;
  target.permissions = permissions;
  target.accessMode = payload.accessMode;
  return target;
}

export async function deleteTeamUser(id: string) {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const userResult = await supabase.auth.admin.deleteUser(id);
    if (userResult.error) {
      throw new Error(userResult.error.message);
    }

    return { id };
  }

  const nextUsers = demoStore.users.filter((user) => user.id !== id);
  if (nextUsers.length === demoStore.users.length) {
    throw new Error("User not found.");
  }

  demoStore.users = nextUsers;
  return { id };
}

export async function updateInvitationAccess(
  id: string,
  payload: { role: UserRole; permissions: PermissionKey[]; accessMode: AccessMode },
) {
  const permissions = resolvePermissions(payload.role, payload.permissions);
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("user_invitations")
      .update({
        role: payload.role,
        permissions,
        accessMode: payload.accessMode,
        lastSentAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (/permissions|accessMode/i.test(error.message)) {
        const { error: fallbackError } = await supabase
          .from("user_invitations")
          .update({
            role: payload.role,
            lastSentAt: new Date().toISOString(),
          })
          .eq("id", id);

        if (fallbackError) {
          throw new Error(fallbackError.message);
        }

        const { data: fallbackData, error: fetchError } = await supabase
          .from("user_invitations")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (fetchError || !fallbackData) {
          throw new Error(fetchError?.message ?? "Invitation record could not be reloaded.");
        }

        return {
          ...(fallbackData as UserInvitation),
          permissions,
          accessMode: payload.accessMode,
        };
      }

      throw new Error(error.message);
    }

    await logNotificationEvent({
      eventType: "user_invitation.updated",
      targetType: "user_invitation",
      targetId: id,
      recipientEmail: data?.email ?? undefined,
      deliveryStatus: "updated",
      payload: {
        role: payload.role,
        accessMode: payload.accessMode,
      },
    });

    return {
      ...(data as UserInvitation),
      permissions: resolvePermissions(payload.role, permissions),
      accessMode: payload.accessMode,
    };
  }

  const target = demoStore.invitations.find((invite) => invite.id === id);
  if (!target) {
    throw new Error("Invitation not found.");
  }

  target.role = payload.role;
  target.permissions = permissions;
  target.accessMode = payload.accessMode;
  target.lastSentAt = new Date().toISOString();
  return target;
}

export async function resendInvitation(id: string) {
  const supabase = createSupabaseServerClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://veyra-admin.vercel.app"}/auth/accept-invite`;

  if (supabase) {
    const { data: existing, error: existingError } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (existingError || !existing) {
      throw new Error(existingError?.message ?? "Invitation not found.");
    }

    const invitation = existing as UserInvitation;

    if (invitation.status === "accepted") {
      throw new Error("This invitation is already accepted and does not need to be resent.");
    }

    const inviteResult = await supabase.auth.admin.inviteUserByEmail(invitation.email, {
      redirectTo,
      data: {
        role: invitation.role,
        permissions: invitation.permissions,
        accessMode: invitation.accessMode ?? "role",
      },
    });

    if (inviteResult.error) {
      await logNotificationEvent({
        eventType: "user_invitation.failed",
        targetType: "user_invitation",
        targetId: id,
        recipientEmail: invitation.email,
        deliveryStatus: "failed",
        payload: {
          role: invitation.role,
          accessMode: invitation.accessMode ?? "role",
          error: inviteResult.error.message,
          action: "resend",
        },
      });
      throw new Error(inviteResult.error.message);
    }

    const { data, error } = await supabase
      .from("user_invitations")
      .update({
        status: "pending",
        lastSentAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message ?? "Invitation record could not be updated.");
    }

    await logNotificationEvent({
      eventType: "user_invitation.resent",
      targetType: "user_invitation",
      targetId: id,
      recipientEmail: invitation.email,
      deliveryStatus: "sent",
      payload: {
        role: invitation.role,
        accessMode: invitation.accessMode ?? "role",
      },
    });

    const updated = data as UserInvitation;
    return {
      ...updated,
      permissions: resolvePermissions(updated.role, updated.permissions),
      accessMode: updated.accessMode ?? "role",
    };
  }

  const target = demoStore.invitations.find((invite) => invite.id === id);
  if (!target) {
    throw new Error("Invitation not found.");
  }

  if (target.status === "accepted") {
    throw new Error("This invitation is already accepted and does not need to be resent.");
  }

  target.status = "pending";
  target.lastSentAt = new Date().toISOString();
  return target;
}

export async function deleteInvitation(id: string) {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data: existing } = await supabase
      .from("user_invitations")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("user_invitations").delete().eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    await logNotificationEvent({
      eventType: "user_invitation.deleted",
      targetType: "user_invitation",
      targetId: id,
      recipientEmail: (existing as { email?: string } | null)?.email,
      deliveryStatus: "deleted",
    });

    return { id };
  }

  const nextInvitations = demoStore.invitations.filter((invite) => invite.id !== id);
  if (nextInvitations.length === demoStore.invitations.length) {
    throw new Error("Invitation not found.");
  }

  demoStore.invitations = nextInvitations;
  return { id };
}

export async function getSiteSettings() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
    if (data) {
      return mergeSiteSettings(normalizeSiteSettingsRecord(data as Record<string, unknown>));
    }
  }

  return mergeSiteSettings(demoStore.siteSettings);
}

export async function updateSiteSettings(payload: SiteSettings) {
  const normalized = mergeSiteSettings(repairTextDeep(payload));
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const payloadWithoutHazem = {
      ...normalized,
      id: normalized.id ?? "primary",
      content: {
        ...normalized.content,
        hazemAi: normalized.hazemAi,
      },
    } as Record<string, unknown>;
    delete payloadWithoutHazem.hazemAi;

    const { error } = await supabase.from("site_settings").upsert(payloadWithoutHazem);

    if (error) {
      throw new Error(error.message);
    }

    return normalized;
  }

  demoStore.siteSettings = normalized;
  return normalized;
}

export async function getCrmSnapshot() {
  const [leads, invitations, users] = await Promise.all([getLeads(), getInvitations(), getTeamUsers()]);
  return makeCrmSnapshot(leads, invitations, users);
}

export async function getClientCases() {
  const [leads, activities] = await Promise.all([getLeads(), getLeadActivities()]);

  const lastActivityByLead = activities.reduce<Record<string, string>>((acc, activity) => {
    if (!acc[activity.leadId]) {
      acc[activity.leadId] = activity.createdAt;
    }

    return acc;
  }, {});

  return leads.map((lead) => makeClientCaseFromLead(lead, lastActivityByLead[lead.id]));
}

export async function getClientCaseSnapshot(): Promise<ClientCaseSnapshot> {
  const cases = await getClientCases();

  return {
    totalCases: cases.length,
    openCases: cases.filter((item) => item.commercialStatus === "open").length,
    deliveryReadyCases: cases.filter((item) => item.executionStatus === "ready_for_delivery").length,
    unassignedCases: cases.filter((item) => item.executionStatus === "needs_assignment").length,
    blockedCases: cases.filter((item) => item.executionStatus === "blocked").length,
  };
}

export async function getFinishingPackages() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase.from("finishing_packages").select("*").order("pricePerMeter");
    if (data?.length) {
      return (data as FinishingPackage[]).map(mergeFinishingPackage);
    }
  }

  return demoStore.finishingPackages.map(mergeFinishingPackage);
}

export async function getSmartDevices() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase.from("smart_devices").select("*").order("id");
    if (data?.length) {
      return (data as SmartDevice[]).map(mergeSmartDevice);
    }
  }

  return demoStore.smartDevices.map(mergeSmartDevice);
}

export async function getSmartPackages() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase.from("smart_packages").select("*").order("id");
    if (data?.length) {
      return (data as SmartPackage[]).map(mergeSmartPackage);
    }
  }

  return demoStore.smartPackages.map(mergeSmartPackage);
}

export async function getServiceCatalog(): Promise<ServiceCatalog> {
  const [catalogFinishingPackages, catalogSmartDevices, catalogSmartPackages] = await Promise.all([
    getFinishingPackages(),
    getSmartDevices(),
    getSmartPackages(),
  ]);

  return {
    finishingPackages: catalogFinishingPackages,
    smartDevices: catalogSmartDevices,
    smartPackages: catalogSmartPackages,
  };
}

export async function updateServiceCatalog(payload: ServiceCatalog) {
  const sanitizedPayload = repairTextDeep(payload);
  const normalized: ServiceCatalog = {
    finishingPackages: sanitizedPayload.finishingPackages.map(mergeFinishingPackage),
    smartDevices: sanitizedPayload.smartDevices.map(mergeSmartDevice),
    smartPackages: sanitizedPayload.smartPackages.map(mergeSmartPackage),
  };
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const syncTable = async <T extends { id: string }>(table: string, rows: T[]) => {
      const { data: existingRows } = await supabase.from(table).select("id");
      const desiredIds = new Set(rows.map((row) => row.id));
      const staleIds = existingRows?.map((item) => item.id).filter((id) => !desiredIds.has(id)) ?? [];

      if (staleIds.length) {
        await supabase.from(table).delete().in("id", staleIds);
      }

      if (rows.length) {
        const { error } = await supabase.from(table).upsert(rows);
        if (error) {
          throw new Error(error.message);
        }
      }
    };

    await syncTable("finishing_packages", normalized.finishingPackages);
    await syncTable("smart_devices", normalized.smartDevices);
    await syncTable("smart_packages", normalized.smartPackages);

    return normalized;
  }

  demoStore.finishingPackages = normalized.finishingPackages;
  demoStore.smartDevices = normalized.smartDevices;
  demoStore.smartPackages = normalized.smartPackages;
  return normalized;
}

export async function getDashboardStats() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    // Fetch real counts in parallel from Supabase
    const [leadsResult, projectsResult] = await Promise.all([
      supabase.from("leads").select("id, stage", { count: "exact", head: false }),
      supabase.from("projects").select("id", { count: "exact", head: false }),
    ]);

    const openStages = new Set(["new", "contacted", "qualified", "site_visit", "negotiation"]);
    const openLeads = (leadsResult.data ?? []).filter((l) => openStages.has(l.stage)).length;
    const totalProjects = projectsResult.count ?? projectsResult.data?.length ?? 0;

    return [
      { id: "projects", label: "Projects", value: String(totalProjects), hint: "Active developments in the catalogue." },
      { id: "open-leads", label: "Open Leads", value: String(openLeads), hint: "Requests currently waiting for admin follow-up." },
      { id: "services", label: "Services", value: "3", hint: "Real Estate, Finishing, and Smart Home." },
      { id: "response-sla", label: "Response SLA", value: "30 min", hint: "Target response time for newly submitted leads." },
    ];
  }

  // Fallback to mock data when Supabase is not configured
  return dashboardStats;
}

export async function getMarketingTrackingSettings() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    try {
      const { data } = await supabase
        .from("marketing_tracking_settings")
        .select("*")
        .single();
      return data;
    } catch {
      return null;
    }
  }

  return demoStore.marketingTracking || null;
}

export async function updateMarketingTrackingSettings(
  settings: Partial<MarketingTrackingSettings>
) {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    try {
      const { data } = await supabase
        .from("marketing_tracking_settings")
        .upsert({ ...settings, updated_at: new Date() })
        .select()
        .single();
      return data;
    } catch {
      return null;
    }
  }

  const base: MarketingTrackingSettings = demoStore.marketingTracking ?? {
    enableGTM: false,
    enableGA4: false,
    enableMetaPixel: false,
    enableTikTokPixel: false,
    trackPurchases: false,
    trackLeadSubmissions: true,
    trackPageViews: true,
    trackScrollDepth: false,
    trackVideoEngagement: false,
    eventMappings: {},
    customEvents: [],
  };

  demoStore.marketingTracking = {
    ...base,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  return demoStore.marketingTracking;
}

export async function getBlogCategories() {
  return repairTextDeep(demoStore.blogCategories.length ? demoStore.blogCategories : fallbackBlogCategories);
}

export async function getBlogTags() {
  return repairTextDeep(demoStore.blogTags.length ? demoStore.blogTags : fallbackBlogTags);
}

export async function getBlogPosts() {
  const source = demoStore.blogPosts.length ? demoStore.blogPosts : fallbackBlogPosts;
  return repairTextDeep([...source].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export async function upsertBlogPost(payload: BlogPost) {
  const normalized = repairTextDeep({
    ...payload,
    updatedAt: new Date().toISOString(),
  });
  const existing = demoStore.blogPosts.findIndex((post) => post.id === normalized.id);
  if (existing >= 0) {
    demoStore.blogPosts[existing] = normalized;
  } else {
    demoStore.blogPosts.unshift({
      ...normalized,
      createdAt: normalized.createdAt || new Date().toISOString(),
    });
  }
  return normalized;
}

export async function deleteBlogPost(id: string) {
  const next = demoStore.blogPosts.filter((post) => post.id !== id);
  if (next.length === demoStore.blogPosts.length) {
    throw new Error("Blog post not found.");
  }
  demoStore.blogPosts = next;
  return { id };
}

export async function getSeoPageConfigs() {
  const source = demoStore.seoPages.length ? demoStore.seoPages : fallbackSeoPages;
  return repairTextDeep(source);
}

export async function upsertSeoPageConfig(payload: SeoPageConfig) {
  const normalized = repairTextDeep({
    ...payload,
    updatedAt: new Date().toISOString(),
  });
  const existing = demoStore.seoPages.findIndex((entry) => entry.id === normalized.id);
  if (existing >= 0) {
    demoStore.seoPages[existing] = normalized;
  } else {
    demoStore.seoPages.unshift(normalized);
  }
  return normalized;
}


export function getRuntimeMode() {
  return isSupabaseConfigured ? "supabase" : "demo";
}
