"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  // send otp
  const sendOtp = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message);
      return;
    }

    toast.success("OTP sent to email");
    setStep(2);
  };

  // otp change
  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    const next = document.getElementById(`otp-${index + 1}`);
    if (value && next) next.focus();
  };

  // reset password
  const resetPassword = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        otp: otp.join(""),
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message);
      return;
    }

    toast.success("Password updated");
  };

  return (
    <div className="Admin-Login">
      <div className="ADMIN-LOGIN-FORM">
        <h2 className="form-title">Forgot Password</h2>

        {/* EMAIL STEP */}

        {step === 1 && (
          <form onSubmit={sendOtp}>
            <div className="field">
              <label className="label">Email</label>

              <div className="inputWrap">
                <Mail className="inputIcon" size={18} />

                <input
                  type="email"
                  className="input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button className="primaryBtn">Send OTP</button>
          </form>
        )}

        {/* OTP + PASSWORD STEP */}

        {step === 2 && (
          <form onSubmit={resetPassword}>
            {/* OTP */}

            <div className="field">
              <label className="label">OTP</label>

              <div style={{ display: "flex", gap: "10px" }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    className="otpInput"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                  />
                ))}
              </div>
            </div>

            {/* PASSWORD */}

            <div className="field">
              <label className="label">New Password</label>

              <div className="inputWrap">
                <Lock className="inputIcon" size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="Enter new password"
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="inputAction"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="primaryBtn">Update Password</button>
          </form>
        )}
      </div>
    </div>
  );
}
