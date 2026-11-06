import { requireSuperAdminRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminsClient from "./AdminsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Privilege Management — Super Admin",
  description: "Roster of platform administrators and role management",
};

export default async function AdminAdminsPage() {
  await requireSuperAdminRole();

  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
      status: { not: "DELETED" },
    },
    orderBy: { createdAt: "asc" },
    include: {
      adminTwoFactor: {
        select: { enabled: true },
      },
    },
  });

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "ibrahimabdulsalam.730@gmail.com").toLowerCase().trim();

  const formatted = admins.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    createdAt: a.createdAt,
    twoFactorEnabled: a.adminTwoFactor?.enabled ?? false,
  }));

  return <AdminsClient admins={formatted} superAdminEmail={superAdminEmail} />;
}
