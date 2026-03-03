"use client";

export default function AttendanceLog({ data }: any) {
  return (
    <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl h-full shadow-xl">
      <div className="p-6 border-b border-[#1f142e]">
        <h3 className="text-purple-500 font-semibold text-lg">
          Today's Activity
        </h3>
      </div>

      <div className="p-10 flex flex-col items-center justify-center text-gray-600">
        {!data ? (
          <p className="italic">No activity recorded yet</p>
        ) : (
          <div className="w-full">
            {/* Map your data here from API */}
            <p className="text-green-500">Record found for {data.date}</p>
          </div>
        )}
      </div>
    </div>
  );
}
