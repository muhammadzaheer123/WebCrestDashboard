"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Shield, EyeOff, Eye } from "lucide-react";
import "../styles/login.css";

type Role = "admin" | "hr";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("hr");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (Array.isArray((data as any)?.errors) &&
            (data as any).errors[0]?.message) ||
          (data as any)?.message ||
          `Signup failed (${res.status})`;
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
  }

  return (
    <div className="Admin-Login">
      <form className="Admin-Login-Content" onSubmit={handleSignup}>
        <h1 className="form-title">Sign up</h1>
        <p className="form-subtitle">Create an Admin/HR account</p>

        {error ? <div className="form-error">{error}</div> : null}

        <div className="field">
          <div className="label">Full name</div>
          <div className="inputWrap">
            <User size={18} className="inputIcon" />
            <input
              className="input"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        </div>

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
          <div className="label">Role</div>
          <div className="inputWrap">
            <Shield size={18} className="inputIcon" />
            <select
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              required
            >
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
            </select>
          </div>
        </div>

        <div className="field">
          <div className="label">Password</div>
          <div className="inputWrap">
            <Lock size={18} className="inputIcon" />
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
          {loading ? "Creating..." : "Create account"}
        </button>

        <div className="formFooter">
          Already have an account? <a href="/login">Login</a>
        </div>
      </form>
    </div>
  );
}
