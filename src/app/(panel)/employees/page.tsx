import { requireRole } from "@/lib/server/roleGuard";
import EmployeesClient from "./EmployeesClient";

export default async function EmployeesPage() {
  const authUser = await requireRole(["admin", "hr"]);
  const user = {
    id: authUser.sub,
    email: authUser.email,
    role: authUser.role,
  };

  return <EmployeesClient user={user} />;
}
