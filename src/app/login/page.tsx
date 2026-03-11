"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";
import "../../app/styles/login.css";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      /* SAVE USER */
      localStorage.setItem("user", JSON.stringify(data.user));

      /* SAVE TOKEN */
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      toast.success("Login successful");

      router.replace("/dashboard");
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Admin-Login">
      <form className="ADMIN-LOGIN-FORM" onSubmit={handleLogin}>
        <h1 className="form-title">Login</h1>
        <p className="form-subtitle">Sign in to continue to the dashboard</p>

        <div className="field">
          <div className="label">Email</div>

          <div className="inputWrap">
            <Mail size={18} className="inputIcon" />

            <input
              className="input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <div className="label">Password</div>

          <div className="inputWrap">
            <Lock size={18} className="inputIcon" />

            <input
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

        <div className="flex justify-end align-middle text-end mb-3">
          <Link
            className="text-[14px] text-gray-400 font-sans hover:text-red-500 delay-150 duration-200"
            href="forgot-password"
          >
            Forgot Password?
          </Link>
        </div>

        <button className="primaryBtn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="formFooter">
          Need an account? <a href="#">Contact to HR!</a>
        </div>
      </form>
    </div>
  );
}
