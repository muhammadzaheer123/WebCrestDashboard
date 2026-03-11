"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    toast.success(data.message);
  };

  return (
    <div className="Admin-Login">
      <div className="ADMIN-LOGIN-FORM">
        <h2 className="form-title">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">New Password</label>
            <div className="inputWrap">
              <input
                type="password"
                className="input"
                placeholder="Enter new password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button className="primaryBtn">Update Password</button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
