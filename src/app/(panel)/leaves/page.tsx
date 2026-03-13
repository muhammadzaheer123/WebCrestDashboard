import { requireRole } from "@/lib/server/roleGuard";
import LeavesManagementClient from "./LeavesManagementClient";

export default async function LeavesPage() {
  await requireRole(["admin", "hr"]);
  return <LeavesManagementClient />;
}
