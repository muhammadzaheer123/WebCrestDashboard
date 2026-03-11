import { requireRole } from "@/lib/server/roleGuard";

export default async function LeaveManagementPage() {
  await requireRole(["admin", "hr"]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Employee Leaves</h1>

      <div className="bg-[#120a24] rounded-xl p-6 border border-purple-800">
        All employee leave requests will appear here.
      </div>
    </div>
  );
}
