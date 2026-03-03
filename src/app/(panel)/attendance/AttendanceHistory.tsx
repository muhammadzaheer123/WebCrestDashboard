"use client";

export default function AttendanceHistory({ attendance }: any) {
  // Extracting logs from API data
  const logs = [];
  if (attendance?.checkIn)
    logs.push({ label: "Check In", time: attendance.checkIn });
  attendance?.breaks?.forEach((b: any) => {
    if (b.breakIn) logs.push({ label: "Break In", time: b.breakIn });
    if (b.breakOut) logs.push({ label: "Break Out", time: b.breakOut });
  });
  if (attendance?.checkOut)
    logs.push({ label: "Check Out", time: attendance.checkOut });

  return (
    <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-[#1f142e] bg-[#1a102a]">
        <h3 className="font-semibold text-purple-400">Today's Activity</h3>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-gray-600 italic">
            No activity recorded yet
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className="p-5 flex justify-between items-center border-b border-[#1f142e] hover:bg-[#1a102a] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1f142e] flex items-center justify-center text-purple-500 font-bold border border-purple-500/20">
                  {log.label[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{log.label}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
              </div>
              <div className="text-[10px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20 font-bold tracking-wider uppercase">
                Success
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
