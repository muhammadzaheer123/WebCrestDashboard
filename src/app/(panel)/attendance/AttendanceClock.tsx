"use client";

import { useState } from "react";
import { Play, LogOut, Coffee } from "lucide-react";
import toast from "react-hot-toast";

export default function AttendanceClock({ refreshData }: any) {
  const [loading, setLoading] = useState(false);

  const callApi = async (endpoint: string, successMessage: string) => {
    try {
      setLoading(true);

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Kindly CheckIn First!");
        return;
      }

      toast.success(data.message || successMessage);

      // refresh attendance data
      refreshData?.();
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl p-8 shadow-xl space-y-4">
      <div className="flex gap-4">
        <button
          disabled={loading}
          onClick={() => callApi("/api/attendance/check-in", "Checked in")}
          className="flex-1 bg-purple-600 py-4 rounded-xl flex items-center justify-center gap-2"
        >
          <Play size={18} />
          Check In
        </button>

        <button
          disabled={loading}
          onClick={() => callApi("/api/attendance/check-out", "Checked out")}
          className="flex-1 bg-red-600 py-4 rounded-xl flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Check Out
        </button>
      </div>

      <div className="flex gap-4">
        <button
          disabled={loading}
          onClick={() => callApi("/api/attendance/break-in", "Break started")}
          className="flex-1 bg-yellow-400 text-black py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Coffee size={16} />
          Break In
        </button>

        <button
          disabled={loading}
          onClick={() => callApi("/api/attendance/break-out", "Break ended")}
          className="flex-1 bg-green-600 py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Coffee size={16} />
          Break Out
        </button>
      </div>
    </div>
  );
}
