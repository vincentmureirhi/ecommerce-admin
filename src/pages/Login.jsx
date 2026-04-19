import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth?.() || {};
  const theme = useTheme?.() || {};

  const isDark = Boolean(theme?.isDark);
  const toggleTheme =
    typeof theme?.toggleTheme === "function" ? theme.toggleTheme : () => {};

  const loginFromContext =
    typeof auth?.login === "function" ? auth.login : null;

  const isAuthed = Boolean(auth?.isAuthed);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthed) {
      navigate("/", { replace: true });
    }
  }, [isAuthed, navigate]);

  const colors = {
    bg: isDark
      ? "linear-gradient(135deg, #020617 0%, #0f172a 55%, #111827 100%)"
      : "linear-gradient(135deg, #eff6ff 0%, #f8fafc 55%, #ffffff 100%)",
    card: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.96)",
    border: isDark ? "rgba(148,163,184,0.16)" : "#e2e8f0",
    text: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputBorder: isDark ? "#334155" : "#dbe2ea",
    buttonBg: "#2563eb",
    buttonText: "#ffffff",
    errorBg: isDark ? "rgba(127,29,29,0.22)" : "#fef2f2",
    errorBorder: isDark ? "rgba(239,68,68,0.35)" : "#fecaca",
    errorText: isDark ? "#fca5a5" : "#b91c1c",
    soft: isDark ? "rgba(37,99,235,0.14)" : "#eff6ff",
    secondaryBtn: isDark ? "#1e293b" : "#f8fafc",
    secondaryBtnText: isDark ? "#f8fafc" : "#0f172a",
  };

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const email = String(form.email || "").trim();
    const password = String(form.password || "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (loginFromContext) {
        await loginFromContext(email, password);
        navigate("/", { replace: true });
        return;
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || data?.error || "Login failed. Check your credentials."
        );
      }

      const token = data?.data?.token || data?.token || null;
      const user = data?.data?.user || data?.user || { email };

      if (!token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      window.location.href = "/";
    } catch (err) {
      setError(err?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 24,
          boxShadow: isDark
            ? "0 18px 50px rgba(0,0,0,0.35)"
            : "0 18px 50px rgba(15,23,42,0.10)",
          overflow: "hidden",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            padding: "22px 22px 14px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: colors.text,
                lineHeight: 1.15,
              }}
            >
              Xpose Distributors
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                color: colors.textMuted,
              }}
            >
              Admin Login
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.soft,
              color: colors.text,
              borderRadius: 12,
              width: 42,
              height: 42,
              cursor: "pointer",
              fontSize: 18,
              flexShrink: 0,
            }}
            title="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

        <div style={{ padding: 22 }}>
          <div
            style={{
              marginBottom: 18,
              color: colors.textMuted,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Sign in to access the admin dashboard.
          </div>

          {error ? (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 14,
                background: colors.errorBg,
                border: `1px solid ${colors.errorBorder}`,
                color: colors.errorText,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  color: colors.text,
                }}
              >
                Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: 14,
                  border: `1px solid ${colors.inputBorder}`,
                  background: colors.inputBg,
                  color: colors.text,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  color: colors.text,
                }}
              >
                Password
              </label>

              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: 14,
                  border: `1px solid ${colors.inputBorder}`,
                  background: colors.inputBg,
                  color: colors.text,
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 14,
                border: "none",
                background: colors.buttonBg,
                color: colors.buttonText,
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gap: 10,
            }}
          >
            <Link
              to="/route-login"
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "13px 16px",
                borderRadius: 14,
                border: `1px solid ${colors.border}`,
                background: colors.secondaryBtn,
                color: colors.secondaryBtnText,
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              Route Customer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}