"use client";

import { useMemo, useState, useTransition } from "react";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import { PERMISSION_GROUPS, getRolePermissions } from "@/lib/permissions";
import type {
  AccessMode,
  PermissionKey,
  TeamUser,
  UserInvitation,
  UserRole,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

type InviteUsersPanelProps = {
  initialUsers: TeamUser[];
  initialInvitations: UserInvitation[];
};

type TeamWorkspaceView = "invite" | "users" | "invitations";

const roles: UserRole[] = [
  "owner",
  "admin",
  "editor",
  "operations",
  "sales",
  "engineer",
  "worker",
  "lawyer",
  "accountant",
  "marketer",
  "viewer",
];

function compactInvitationStatusLabel(status: UserInvitation["status"]) {
  const labels: Record<UserInvitation["status"], string> = {
    pending: "Pending",
    accepted: "Accepted",
    expired: "Expired",
  };

  return labels[status];
}

function invitationStatusTone(status: UserInvitation["status"]) {
  if (status === "accepted") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "expired") {
    return "border-rose-500/25 bg-rose-500/10 text-rose-100";
  }

  return "border-amber-500/25 bg-amber-500/10 text-amber-100";
}

function invitationStatusDescription(status: UserInvitation["status"]) {
  if (status === "accepted") {
    return "The invited person already entered the workspace.";
  }

  if (status === "expired") {
    return "This invite needs to be resent or replaced before access can continue.";
  }

  return "This invite is still waiting for the invited email to complete sign-in.";
}

function normalizePermissions(permissions: PermissionKey[]) {
  return [...new Set(permissions)];
}

function compactRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    owner: "Owner",
    admin: "Admin",
    editor: "Editor",
    operations: "Operations",
    sales: "Sales",
    engineer: "Engineer",
    worker: "Worker / Technician",
    lawyer: "Lawyer",
    accountant: "Accountant",
    marketer: "Marketer",
    viewer: "Viewer",
  };

  return labels[role];
}

function PermissionMatrix({
  role,
  accessMode,
  permissions,
  onRoleChange,
  onAccessModeChange,
  onTogglePermission,
}: {
  role: UserRole;
  accessMode: AccessMode;
  permissions: PermissionKey[];
  onRoleChange: (role: UserRole) => void;
  onAccessModeChange: (mode: AccessMode) => void;
  onTogglePermission: (permission: PermissionKey) => void;
}) {
  const { t } = useAdminLocale();
  const [activeGroupId, setActiveGroupId] = useState(PERMISSION_GROUPS[0]?.id ?? "workspace");
  const activeGroup =
    PERMISSION_GROUPS.find((group) => group.id === activeGroupId) ?? PERMISSION_GROUPS[0];

  return (
    <div className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-4 md:p-5">
      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="grid gap-4">
          <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
            {t("Role preset", "القالب الوظيفي")}
            <select
              value={role}
              onChange={(event) => onRoleChange(event.target.value as UserRole)}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            >
              {roles.map((option) => (
                <option key={option} value={option}>
                  {compactRoleLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">{t("Access mode", "وضع الوصول")}</p>
            <div className="grid gap-2">
              {(["role", "custom"] as AccessMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onAccessModeChange(mode)}
                  className={`rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                    accessMode === mode
                      ? "border-[#f2c16b]/35 bg-[#f2c16b]/10 text-white"
                      : "border-white/10 bg-black/20 text-white/68 hover:bg-white/5"
                  }`}
                >
                  <span className="block font-medium text-white">
                    {mode === "role" ? t("Use role preset", "استخدم قالب الدور") : t("Custom permissions", "صلاحيات مخصصة")}
                  </span>
                  <span className="mt-1 block text-xs leading-6 text-white/48">
                    {mode === "role"
                      ? t("Keep this user aligned with the selected role.", "أبقِ هذا المستخدم مرتبطًا بالدور المختار.")
                      : t("Choose individual permissions from grouped controls.", "اختر الصلاحيات الفردية من المجموعات.")} 
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[#120f0d] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/38">{t("Selection summary", "ملخص الاختيار")}</p>
            <strong className="mt-3 block font-serif text-3xl text-white">{permissions.length}</strong>
            <p className="mt-2 text-sm leading-7 text-white/56">
              {accessMode === "role"
                ? t("Permissions follow the role preset and are shown by group for review.", "الصلاحيات تتبع قالب الدور وتظهر حسب المجموعة للمراجعة.")
                : t("Checkboxes are unlocked. Use the group tabs to edit without long scrolling.", "خانات الاختيار مفعلة. استخدم تبويبات المجموعات للتعديل بدون تمرير طويل.")} 
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="grid gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">{t("Permission groups", "مجموعات الصلاحيات")}</p>
            <div className="grid gap-2">
              {PERMISSION_GROUPS.map((group) => {
                const groupCount = group.permissions.filter((permission) =>
                  permissions.includes(permission.key),
                ).length;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className={`rounded-[18px] border px-4 py-3 text-left transition ${
                      activeGroup.id === group.id
                        ? "border-[#f2c16b]/30 bg-[#f2c16b]/10"
                        : "border-white/10 bg-[#120f0d] hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">{group.label}</span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-white/55">
                        {groupCount}/{group.permissions.length}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-white/48">{group.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[#120f0d] p-4">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#f2c16b]">
                {activeGroup.label}
              </p>
              <h4 className="mt-2 text-xl font-semibold text-white">{t("Focused permission editing", "تحرير مركز للصلاحيات")}</h4>
              <p className="mt-2 text-sm leading-7 text-white/54">{activeGroup.description}</p>
            </div>

            <div className="grid gap-3">
              {activeGroup.permissions.map((permission) => {
                const active = permissions.includes(permission.key);

                return (
                  <label
                    key={permission.key}
                    className={`grid gap-2 rounded-[18px] border px-4 py-3 transition ${
                      active
                        ? "border-[#f2c16b]/30 bg-[#f2c16b]/10"
                        : "border-white/10 bg-black/20"
                    } ${accessMode === "custom" ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={active}
                        disabled={accessMode !== "custom"}
                        onChange={() => onTogglePermission(permission.key)}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{permission.label}</p>
                        <p className="mt-1 text-xs leading-6 text-white/52">{permission.hint}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceTabRail({
  activeView,
  onChange,
  usersCount,
  invitationsCount,
}: {
  activeView: TeamWorkspaceView;
  onChange: (next: TeamWorkspaceView) => void;
  usersCount: number;
  invitationsCount: number;
}) {
  const viewMeta = [
    {
      id: "invite" as const,
      label: "Invite",
      eyebrow: "Onboarding",
      description: "Create a new access record with preset or custom permissions.",
      count: null,
    },
    {
      id: "users" as const,
      label: "Active users",
      eyebrow: "Team records",
      description: "Edit one team account at a time and save role or permission updates cleanly.",
      count: usersCount,
    },
    {
      id: "invitations" as const,
      label: "Invitations",
      eyebrow: "Pending access",
      description: "Review unsent or pending invites without stacking giant editors.",
      count: invitationsCount,
    },
  ];

  return (
    <section className="rounded-[30px] border border-white/10 bg-white/5 p-5">
      <div className="grid gap-3 lg:grid-cols-3">
        {viewMeta.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onChange(view.id)}
            className={`grid gap-2 rounded-[24px] border px-4 py-4 text-left transition ${
              activeView === view.id
                ? "border-[#f2c16b]/35 bg-[#f2c16b]/10"
                : "border-white/10 bg-black/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#f2c16b]">{view.eyebrow}</span>
              {view.count !== null ? (
                <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-white/58">
                  {view.count}
                </span>
              ) : null}
            </div>
            <strong className="text-base text-white">{view.label}</strong>
            <p className="text-sm leading-7 text-white/56">{view.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function RecordRail<T extends { id: string }>({
  title,
  description,
  records,
  selectedId,
  onSelect,
  renderLabel,
  renderMeta,
}: {
  title: string;
  description: string;
  records: T[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  renderLabel: (record: T) => string;
  renderMeta: (record: T) => string;
}) {
  return (
    <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 md:p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#f2c16b]">{title}</p>
        <p className="mt-2 text-sm leading-7 text-white/58">{description}</p>
      </div>

      <div className="grid gap-2">
        {records.map((record) => {
          const isSelected = record.id === selectedId;

          return (
            <button
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
              className={`rounded-[20px] border px-4 py-4 text-left transition ${
                isSelected
                  ? "border-[#f2c16b]/35 bg-[#f2c16b]/10"
                  : "border-white/10 bg-black/20 hover:bg-white/5"
              }`}
            >
              <p className="font-medium text-white">{renderLabel(record)}</p>
              <p className="mt-2 text-sm leading-7 text-white/52">{renderMeta(record)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[30px] border border-dashed border-white/10 bg-black/15 p-8 text-center">
      <h3 className="font-serif text-3xl text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/58">{description}</p>
    </div>
  );
}

function AccessStatusStrip({
  activeUsers,
  pendingInvites,
  customAccess,
  trackedRoles,
  acceptedInvites,
  expiredInvites,
}: {
  activeUsers: number;
  pendingInvites: number;
  customAccess: number;
  trackedRoles: number;
  acceptedInvites: number;
  expiredInvites: number;
}) {
  const cards = [
    {
      label: "Active users",
      value: activeUsers,
      hint: "People already inside the admin with live access.",
    },
    {
      label: "Pending invites",
      value: pendingInvites,
      hint: "Access records still waiting for email completion.",
    },
    {
      label: "Accepted invites",
      value: acceptedInvites,
      hint: "Invitation records that already became real workspace access.",
    },
    {
      label: "Expired invites",
      value: expiredInvites,
      hint: "Old or invalid invite records that need owner attention.",
    },
    {
      label: "Custom access",
      value: customAccess,
      hint: "Users or invites that no longer follow a preset role only.",
    },
    {
      label: "Tracked roles",
      value: trackedRoles,
      hint: "Expanded company roles currently available in the access model.",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="admin-shell-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/42">{card.label}</p>
          <strong className="mt-3 block font-serif text-4xl text-white">{card.value}</strong>
          <p className="mt-2 text-sm leading-7 text-white/58">{card.hint}</p>
        </div>
      ))}
    </section>
  );
}

export function InviteUsersPanel({
  initialUsers,
  initialInvitations,
}: InviteUsersPanelProps) {
  const { t } = useAdminLocale();
  const [activeView, setActiveView] = useState<TeamWorkspaceView>("invite");
  const [users, setUsers] = useState(initialUsers.filter((user) => user.status === "active"));
  const [invitations, setInvitations] = useState(initialInvitations);
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialUsers.find((user) => user.status === "active")?.id ?? null,
  );
  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(
    initialInvitations[0]?.id ?? null,
  );
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("sales");
  const [accessMode, setAccessMode] = useState<AccessMode>("role");
  const [permissions, setPermissions] = useState<PermissionKey[]>(getRolePermissions("sales"));
  const [feedback, setFeedback] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<Array<{ id: string; action: string; at: string }>>([]);
  const [isPending, startTransition] = useTransition();

  function pushActivity(action: string) {
    setActivityLog((current) =>
      [{ id: `usr-act-${crypto.randomUUID()}`, action, at: new Date().toISOString() }, ...current].slice(0, 25),
    );
  }

  const filteredUsers = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.fullName, user.email, user.role].some((value) => value.toLowerCase().includes(query)),
    );
  }, [teamSearch, users]);

  const filteredInvitations = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    if (!query) return invitations;
    return invitations.filter((invite) =>
      [invite.email, invite.invitedBy, invite.role].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [teamSearch, invitations]);

  const selectedUser =
    filteredUsers.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? null;
  const selectedInvitation =
    filteredInvitations.find((invite) => invite.id === selectedInvitationId) ??
    filteredInvitations[0] ??
    null;

  const totalCustomAccess = useMemo(
    () =>
      users.filter((user) => user.accessMode === "custom").length +
      invitations.filter((invite) => invite.accessMode === "custom").length,
    [users, invitations],
  );
  const pendingInvitations = useMemo(
    () => invitations.filter((invite) => invite.status === "pending").length,
    [invitations],
  );
  const acceptedInvitations = useMemo(
    () => invitations.filter((invite) => invite.status === "accepted").length,
    [invitations],
  );
  const expiredInvitations = useMemo(
    () => invitations.filter((invite) => invite.status === "expired").length,
    [invitations],
  );

  function handleInviteRoleChange(nextRole: UserRole) {
    setRole(nextRole);
    if (accessMode === "role") {
      setPermissions(getRolePermissions(nextRole));
    }
  }

  function handleInviteModeChange(nextMode: AccessMode) {
    setAccessMode(nextMode);
    if (nextMode === "role") {
      setPermissions(getRolePermissions(role));
    }
  }

  function toggleInvitePermission(permission: PermissionKey) {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((entry) => entry !== permission)
        : [...current, permission],
    );
  }

  function updateUserDraft(id: string, patch: Partial<TeamUser>) {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== id) return user;
        return {
          ...user,
          ...patch,
        };
      }),
    );
  }

  function updateInviteDraft(id: string, patch: Partial<UserInvitation>) {
    setInvitations((current) =>
      current.map((invite) => {
        if (invite.id !== id) return invite;
        return {
          ...invite,
          ...patch,
        };
      }),
    );
  }

  function saveUserAccess(user: TeamUser) {
    startTransition(async () => {
      setSavingId(user.id);
      setFeedback("");
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: user.role,
          accessMode: user.accessMode,
          permissions: normalizePermissions(user.permissions),
        }),
      });

      const json = (await response.json()) as { user?: TeamUser; message?: string };
      if (!response.ok || !json.user) {
        setFeedback(json.message ?? t("Could not update user access.", "تعذر تحديث صلاحيات المستخدم."));
        setSavingId(null);
        return;
      }

      setUsers((current) => current.map((item) => (item.id === user.id ? json.user! : item)));
      setFeedback(json.message ?? "User access updated.");
      pushActivity(`Updated access for user ${json.user.fullName}`);
      setSavingId(null);
    });
  }

  function saveInvitationAccess(invite: UserInvitation) {
    startTransition(async () => {
      setSavingId(invite.id);
      setFeedback("");
      const response = await fetch(`/api/admin/invitations/${invite.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: invite.role,
          accessMode: invite.accessMode,
          permissions: normalizePermissions(invite.permissions),
        }),
      });

      const json = (await response.json()) as { invitation?: UserInvitation; message?: string };
      if (!response.ok || !json.invitation) {
        setFeedback(json.message ?? t("Could not update invitation access.", "تعذر تحديث صلاحيات الدعوة."));
        setSavingId(null);
        return;
      }

      setInvitations((current) =>
        current.map((item) => (item.id === invite.id ? json.invitation! : item)),
      );
      setFeedback(json.message ?? "Invitation access updated.");
      pushActivity(`Updated invitation access for ${json.invitation.email}`);
      setSavingId(null);
    });
  }

  function resendInvite(invite: UserInvitation) {
    startTransition(async () => {
      setSavingId(invite.id);
      setFeedback("");
      const response = await fetch(`/api/admin/invitations/${invite.id}`, {
        method: "POST",
      });

      const json = (await response.json()) as { invitation?: UserInvitation; message?: string };
      if (!response.ok || !json.invitation) {
        setFeedback(json.message ?? "Could not resend invitation.");
        setSavingId(null);
        return;
      }

      setInvitations((current) =>
        current.map((item) => (item.id === invite.id ? json.invitation! : item)),
      );
      setSelectedInvitationId(json.invitation.id);
      setFeedback(json.message ?? "Invitation resent.");
      pushActivity(`Resent invitation to ${json.invitation.email}`);
      setSavingId(null);
    });
  }

  const handleInvite = () => {
    startTransition(async () => {
      setFeedback("");
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          accessMode,
          permissions: normalizePermissions(permissions),
        }),
      });

      const json = (await response.json()) as {
        invitation?: UserInvitation;
        message?: string;
      };

      if (!response.ok || !json.invitation) {
        setFeedback(json.message ?? t("Could not send invite.", "تعذر إرسال الدعوة."));
        return;
      }

      setInvitations((current) => [json.invitation!, ...current]);
      setSelectedInvitationId(json.invitation.id);
      setEmail("");
      setRole("sales");
      setAccessMode("role");
      setPermissions(getRolePermissions("sales"));
      setFeedback(json.message ?? "Invitation sent.");
      pushActivity(`Created invitation for ${json.invitation.email}`);
      setActiveView("invitations");
    });
  };

  function deleteUser(id: string) {
    startTransition(async () => {
      setSavingId(id);
      setFeedback("");
      const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = (await response.json()) as { message?: string };
      if (!response.ok) {
        setFeedback(json.message ?? t("Could not delete user.", "تعذر حذف المستخدم."));
        setSavingId(null);
        return;
      }

      const nextUsers = users.filter((user) => user.id !== id);
      setUsers(nextUsers);
      pushActivity(`Deleted user ${id}`);
      setSelectedUserId(nextUsers[0]?.id ?? null);
      setFeedback(json.message ?? t("User deleted.", "تم حذف المستخدم."));
      setSavingId(null);
    });
  }

  function deleteInvite(id: string) {
    startTransition(async () => {
      setSavingId(id);
      setFeedback("");
      const response = await fetch(`/api/admin/invitations/${id}`, { method: "DELETE" });
      const json = (await response.json()) as { message?: string };
      if (!response.ok) {
        setFeedback(json.message ?? t("Could not delete invitation.", "تعذر حذف الدعوة."));
        setSavingId(null);
        return;
      }

      const nextInvitations = invitations.filter((invite) => invite.id !== id);
      setInvitations(nextInvitations);
      pushActivity(`Deleted invitation ${id}`);
      setSelectedInvitationId(nextInvitations[0]?.id ?? null);
      setFeedback(json.message ?? t("Invitation deleted.", "تم حذف الدعوة."));
      setSavingId(null);
    });
  }

  return (
    <div className="grid gap-6">
      <AccessStatusStrip
        activeUsers={users.length}
        pendingInvites={pendingInvitations}
        acceptedInvites={acceptedInvitations}
        expiredInvites={expiredInvitations}
        customAccess={totalCustomAccess}
        trackedRoles={roles.length}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Access presets", "قوالب الوصول")}</p>
          <strong className="mt-3 block font-serif text-4xl text-white">{roles.length}</strong>
          <p className="mt-2 text-sm text-white/62">
            {t("Base roles available before custom permission tuning.", "الأدوار الأساسية المتاحة قبل تخصيص الصلاحيات.")}
          </p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Custom access", "وصول مخصص")}</p>
          <strong className="mt-3 block font-serif text-4xl text-white">{totalCustomAccess}</strong>
          <p className="mt-2 text-sm text-white/62">
            {t("Users or invites currently using checkbox-customized permissions.", "مستخدمون أو دعوات تستخدم صلاحيات مخصصة عبر خانات الاختيار.")}
          </p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Tracked invitations", "الدعوات المتابعة")}</p>
          <strong className="mt-3 block font-serif text-4xl text-white">{invitations.length}</strong>
          <p className="mt-2 text-sm text-white/62">
            {t("Pending and recent invitation records with editable access.", "سجلات الدعوات المعلقة والحديثة مع وصول قابل للتعديل.")}
          </p>
        </div>
      </section>

      <WorkspaceTabRail
        activeView={activeView}
        onChange={setActiveView}
        usersCount={users.length}
        invitationsCount={invitations.length}
      />

      <section className="rounded-[30px] border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#f2c16b]">{t("Team workspace", "مساحة الفريق")}</p>
            <h2 className="mt-2 font-serif text-3xl text-white">{t("Access center", "إدارة وصول مركزة")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
              {t(
                "Every flow is separated into a clear workspace: create invites, edit one active user, or review one pending invitation at a time.",
                "كل مسار مفصول داخل مساحة واضحة: أنشئ دعوات، أو عدل مستخدمًا نشطًا واحدًا، أو راجع دعوة معلقة واحدة في كل مرة.",
              )}
            </p>
          </div>

          <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/42 lg:w-[320px]">
            {t("Search team or invite records", "ابحث في سجلات الفريق أو الدعوات")}
            <input
              value={teamSearch}
              onChange={(event) => setTeamSearch(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
              placeholder={t("Search by name, email, or role", "ابحث بالاسم أو البريد أو الدور")}
            />
          </label>
        </div>

        {feedback ? (
          <div className="mt-5 rounded-[18px] border border-[#f2c16b]/20 bg-[#f2c16b]/10 px-4 py-3 text-sm text-[#f5d59b]">
            {feedback}
          </div>
        ) : null}

        <div className="mt-6">
          {activeView === "invite" ? (
            <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
              <section className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#f2c16b]">{t("Invite setup", "إعداد الدعوة")}</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{t("Send a new access record", "أرسل سجل وصول جديد")}</h3>
                <p className="mt-3 text-sm leading-7 text-white/56">
                  {t(
                    "Start with the team member email, then choose whether the invite follows a preset role or a custom permission stack.",
                    "ابدأ ببريد عضو الفريق، ثم اختر هل تتبع الدعوة قالب دور جاهزًا أم صلاحيات مخصصة.",
                  )}
                </p>

                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
                    {t("Email", "البريد الإلكتروني")}
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm text-white outline-none"
                      placeholder="name@veyra.com"
                    />
                  </label>

                  <div className="rounded-[22px] border border-white/10 bg-[#120f0d] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/38">{t("Flow notes", "ملاحظات المسار")}</p>
                    <ul className="mt-3 grid gap-2 text-sm leading-7 text-white/56">
                      <li>{t("1. Create the invite with preset or custom access.", "1. أنشئ الدعوة بقالب جاهز أو صلاحيات مخصصة.")}</li>
                      <li>{t("2. Review it inside the Invitations workspace.", "2. راجعها داخل مساحة الدعوات.")}</li>
                      <li>{t("3. Update or delete the invitation later if needed.", "3. عدل الدعوة أو احذفها لاحقًا عند الحاجة.")}</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleInvite}
                    disabled={!email}
                    className="rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-5 py-3 font-semibold text-[#1d140d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPending && !savingId ? t("Sending...", "جارٍ الإرسال...") : t("Send invitation", "إرسال الدعوة")}
                  </button>
                </div>
              </section>

              <PermissionMatrix
                role={role}
                accessMode={accessMode}
                permissions={permissions}
                onRoleChange={handleInviteRoleChange}
                onAccessModeChange={handleInviteModeChange}
                onTogglePermission={toggleInvitePermission}
              />
            </div>
          ) : null}

          {activeView === "users" ? (
            filteredUsers.length ? (
              <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                <RecordRail
                  title="Active users"
                  description="Choose one account to edit. The right panel keeps the workflow focused on a single user."
                  records={filteredUsers}
                  selectedId={selectedUser?.id}
                  onSelect={setSelectedUserId}
                  renderLabel={(user) => user.fullName}
                  renderMeta={(user) =>
                    `${user.email} Â· ${compactRoleLabel(user.role)} Â· ${user.accessMode === "custom" ? "custom access" : "preset access"}`
                  }
                />

                {selectedUser ? (
                  <section className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[#f2c16b]">Selected user</p>
                        <h3 className="mt-2 font-serif text-4xl text-white">{selectedUser.fullName}</h3>
                        <p className="mt-3 text-sm leading-7 text-white/56">{selectedUser.email}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-[#f2c16b]">
                          {compactRoleLabel(selectedUser.role)}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/58">
                          {selectedUser.status}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/58">
                          {selectedUser.accessMode === "custom" ? "custom access" : "preset access"}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/38">Last seen</p>
                        <p className="mt-3 text-sm text-white/72">
                          {selectedUser.lastSeenAt ? formatDate(selectedUser.lastSeenAt) : "No activity yet"}
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/38">Permissions</p>
                        <p className="mt-3 text-sm text-white/72">{selectedUser.permissions.length} active keys</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/38">Editing mode</p>
                        <p className="mt-3 text-sm text-white/72">
                          {selectedUser.accessMode === "custom"
                            ? "Custom checklist enabled"
                            : "Role preset linked"}
                        </p>
                      </div>
                    </div>

                    <PermissionMatrix
                      role={selectedUser.role}
                      accessMode={selectedUser.accessMode}
                      permissions={selectedUser.permissions}
                      onRoleChange={(nextRole) =>
                        updateUserDraft(selectedUser.id, {
                          role: nextRole,
                          permissions:
                            selectedUser.accessMode === "role"
                              ? getRolePermissions(nextRole)
                              : selectedUser.permissions,
                        })
                      }
                      onAccessModeChange={(nextMode) =>
                        updateUserDraft(selectedUser.id, {
                          accessMode: nextMode,
                          permissions:
                            nextMode === "role"
                              ? getRolePermissions(selectedUser.role)
                              : normalizePermissions(selectedUser.permissions),
                        })
                      }
                      onTogglePermission={(permission) =>
                        updateUserDraft(selectedUser.id, {
                          permissions: selectedUser.permissions.includes(permission)
                            ? selectedUser.permissions.filter((entry) => entry !== permission)
                            : [...selectedUser.permissions, permission],
                        })
                      }
                    />

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => deleteUser(selectedUser.id)}
                        className="rounded-full border border-red-400/30 px-4 py-3 text-sm text-red-200 transition hover:bg-red-500/10"
                      >
                        {isPending && savingId === selectedUser.id ? "Working..." : "Delete user"}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveUserAccess(selectedUser)}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                      >
                        {isPending && savingId === selectedUser.id ? "Saving..." : "Save access"}
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="No users match this search"
                description="Try another search term or switch to the Invite workspace to add the next team member."
              />
            )
          ) : null}

          {activeView === "invitations" ? (
            filteredInvitations.length ? (
              <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                <RecordRail
                  title="Invitation records"
                  description="Pick one invitation to edit. This keeps permission editing controlled and much easier to scan."
                  records={filteredInvitations}
                  selectedId={selectedInvitation?.id}
                  onSelect={setSelectedInvitationId}
                  renderLabel={(invite) => invite.email}
                  renderMeta={(invite) =>
                    `Invited by ${invite.invitedBy} · ${compactRoleLabel(invite.role)} · ${compactInvitationStatusLabel(invite.status)}`
                  }
                />

                {selectedInvitation ? (
                  <section className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[#f2c16b]">Selected invitation</p>
                        <h3 className="mt-2 font-serif text-4xl text-white">{selectedInvitation.email}</h3>
                        <p className="mt-3 text-sm leading-7 text-white/56">
                          Invited by {selectedInvitation.invitedBy} on {formatDate(selectedInvitation.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-[#f2c16b]">
                          {compactRoleLabel(selectedInvitation.role)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-2 text-xs ${invitationStatusTone(
                            selectedInvitation.status,
                          )}`}
                        >
                          {compactInvitationStatusLabel(selectedInvitation.status)}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/58">
                          {selectedInvitation.accessMode === "custom" ? "custom access" : "preset access"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/38">Lifecycle status</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-2 text-xs ${invitationStatusTone(
                            selectedInvitation.status,
                          )}`}
                        >
                          {compactInvitationStatusLabel(selectedInvitation.status)}
                        </span>
                        <p className="text-sm leading-7 text-white/62">
                          {invitationStatusDescription(selectedInvitation.status)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/38">Created</p>
                        <p className="mt-3 text-sm text-white/72">{formatDate(selectedInvitation.createdAt)}</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/38">Last sent</p>
                        <p className="mt-3 text-sm text-white/72">{formatDate(selectedInvitation.lastSentAt)}</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/38">Permissions</p>
                        <p className="mt-3 text-sm text-white/72">
                          {selectedInvitation.permissions.length} active keys
                        </p>
                      </div>
                    </div>

                    <PermissionMatrix
                      role={selectedInvitation.role}
                      accessMode={selectedInvitation.accessMode}
                      permissions={selectedInvitation.permissions}
                      onRoleChange={(nextRole) =>
                        updateInviteDraft(selectedInvitation.id, {
                          role: nextRole,
                          permissions:
                            selectedInvitation.accessMode === "role"
                              ? getRolePermissions(nextRole)
                              : selectedInvitation.permissions,
                        })
                      }
                      onAccessModeChange={(nextMode) =>
                        updateInviteDraft(selectedInvitation.id, {
                          accessMode: nextMode,
                          permissions:
                            nextMode === "role"
                              ? getRolePermissions(selectedInvitation.role)
                              : normalizePermissions(selectedInvitation.permissions),
                        })
                      }
                      onTogglePermission={(permission) =>
                        updateInviteDraft(selectedInvitation.id, {
                          permissions: selectedInvitation.permissions.includes(permission)
                            ? selectedInvitation.permissions.filter((entry) => entry !== permission)
                            : [...selectedInvitation.permissions, permission],
                        })
                      }
                    />

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={selectedInvitation.status === "accepted"}
                        onClick={() => resendInvite(selectedInvitation)}
                        className="rounded-full border border-amber-400/30 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isPending && savingId === selectedInvitation.id
                          ? "Working..."
                          : "Resend invitation"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteInvite(selectedInvitation.id)}
                        className="rounded-full border border-red-400/30 px-4 py-3 text-sm text-red-200 transition hover:bg-red-500/10"
                      >
                        {isPending && savingId === selectedInvitation.id
                          ? "Working..."
                          : "Delete invitation"}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveInvitationAccess(selectedInvitation)}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                      >
                        {isPending && savingId === selectedInvitation.id
                          ? "Saving..."
                          : "Save invitation access"}
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="No invitations match this search"
                description="Create a new invite or clear the search input to review the full invitation list."
              />
            )
          ) : null}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.24em] text-[#f2c16b]">{t("Activity log", "سجل النشاط")}</p>
          <button
            type="button"
            onClick={() => setActivityLog([])}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
          >
            {t("Clear", "مسح")}
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {activityLog.length ? (
            activityLog.map((item) => (
              <div key={item.id} className="rounded-[16px] border border-white/10 bg-black/20 p-3">
                <p className="text-sm text-white/82">{item.action}</p>
                <p className="mt-1 text-[11px] text-white/45">{formatDate(item.at)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/55">{t("No team actions recorded yet.", "لا توجد أحداث فريق حتى الآن.")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

