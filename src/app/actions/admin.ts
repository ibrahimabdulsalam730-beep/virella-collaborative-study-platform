"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole, requireSuperAdminRole } from "@/lib/session";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { Role, UserStatus, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "ibrahimabdulsalam.730@gmail.com").toLowerCase().trim();

function assertNotSuperAdmin(targetUser: { role: Role; email: string }) {
  if (
    targetUser.role === Role.SUPER_ADMIN ||
    targetUser.email.toLowerCase().trim() === SUPER_ADMIN_EMAIL
  ) {
    throw new Error("The super admin account cannot be demoted, suspended, or deleted.");
  }
}

// -------------------------------------------------------------
// 1. USER MANAGEMENT ACTIONS
// -------------------------------------------------------------

export async function updateUserRoleAction(targetUserId: string, newRole: Role) {
  const admin = await requireAdminRole();

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("User not found");

  assertNotSuperAdmin(target);

  // Only SUPER_ADMIN can assign ADMIN or SUPER_ADMIN roles
  if ((newRole === Role.ADMIN || newRole === Role.SUPER_ADMIN) && admin.role !== Role.SUPER_ADMIN) {
    throw new Error("Only Super Admins can assign Admin privileges.");
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  await logAuditEvent({
    userId: admin.id,
    action: "ADMIN_USER_ROLE_CHANGED",
    metadata: { targetUserId, targetEmail: target.email, oldRole: target.role, newRole },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/admins");
  return { success: true, user: updated };
}

export async function toggleUserSuspensionAction(targetUserId: string, suspend: boolean, reason?: string) {
  const admin = await requireAdminRole();

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("User not found");

  assertNotSuperAdmin(target);

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: suspend ? UserStatus.SUSPENDED : UserStatus.ACTIVE },
  });

  // If suspending, also revoke active sessions
  if (suspend) {
    await prisma.session.deleteMany({ where: { userId: targetUserId } });
  }

  await logAuditEvent({
    userId: admin.id,
    action: suspend ? "ADMIN_USER_SUSPENDED" : "ADMIN_USER_UNSUSPENDED",
    metadata: { targetUserId, targetEmail: target.email, reason: reason || "Manual admin action" },
  });

  revalidatePath("/admin/users");
  return { success: true, user: updated };
}

export async function forceUserLogoutAction(targetUserId: string) {
  const admin = await requireAdminRole();

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("User not found");

  await prisma.session.deleteMany({ where: { userId: targetUserId } });

  await logAuditEvent({
    userId: admin.id,
    action: "ADMIN_USER_SESSIONS_REVOKED",
    metadata: { targetUserId, targetEmail: target.email },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function softDeleteUserAction(targetUserId: string) {
  const admin = await requireAdminRole();

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("User not found");

  assertNotSuperAdmin(target);

  await prisma.user.update({
    where: { id: targetUserId },
    data: { status: UserStatus.DELETED },
  });

  await prisma.session.deleteMany({ where: { userId: targetUserId } });

  await logAuditEvent({
    userId: admin.id,
    action: "ADMIN_USER_SOFT_DELETED",
    metadata: { targetUserId, targetEmail: target.email },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminResetUserPasswordAction(targetUserId: string, newPassword: string) {
  const admin = await requireAdminRole();

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("User not found");

  assertNotSuperAdmin(target);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash },
  });

  // Revoke old sessions
  await prisma.session.deleteMany({ where: { userId: targetUserId } });

  await logAuditEvent({
    userId: admin.id,
    action: "ADMIN_USER_PASSWORD_RESET",
    metadata: { targetUserId, targetEmail: target.email },
  });

  return { success: true };
}

// -------------------------------------------------------------
// 2. REPORT & MODERATION ACTIONS
// -------------------------------------------------------------

export async function updateReportStatusAction(
  reportId: string,
  newStatus: ReportStatus,
  notes?: string
) {
  const admin = await requireAdminRole();

  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: newStatus,
      assigneeId: admin.id,
      notes: notes || undefined,
      resolvedAt: newStatus === ReportStatus.RESOLVED || newStatus === ReportStatus.DISMISSED ? new Date() : null,
    },
  });

  await logAuditEvent({
    userId: admin.id,
    action: "ADMIN_REPORT_STATUS_CHANGED",
    metadata: { reportId, newStatus, notes },
  });

  revalidatePath("/admin/reports");
  return { success: true, report };
}

// -------------------------------------------------------------
// 3. ANNOUNCEMENT ACTIONS
// -------------------------------------------------------------

export async function createAnnouncementAction(data: {
  title: string;
  body: string;
  targetRoles: string[];
  sendEmail?: boolean;
}) {
  const admin = await requireAdminRole();

  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      body: data.body,
      targetRoles: data.targetRoles,
      sentEmail: Boolean(data.sendEmail),
      createdById: admin.id,
    },
  });

  await logAuditEvent({
    userId: admin.id,
    action: "ADMIN_ANNOUNCEMENT_CREATED",
    metadata: { announcementId: announcement.id, title: data.title, roles: data.targetRoles },
  });

  revalidatePath("/admin/announce");
  return { success: true, announcement };
}

export async function deleteAnnouncementAction(id: string) {
  const admin = await requireAdminRole();

  await prisma.announcement.delete({ where: { id } });

  await logAuditEvent({
    userId: admin.id,
    action: "ADMIN_ANNOUNCEMENT_DELETED",
    metadata: { announcementId: id },
  });

  revalidatePath("/admin/announce");
  return { success: true };
}

// -------------------------------------------------------------
// 4. SYSTEM SETTINGS ACTIONS (SUPER_ADMIN ONLY)
// -------------------------------------------------------------

export async function updateSystemSettingAction(key: string, value: string) {
  const admin = await requireSuperAdminRole();

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedBy: admin.id },
    create: { key, value, updatedBy: admin.id },
  });

  await logAuditEvent({
    userId: admin.id,
    action: "ADMIN_SETTING_UPDATED",
    metadata: { key, value },
  });

  revalidatePath("/admin/settings");
  return { success: true, setting };
}
