"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

      const data = await res.json();

      if (!res.ok) {
        const msg =
          (Array.isArray(data?.errors) && data.errors[0]?.message) ||
          data?.message ||
          `Signup failed (${res.status})`;
        setError(msg);
        return;
      }

      // ✅ store user with role in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/admin/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="Admin-Login">
      <form className="Admin-Login-Content" onSubmit={handleSignup}>
        <h1>SIGN UP</h1>

        {error && (
          <div
            style={{
              width: "80%",
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(255,0,0,0.12)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.35)",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          required
          style={{
            width: "80%",
            padding: "12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            fontSize: "1rem",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option style={{ color: "black" }} value="admin">
            Admin
          </option>
          <option style={{ color: "black" }} value="hr">
            HR
          </option>
        </select>

        <input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
        <p style={{ color: "black" }}>
          Wanna LogIn!{" "}
          <a style={{ color: "black", fontWeight: "700" }} href="/login">
            LogIn
          </a>
        </p>
      </form>
    </div>
  );
}
