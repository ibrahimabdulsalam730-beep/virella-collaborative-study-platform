import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";

/**
 * Retrieve the current authenticated session user on the server.
 * Returns null if not logged in.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require an authenticated user in a Server Component or Server Action.
 * Redirects to /login?callbackUrl=... if unauthenticated.
 */
export async function requireUser(callbackUrl?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const destination = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";
    redirect(destination);
  }
  return user;
}

/**
 * Require an authenticated AND email-verified user.
 * Redirects unverified users to /verify-email-required.
 */
export async function requireVerifiedUser(callbackUrl?: string) {
  const user = await requireUser(callbackUrl);
  if (!user.emailVerified) {
    const destination = callbackUrl
      ? `/verify-email-required?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/verify-email-required";
    redirect(destination);
  }
  return user;
}

/**
 * Require a specific role (or array of permitted roles).
 * Redirects to /dashboard if role requirement is not satisfied.
 */
export async function requireRole(allowedRoles: Role | Role[], callbackUrl?: string) {
  const user = await requireVerifiedUser(callbackUrl);
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    redirect("/dashboard?error=unauthorized_role");
  }

  return user;
}

/**
 * Require ADMIN or SUPER_ADMIN role.
 * Returns notFound() (404) for non-admins to completely hide the existence of /admin.
 */
export async function requireAdminRole() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    notFound();
  }

  return user;
}

/**
 * Require SUPER_ADMIN role exclusively.
 * Returns notFound() (404) for anyone without the SUPER_ADMIN role.
 */
export async function requireSuperAdminRole() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (user.role !== "SUPER_ADMIN") {
    notFound();
  }

  return user;
}
