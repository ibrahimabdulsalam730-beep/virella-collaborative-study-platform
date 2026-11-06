import { requireAdminRole } from "@/lib/session";
import ContentClient from "./ContentClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Content & Frameworks — Admin",
  description: "Configure study methods and moderate study materials",
};

export default async function AdminContentPage() {
  await requireAdminRole();
  return <ContentClient />;
}
