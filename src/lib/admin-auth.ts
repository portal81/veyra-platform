import { cookies } from "next/headers";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  ADMIN_SESSION_COOKIE,
  type AdminSession,
} from "@/lib/admin-session";
import { getRolePermissions, resolvePermissions } from "@/lib/permissions";
import { createSupabaseAuthClient, createSupabaseServerClient } from "@/lib/supa";
import type { AccessMode, PermissionKey, UserRole } from "@/lib/types";

const OWNER_EMAIL = process.env.OWNER_EMAIL?.trim();
const OWNER_PASSWORD = process.env.OWNER_PASSWORD?.trim();
const OWNER_FULL_NAME = process.env.OWNER_FULL_NAME?.trim() || "Veyra Owner";

export function getAdminLandingPath(role: UserRole) {
  switch (role) {
    case "owner":
    case "admin":
      return "/admin";
    case "operations":
    case "sales":
      return "/admin/leads";
    case "engineer":
    case "worker":
      return "/admin/projects";
    case "lawyer":
    case "accountant":
      return "/admin/users";
    case "marketer":
      return "/admin/marketing";
    case "editor":
      return "/admin/settings";
    case "viewer":
    default:
      return "/admin";
  }
}

export async function ensureOwnerAccount(options?: { syncPassword?: boolean }) {
  const supabase = createSupabaseServerClient();
  if (!supabase || !OWNER_EMAIL || !OWNER_PASSWORD) {
    return null;
  }

  const { data: authData, error } = await supabase.auth.admin.listUsers();
  if (error) {
    throw new Error(error.message);
  }

  const existing = authData.users.find((user) => user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase());

  const ownerMetadata = {
    role: "owner" as UserRole,
    permissions: getRolePermissions("owner"),
    accessMode: "role" as AccessMode,
    full_name: OWNER_FULL_NAME,
  };

  if (!existing) {
    const created = await supabase.auth.admin.createUser({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      email_confirm: true,
      user_metadata: ownerMetadata,
    });

    if (created.error) {
      throw new Error(created.error.message);
    }

    return created.data.user ?? null;
  }

  const updatePayload: {
    email_confirm: true;
    user_metadata: typeof ownerMetadata;
    password?: string;
  } = {
    email_confirm: true,
    user_metadata: {
      ...ownerMetadata,
      ...existing.user_metadata,
      ...ownerMetadata,
    },
  };

  if (options?.syncPassword) {
    updatePayload.password = OWNER_PASSWORD;
  }

  const updated = await supabase.auth.admin.updateUserById(existing.id, updatePayload);
  if (updated.error) {
    throw new Error(updated.error.message);
  }

  return updated.data.user ?? existing;
}

export async function authenticateAdmin(email: string, password: string) {
  const authClient = createSupabaseAuthClient();

  // Fall back to dev auth if Supabase is not configured
  if (!authClient) {
    if (OWNER_EMAIL && email.toLowerCase() === OWNER_EMAIL.toLowerCase() && password === OWNER_PASSWORD) {
      return devAuthenticateAdmin(OWNER_FULL_NAME);
    }
    throw new Error("Supabase auth is not configured yet.");
  }

  if (OWNER_EMAIL && email.toLowerCase() === OWNER_EMAIL.toLowerCase() && password === OWNER_PASSWORD) {
    await ensureOwnerAccount({ syncPassword: true });
  }

  const signIn = await authClient.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.user) {
    throw new Error(signIn.error?.message ?? "Invalid email or password.");
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: authData, error } = await supabase.auth.admin.listUsers();
  if (error) {
    throw new Error(error.message);
  }

  const authUser = authData.users.find((user) => user.id === signIn.data.user!.id);
  if (!authUser) {
    throw new Error("Authenticated user could not be resolved.");
  }

  const role = (authUser.user_metadata?.role as UserRole | undefined) ?? "viewer";
  const permissions = resolvePermissions(role, authUser.user_metadata?.permissions as PermissionKey[] | undefined);
  const accessMode = (authUser.user_metadata?.accessMode as AccessMode | undefined) ?? "role";
  const fullName =
    (authUser.user_metadata?.full_name as string | undefined) ??
    (authUser.user_metadata?.name as string | undefined) ??
    authUser.email?.split("@")[0] ??
    "User";

  const session: Omit<AdminSession, "issuedAt" | "expiresAt"> = {
    userId: authUser.id,
    email: authUser.email ?? email,
    fullName,
    role,
    permissions,
    accessMode,
  };

  return {
    session,
    token: createAdminSessionToken(session),
    redirectTo: getAdminLandingPath(role),
  };
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

// ── Dev / Demo Auth (no Supabase required) ──────────────────────────
const DEV_MODE = process.env.DEV_MODE === "true";

export function isDevMode() {
  return DEV_MODE;
}

export async function devAuthenticateAdmin(identifier: string) {
  if (!DEV_MODE) {
    throw new Error("Dev mode is not enabled.");
  }

  const fullName = identifier.trim() || "Dev User";
  const session: Omit<AdminSession, "issuedAt" | "expiresAt"> = {
    userId: `dev-${identifier.toLowerCase().replace(/\s+/g, "-")}`,
    email: `${identifier.toLowerCase().replace(/\s+/g, ".")}@veyra.dev`,
    fullName,
    role: "owner",
    permissions: getRolePermissions("owner"),
    accessMode: "role",
  };

  return {
    session,
    token: createAdminSessionToken(session),
    redirectTo: "/admin",
  };
}
