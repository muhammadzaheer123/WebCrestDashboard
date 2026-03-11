import { requireRole } from "@/lib/server/roleGuard";

export default async function MyLeavesPage() {
  await requireRole(["employee"]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">My Leaves</h1>

      <button className="bg-purple-600 px-4 py-2 rounded-lg">
        Submit Leave
      </button>
    </div>
  );
}
