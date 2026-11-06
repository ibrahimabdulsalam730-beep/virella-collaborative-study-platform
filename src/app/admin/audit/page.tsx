import { requireAdminRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AuditClient from "./AuditClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Log & Security Timeline — Admin",
  description: "Filterable immutable audit trail for platform events",
};

export default async function AdminAuditPage() {
  await requireAdminRole();

  const rawLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  }).catch(() => []);

  const logs = rawLogs.map((l) => ({
    id: l.id,
    action: l.action,
    userName: l.user?.name,
    userEmail: l.user?.email,
    ipAddress: l.ipAddress,
    metadata: l.metadata,
    createdAt: l.createdAt,
  }));

  return <AuditClient initialLogs={logs} />;
}
