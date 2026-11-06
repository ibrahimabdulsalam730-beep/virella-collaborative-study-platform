import { requireVerifiedUser } from "@/lib/session";
import RoomsClient from "./RoomsClient";

export default async function RoomsHubPage() {
  await requireVerifiedUser("/rooms");
  return <RoomsClient />;
}
