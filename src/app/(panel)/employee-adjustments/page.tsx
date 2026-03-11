import { requireRole } from "@/lib/server/roleGuard";

export default async function EmployeeAdjustmentsPage() {
  const authUser = await requireRole(["employee"]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Adjustments</h1>

      <div className="bg-[#120a24] rounded-xl p-6 border border-purple-800">
        <p className="text-gray-400">
          HR policies configured by your organization.
        </p>
      </div>
    </div>
  );
}
