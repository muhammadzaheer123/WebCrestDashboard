"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Shield, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";
import "../styles/login.css";

type Role = "admin" | "hr";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("hr");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Signup failed");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      toast.success("Account created successfully");

      router.replace("/dashboard");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="Admin-Login">
      <form className="Admin-Login-Content" onSubmit={handleSignup}>
        <h1 className="form-title">Sign up</h1>
        <p className="form-subtitle">Create Admin / HR account</p>

        <div className="field">
          <div className="label">Full name</div>

          <div className="inputWrap">
            <User size={18} className="inputIcon" />

            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        <button className="primaryBtn" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>

        <div className="formFooter">
          Already have an account? <a href="/login">Login</a>
        </div>
      </form>
    </div>
  );
}
