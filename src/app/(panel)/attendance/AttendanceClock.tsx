"use client";

import { useState } from "react";
import { Play, LogOut, Coffee } from "lucide-react";
import toast from "react-hot-toast";

function getLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

export default function AttendanceClock({ refreshData }: any) {
  const [loading, setLoading] = useState(false);

  const callApi = async (
    endpoint: string,
    successMessage: string,
    requiresLocation = false,
  ) => {
    try {
      setLoading(true);

      let body: Record<string, unknown> = {};

      if (requiresLocation) {
        let position: GeolocationPosition | null = null;
        try {
          position = await getLocation();
        } catch {
          position = null;
        }

        if (position) {
          body = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            locationPermissionGranted: true,
          };
        } else {
          body = {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            locationPermissionGranted: false,
          };
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Kindly CheckIn First!");
        return;
      }
      toast.success(data.message || successMessage);
      refreshData?.();
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      {/* Header label */}
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-4">
        Quick Actions
      </p>

      <div className="flex gap-3 mb-3">
        {/* Check In */}
        <button
          disabled={loading}
          onClick={() =>
            callApi("/api/attendance/check-in", "Checked in", true)
          }
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={15} />
          Check In
        </button>

        {/* Check Out */}
        <button
          disabled={loading}
          onClick={() =>
            callApi("/api/attendance/check-out", "Checked out", true)
          }
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3.5 text-sm font-medium text-red-400 shadow-sm transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={15} />
          Check Out
        </button>
      </div>

      <div className="flex gap-3">
        {/* Break In */}
        <button
          disabled={loading}
          onClick={() => callApi("/api/attendance/break-in", "Break started")}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Coffee size={13} />
          Break In
        </button>

        {/* Break Out */}
        <button
          disabled={loading}
          onClick={() => callApi("/api/attendance/break-out", "Break ended")}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Coffee size={13} />
          Break Out
        </button>
      </div>
    </div>
  );
}
