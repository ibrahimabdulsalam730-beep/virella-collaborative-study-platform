import { requireVerifiedUser } from "@/lib/session";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // Server-side authentication check
  const user = await requireVerifiedUser("/dashboard");

  return <DashboardClient user={user} />;
}
