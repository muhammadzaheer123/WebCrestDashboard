import { requireRole } from "@/lib/server/roleGuard";
import AttendanceClient from "./AttendanceClient";

export default async function AttendancePage() {
  await requireRole(["admin", "hr", "employee"]);

  return <AttendanceClient />;
}
