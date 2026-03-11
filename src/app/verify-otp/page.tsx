"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const verifyOtp = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ otp }),
    });

    const data = await res.json();

    if (data.success) {
      router.push(`/reset-password?token=${data.token}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1b0035] to-[#4b0082]">
      <div className="bg-[#1e0f33] p-10 rounded-xl w-[420px] text-white shadow-xl">
        <h2 className="text-2xl font-semibold text-center mb-6">Verify OTP</h2>

        <form onSubmit={verifyOtp} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            className="w-full p-3 rounded-lg bg-[#2a1a44]"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button className="w-full bg-purple-600 py-3 rounded-lg">
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
}
