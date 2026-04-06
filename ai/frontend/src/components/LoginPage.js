/**
 * components/LoginPage.js
 * Authentication page with Login and Register tabs.
 * Distinctive design: deep slate theme, academic aesthetic.
 */

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const ROLES = [
  { value: "teacher", label: "👨‍🏫 Teacher", desc: "Record lectures & manage tasks" },
  { value: "student", label: "🎓 Student",  desc: "View assignments & deadlines" },
];

export default function LoginPage({ onSuccess }) {
  const { login, register } = useAuth();
  const [mode,    setMode]    = useState("login");     // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState({
    name: "", email: "", password: "", role: "student"
  });

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user;
      if (mode === "login") {
        user = await login(form.email, form.password);
      } else {
        user = await register(form.name, form.email, form.password, form.role);
      }
      onSuccess(user);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={styles.page}>
      {/* Background texture */}
      <div style={styles.bgPattern} />

      <div style={styles.card}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <div style={styles.logoIcon}>🎙️</div>
          <h1 style={styles.brandName}>ClassroomAI</h1>
          <p style={styles.brandTagline}>Real-time academic intelligence</p>
        </div>

        {/* Mode Toggle */}
        <div style={styles.toggle}>
          {["login", "register"].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{ ...styles.toggleBtn, ...(mode === m ? styles.toggleActive : {}) }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "register" && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                name="name" required placeholder="Dr. Sarah Johnson"
                value={form.name} onChange={handleChange}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              name="email" type="email" required placeholder="you@university.edu"
              value={form.email} onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              name="password" type="password" required placeholder="••••••••"
              value={form.password} onChange={handleChange}
              style={styles.input}
            />
          </div>

          {mode === "register" && (
            <div style={styles.field}>
              <label style={styles.label}>I am a...</label>
              <div style={styles.roleRow}>
                {ROLES.map(r => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setForm(prev => ({ ...prev, role: r.value }))}
                    style={{
                      ...styles.roleBtn,
                      ...(form.role === r.value ? styles.roleActive : {})
                    }}
                  >
                    <span style={styles.roleLabel}>{r.label}</span>
                    <span style={styles.roleDesc}>{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>


      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f1729 0%, #1a2744 50%, #0d2137 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  bgPattern: {
    position: "absolute", inset: 0,
    backgroundImage: `radial-gradient(circle at 20% 80%, rgba(99,102,241,0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(16,185,129,0.10) 0%, transparent 50%)`,
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "24px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "440px",
    position: "relative",
  },
  brand: { textAlign: "center", marginBottom: "32px" },
  logoIcon: { fontSize: "48px", marginBottom: "12px" },
  brandName: { fontSize: "28px", fontWeight: 700, color: "#fff", margin: 0 },
  brandTagline: { color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: "6px" },
  toggle: {
    display: "flex", gap: "4px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "12px", padding: "4px",
    marginBottom: "28px",
  },
  toggleBtn: {
    flex: 1, padding: "10px",
    borderRadius: "9px", border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    fontSize: "14px", fontWeight: 500,
    cursor: "pointer", transition: "all 0.2s",
    fontFamily: "'Outfit', sans-serif",
  },
  toggleActive: {
    background: "rgba(99,102,241,0.8)",
    color: "#fff",
    boxShadow: "0 2px 12px rgba(99,102,241,0.4)",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "'Outfit', sans-serif",
    outline: "none",
    transition: "border 0.2s",
  },
  roleRow: { display: "flex", gap: "10px" },
  roleBtn: {
    flex: 1, padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    display: "flex", flexDirection: "column", gap: "4px",
    transition: "all 0.2s",
    fontFamily: "'Outfit', sans-serif",
  },
  roleActive: {
    border: "1px solid rgba(99,102,241,0.6)",
    background: "rgba(99,102,241,0.15)",
    color: "#fff",
  },
  roleLabel: { fontSize: "14px", fontWeight: 600 },
  roleDesc:  { fontSize: "11px", opacity: 0.7 },
  error: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    marginTop: "4px",
    transition: "opacity 0.2s",
  },

};
