import { requireAdminRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AnnounceClient from "./AnnounceClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Announcements & Banners — Admin",
  description: "Create platform-wide banners and broadcast messages",
};

export default async function AdminAnnouncePage() {
  await requireAdminRole();

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return <AnnounceClient initialList={announcements} />;
}
