"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../../app/styles/login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          (Array.isArray(data?.errors) && data.errors[0]?.message) ||
          data?.message ||
          `Login failed (${res.status})`;
        setError(msg);
        return;
      }
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="Admin-Login">
        <div className="Admin-Login-Content">
          <form className="ADMIN-LOGIN-FORM" onSubmit={handleLogin}>
            <h1>LOGIN</h1>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className=""
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <p style={{ color: "black" }}>
              Wanna SignUp!{" "}
              <a style={{ color: "black", fontWeight: "700" }} href="/signup">
                SignUp
              </a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
