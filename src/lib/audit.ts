import { prisma } from "./prisma";
import { headers } from "next/headers";

export type AuditAction =
  | "AUTH_SIGNUP"
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_LOGIN_BLOCKED_SUSPENDED"
  | "AUTH_LOGOUT"
  | "AUTH_EMAIL_VERIFIED"
  | "AUTH_PASSWORD_RESET_REQUEST"
  | "AUTH_PASSWORD_RESET_SUCCESS"
  | "AUTH_PASSWORD_CHANGE"
  | "AUTH_ACCOUNT_LINKED"
  | "AUTH_ACCOUNT_DELETED"
  | "AUTH_SIGNUP_CANCELLED"
  | "USER_ONBOARDING_COMPLETED"
  | "USER_PROFILE_UPDATED"
  | "ADMIN_USER_ROLE_CHANGED"
  | "ADMIN_USER_SUSPENDED"
  | "ADMIN_USER_UNSUSPENDED"
  | "ADMIN_USER_SESSIONS_REVOKED"
  | "ADMIN_USER_SOFT_DELETED"
  | "ADMIN_USER_PASSWORD_RESET"
  | "ADMIN_REPORT_STATUS_CHANGED"
  | "ADMIN_ANNOUNCEMENT_CREATED"
  | "ADMIN_ANNOUNCEMENT_DELETED"
  | "ADMIN_SETTING_UPDATED";

interface AuditLogOptions {
  userId?: string | null;
  action: AuditAction;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Log security and authentication events to the database AuditLog table.
 * Fails gracefully without breaking the user transaction if DB logging has an issue.
 */
export async function logAuditEvent({
  userId,
  action,
  ipAddress,
  userAgent,
  metadata,
}: AuditLogOptions) {
  try {
    let resolvedIp = ipAddress;
    let resolvedUserAgent = userAgent;

    // Proactively read request headers if in a server component / action context and not supplied
    if (!resolvedIp || !resolvedUserAgent) {
      try {
        const headerList = await headers();
        if (!resolvedIp) {
          resolvedIp =
            headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            headerList.get("x-real-ip") ||
            "127.0.0.1";
        }
        if (!resolvedUserAgent) {
          resolvedUserAgent = headerList.get("user-agent") || undefined;
        }
      } catch {
        // Not in an active request header context (e.g., background job)
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        ipAddress: resolvedIp ?? null,
        userAgent: resolvedUserAgent ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("Failed to write to AuditLog table:", err);
  }
}
