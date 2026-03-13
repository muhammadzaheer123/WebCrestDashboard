import { requireRole } from "@/lib/server/roleGuard";
import MyLeavesClient from "./MyLeavesClient";

export default async function MyLeavesPage() {
  await requireRole(["employee", "hr", "admin"]);
  return <MyLeavesClient />;
}
