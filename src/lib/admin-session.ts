import { createHmac, timingSafeEqual } from "node:crypto";
import type { AccessMode, PermissionKey, UserRole } from "@/lib/types";

export const ADMIN_SESSION_COOKIE = "veyra_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: PermissionKey[];
  accessMode: AccessMode;
  issuedAt: string;
  expiresAt: string;
};

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET || "veyra-dev-session-secret";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function hasPermission(
  session: Pick<AdminSession, "permissions" | "role"> | null | undefined,
  permission: PermissionKey,
) {
  if (!session) return false;
  if (session.role === "owner") return true;
  return session.permissions.includes(permission);
}

export function createAdminSessionToken(
  input: Omit<AdminSession, "issuedAt" | "expiresAt">,
  ttlMs = SESSION_TTL_MS,
) {
  const session: AdminSession = {
    ...input,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };

  const payload = JSON.stringify(session);
  const encoded = encodeBase64Url(payload);
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encoded)) as AdminSession;
    if (!parsed?.email || !parsed?.userId) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
