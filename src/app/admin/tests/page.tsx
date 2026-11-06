import { requireAdminRole } from "@/lib/session";
import TestsClient from "./TestsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tests & Proctoring Review — Admin",
  description: "Monitor test sessions and review AI proctoring integrity flags",
};

export default async function AdminTestsPage() {
  await requireAdminRole();
  return <TestsClient />;
}
