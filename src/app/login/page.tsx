"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import "../../app/styles/login.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (Array.isArray((data as any)?.errors) &&
            (data as any).errors[0]?.message) ||
          (data as any)?.message ||
          `Login failed (${res.status})`;
        setError(msg);
        return;
      }

      localStorage.setItem("user", JSON.stringify((data as any).user));
      router.replace("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Admin-Login">
      <form className="ADMIN-LOGIN-FORM" onSubmit={handleLogin}>
        <h1 className="form-title">Login</h1>
        <p className="form-subtitle">Sign in to continue to the dashboard</p>

        {error ? <div className="form-error">{error}</div> : null}

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
              autoComplete="email"
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
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="inputAction"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button className="primaryBtn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="formFooter">
          Need an account? <a href="/signup">Create one</a>
        </div>
      </form>
    </div>
  );
}
