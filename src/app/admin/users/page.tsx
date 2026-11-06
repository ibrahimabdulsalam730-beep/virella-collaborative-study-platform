import { requireAdminRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users Management — Admin",
  description: "Manage users, inspect roles, and perform moderation actions",
};

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdminRole();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      image: true,
    },
  });

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "ibrahimabdulsalam.730@gmail.com").toLowerCase().trim();

  return (
    <UsersClient
      initialUsers={users}
      superAdminEmail={superAdminEmail}
      currentAdminRole={currentAdmin.role}
    />
  );
}
