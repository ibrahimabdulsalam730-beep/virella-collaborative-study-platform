import { requireAdminRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports & Moderation — Admin",
  description: "Moderation queue for reported content, messages, and accounts",
};

export default async function AdminReportsPage() {
  await requireAdminRole();

  const rawReports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submitter: { select: { email: true } },
      targetUser: { select: { email: true } },
    },
  }).catch(() => []);

  const reports = rawReports.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    reason: r.reason,
    details: r.details,
    submitterEmail: r.submitter?.email || "Anonymous",
    targetEmail: r.targetUser?.email || undefined,
    targetId: r.targetId || undefined,
    notes: r.notes,
    createdAt: r.createdAt,
  }));

  return <ReportsClient initialReports={reports} />;
}
