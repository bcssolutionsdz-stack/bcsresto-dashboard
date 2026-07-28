import React, { useState } from "react";

const API_BASE = "https://bcsresto-backend.onrender.com";

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل تسجيل الدخول");
      }

      // نحفظ الجلسة محلياً بالمتصفح عشان ما يحتاج يسجل دخول كل مرة
      localStorage.setItem("bcsresto_token", data.token);
      localStorage.setItem("bcsresto_staff", JSON.stringify(data.staff));

      onLoginSuccess(data.staff, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>BCSresto</h1>
        <p style={styles.subtitle}>تسجيل دخول الموظفين</p>

        <div style={styles.perforation}>
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={styles.perfDot} />
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="admin@bcsresto-demo.dz"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>كلمة السر</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

const colors = {
  bg: "#1B1611",
  surface: "#251D16",
  accent: "#E8642B",
  olive: "#8B9A46",
  ivory: "#F5EFE6",
  muted: "#A89A87",
  line: "#3A2F23",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Tajawal', sans-serif",
    direction: "rtl",
    padding: "20px",
  },
  card: {
    background: colors.surface,
    borderRadius: "16px",
    border: `1px solid ${colors.line}`,
    padding: "36px 32px",
    width: "100%",
    maxWidth: "380px",
  },
  title: {
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "28px",
    color: colors.ivory,
    margin: 0,
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: "14px",
    textAlign: "center",
    margin: "6px 0 20px",
  },
  perforation: {
    display: "flex",
    justifyContent: "space-around",
    margin: "0 -8px 24px",
  },
  perfDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: colors.bg,
    display: "inline-block",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    color: colors.muted,
    fontWeight: 500,
  },
  input: {
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: "10px",
    padding: "12px 14px",
    color: colors.ivory,
    fontSize: "14px",
    fontFamily: "'Tajawal', sans-serif",
    outline: "none",
  },
  error: {
    background: "#4A2318",
    border: "1px solid #7A3A28",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#F0B8A0",
    fontSize: "13px",
    textAlign: "center",
  },
  submitBtn: {
    background: colors.accent,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "6px",
  },
};