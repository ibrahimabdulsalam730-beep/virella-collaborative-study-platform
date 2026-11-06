import { requireAdminRole } from "@/lib/session";
import RoomsClient from "./RoomsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rooms Moderation — Admin",
  description: "Monitor live audio/video rooms, participants, and room health",
};

export default async function AdminRoomsPage() {
  await requireAdminRole();
  return <RoomsClient />;
}
