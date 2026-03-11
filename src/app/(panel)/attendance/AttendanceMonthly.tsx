"use client";

export default function AttendanceMonthly({ records }: any) {
  return (
    <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[#1f142e]">
        <h3 className="font-semibold text-purple-400">Monthly Attendance</h3>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-[#1a1027] text-gray-400">
          <tr>
            <th className="p-4 text-left">Date</th>
            <th className="p-4 text-left">Check In</th>
            <th className="p-4 text-left">Check Out</th>
          </tr>
        </thead>

        <tbody>
          {records?.map((row: any, i: number) => (
            <tr key={i} className="border-t border-[#1f142e]">
              <td className="p-4">{new Date(row.date).toLocaleDateString()}</td>

              <td className="p-4">
                {row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : "-"}
              </td>

              <td className="p-4">
                {row.checkOut
                  ? new Date(row.checkOut).toLocaleTimeString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
