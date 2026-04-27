import type { PermissionKey, UserRole } from "@/lib/types";

export const PERMISSION_GROUPS: Array<{
  id: string;
  label: string;
  description: string;
  permissions: Array<{ key: PermissionKey; label: string; hint: string }>;
}> = [
  {
    id: "workspace",
    label: "Workspace",
    description: "Core access to the dashboard and builder settings.",
    permissions: [
      { key: "dashboard.view", label: "View dashboard", hint: "Open the admin overview and workspace summaries." },
      { key: "settings.manage", label: "Manage settings", hint: "Edit builder settings, page copy, and system content." },
      { key: "theme.manage", label: "Manage theme", hint: "Change palettes, logo source, and design tokens." },
      { key: "translations.manage", label: "Manage translations", hint: "Edit Arabic and English content across the site." },
      { key: "seo.manage", label: "Manage SEO", hint: "Edit metadata, canonical, and indexing defaults." },
      { key: "blog.manage", label: "Manage blog", hint: "Create, edit, and publish blog posts." },
      { key: "tracking.manage", label: "Manage tracking", hint: "Configure pixels, tags, and event mapping." },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    description: "Inventory and commercial content management.",
    permissions: [
      { key: "projects.view", label: "View projects", hint: "Access project and unit catalog screens." },
      { key: "projects.manage", label: "Manage projects", hint: "Create, edit, and reorder projects." },
      { key: "units.manage", label: "Manage units", hint: "Edit unit details, pricing, and availability." },
      { key: "services.manage", label: "Manage services", hint: "Edit finishing and smart-home catalog data." },
      { key: "calculators.manage", label: "Manage calculators", hint: "Change pricing logic, area options, and plan values." },
      { key: "media.upload", label: "Upload media", hint: "Upload logos, project media, and gallery assets." },
      { key: "content.publish", label: "Publish changes", hint: "Approve and push content changes live." },
      { key: "content.delete", label: "Delete content", hint: "Remove content blocks, records, and catalog items." },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Lead handling, case assignment, and cross-team coordination.",
    permissions: [
      { key: "leads.view", label: "View leads", hint: "Open the CRM pipeline and activity history." },
      { key: "leads.manage", label: "Manage leads", hint: "Change stages, priorities, and notes." },
      { key: "leads.assign", label: "Assign leads", hint: "Change lead ownership across the sales team." },
      { key: "operations.view", label: "View operations", hint: "Open the operations hub, cases, and team coordination screens." },
      { key: "operations.manage", label: "Manage operations", hint: "Change operational status, ownership, and cross-team workflows." },
      { key: "cases.view", label: "View client cases", hint: "Open client cases, linked projects/services, and case timelines." },
      { key: "cases.manage", label: "Manage client cases", hint: "Edit case stages, notes, priorities, and execution context." },
      { key: "cases.assign", label: "Assign client cases", hint: "Attach teams and owners to client cases." },
      { key: "sites.view", label: "View delivery sites", hint: "Open site execution and delivery tracking screens." },
      { key: "sites.manage", label: "Manage delivery sites", hint: "Update delivery stages, blockers, and site progress." },
      { key: "documents.view", label: "View documents", hint: "Open contracts, site files, invoices, and attachments." },
      { key: "documents.upload", label: "Upload documents", hint: "Upload site photos, legal files, and operational attachments." },
      { key: "documents.approve", label: "Approve documents", hint: "Approve or reject controlled files and final versions." },
      { key: "finance.view", label: "View finance", hint: "Open balances, invoices, receipts, and accounting status." },
      { key: "finance.manage", label: "Manage finance", hint: "Update accounting states, payment tracking, and finance actions." },
      { key: "legal.view", label: "View legal", hint: "Open contracts, legal blockers, and review status." },
      { key: "legal.manage", label: "Manage legal", hint: "Change legal status and maintain legal workflow records." },
      { key: "users.view", label: "View users", hint: "Open the team and invitation center." },
      { key: "users.invite", label: "Invite users", hint: "Send invitation emails and create pending access records." },
      { key: "users.manage_roles", label: "Manage roles", hint: "Edit roles, permission presets, and custom access." },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key),
);

export const ROLE_PERMISSION_PRESETS: Record<UserRole, PermissionKey[]> = {
  owner: [...ALL_PERMISSION_KEYS],
  admin: [
    "dashboard.view",
    "settings.manage",
    "theme.manage",
    "translations.manage",
    "seo.manage",
    "blog.manage",
    "tracking.manage",
    "projects.view",
    "projects.manage",
    "units.manage",
    "services.manage",
    "calculators.manage",
    "leads.view",
    "leads.manage",
    "leads.assign",
    "users.view",
    "users.invite",
    "media.upload",
    "content.publish",
  ],
  editor: [
    "dashboard.view",
    "settings.manage",
    "translations.manage",
    "seo.manage",
    "blog.manage",
    "projects.view",
    "projects.manage",
    "units.manage",
    "services.manage",
    "calculators.manage",
    "media.upload",
    "content.publish",
  ],
  operations: [
    "dashboard.view",
    "operations.view",
    "operations.manage",
    "cases.view",
    "cases.manage",
    "cases.assign",
    "sites.view",
    "sites.manage",
    "documents.view",
    "documents.upload",
    "users.view",
  ],
  sales: [
    "dashboard.view",
    "projects.view",
    "leads.view",
    "leads.manage",
    "leads.assign",
    "operations.view",
    "cases.view",
    "cases.manage",
    "cases.assign",
    "documents.view",
    "users.view",
  ],
  engineer: [
    "dashboard.view",
    "projects.view",
    "services.manage",
    "operations.view",
    "cases.view",
    "sites.view",
    "sites.manage",
    "documents.view",
    "documents.upload",
  ],
  worker: [
    "dashboard.view",
    "operations.view",
    "cases.view",
    "sites.view",
    "documents.view",
    "documents.upload",
  ],
  lawyer: [
    "dashboard.view",
    "operations.view",
    "cases.view",
    "documents.view",
    "documents.upload",
    "documents.approve",
    "legal.view",
    "legal.manage",
  ],
  accountant: [
    "dashboard.view",
    "operations.view",
    "cases.view",
    "documents.view",
    "finance.view",
    "finance.manage",
  ],
  marketer: [
    "dashboard.view",
    "projects.view",
    "settings.manage",
    "translations.manage",
    "seo.manage",
    "blog.manage",
    "tracking.manage",
    "media.upload",
    "content.publish",
    "leads.view",
    "operations.view",
    "cases.view",
  ],
  viewer: ["dashboard.view", "projects.view", "leads.view", "cases.view", "users.view"],
};

export function normalizePermissions(permissions?: PermissionKey[]) {
  const next = permissions?.filter((permission): permission is PermissionKey =>
    ALL_PERMISSION_KEYS.includes(permission),
  ) ?? [];

  return [...new Set(next)];
}

export function getRolePermissions(role: UserRole) {
  return [...ROLE_PERMISSION_PRESETS[role]];
}

export function resolvePermissions(role: UserRole, permissions?: PermissionKey[]) {
  const normalized = normalizePermissions(permissions);
  return normalized.length ? normalized : getRolePermissions(role);
}
