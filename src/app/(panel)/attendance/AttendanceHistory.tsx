"use client";

export default function AttendanceHistory({ attendance }: any) {
  const logs: any[] = [];

  if (!attendance) {
    return (
      <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl p-10 text-center text-gray-600 italic">
        No activity recorded yet
      </div>
    );
  }

  if (attendance.checkIn) {
    logs.push({
      label: "Check In",
      time: attendance.checkIn,
    });
  }

  if (attendance.breaks?.length) {
    attendance.breaks.forEach((b: any) => {
      if (b.breakIn) {
        logs.push({
          label: "Break In",
          time: b.breakIn,
        });
      }

      if (b.breakOut) {
        logs.push({
          label: "Break Out",
          time: b.breakOut,
        });
      }
    });
  }

  if (attendance.checkOut) {
    logs.push({
      label: "Check Out",
      time: attendance.checkOut,
    });
  }

  logs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[#1f142e]">
        <h3 className="font-semibold text-purple-400">Today's Activity</h3>
      </div>

      {logs.length === 0 ? (
        <div className="p-10 text-center text-gray-600 italic">
          No activity recorded yet
        </div>
      ) : (
        logs.map((log, i) => (
          <div
            key={i}
            className="p-5 flex justify-between border-b border-[#1f142e]"
          >
            <span>{log.label}</span>

            <span className="text-gray-400 text-sm">
              {new Date(log.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
