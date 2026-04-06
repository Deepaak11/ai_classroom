/**
 * App.js - Main application shell
 * Handles:
 *   - Auth gate (Login → Dashboard)
 *   - Role-based navigation (Teacher vs Student)
 *   - Sidebar + main content layout
 */

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import TeacherInterface from "./components/TeacherInterface";
import StudentDashboard from "./components/StudentDashboard";

// ─── Navigation items by role ──────────────────────────────────────────────────
const TEACHER_NAV = [
  { id: "record",   icon: "🎙️", label: "Record Lecture"  },
  { id: "tasks",    icon: "📋", label: "All Tasks"        },
];
const STUDENT_NAV = [
  { id: "dashboard", icon: "📚", label: "My Tasks"        },
  { id: "pending",   icon: "⏳", label: "Pending"         },
  { id: "completed", icon: "✅", label: "Completed"       },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ user, activeTab, onTabChange, onLogout }) {
  const navItems = user.role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  return (
    <aside style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.sidebarBrand}>
        <div style={styles.brandLogo}>🎙️</div>
        <div>
          <div style={styles.brandTitle}>ClassroomAI</div>
          <div style={styles.brandSub}>Academic Intelligence</div>
        </div>
      </div>

      {/* Role Badge */}
      <div style={styles.roleBadge}>
        <span style={styles.roleIcon}>{user.role === "teacher" ? "👨‍🏫" : "🎓"}</span>
        <div>
          <div style={styles.roleName}>{user.name || "User"}</div>
          <div style={styles.roleType}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              ...styles.navItem,
              ...(activeTab === item.id ? styles.navActive : {})
            }}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* System Status */}
      <div style={styles.statusBox}>
        <div style={styles.statusRow}>
          <span style={styles.statusDot} />
          <span style={styles.statusText}>Backend API</span>
          <span style={styles.statusOk}>Live</span>
        </div>
        <div style={styles.statusRow}>
          <span style={styles.statusDot} />
          <span style={styles.statusText}>NLP Engine</span>
          <span style={styles.statusOk}>Ready</span>
        </div>
        <div style={styles.statusRow}>
          <span style={styles.statusDot} />
          <span style={styles.statusText}>MongoDB</span>
          <span style={styles.statusOk}>Connected</span>
        </div>
      </div>

      {/* Logout */}
      <button onClick={onLogout} style={styles.logoutBtn}>
        🚪 Sign Out
      </button>
    </aside>
  );
}

// ─── Inner App (requires auth context) ────────────────────────────────────────
function AppInner() {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [authed, setAuthed] = useState(false);

  if (loading) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.loadSpinner} />
      </div>
    );
  }

  // ── Show login if not authenticated ───────────────────────────────────────
  if (!user || !authed) {
    return (
      <LoginPage
        onSuccess={(u) => {
          setAuthed(true);
          setActiveTab(u.role === "teacher" ? "record" : "dashboard");
        }}
      />
    );
  }

  // ── Active tab: default by role ────────────────────────────────────────────
  const currentTab = activeTab || (user.role === "teacher" ? "record" : "dashboard");

  // ── Render main content ────────────────────────────────────────────────────
  const renderContent = () => {
    if (user.role === "teacher") {
      return <TeacherInterface />;
    }
    // Student views
    return <StudentDashboard filterMode={currentTab} />;
  };

  return (
    <div style={styles.appShell}>
      <Sidebar
        user={user}
        activeTab={currentTab}
        onTabChange={setActiveTab}
        onLogout={() => { setAuthed(false); logout(); }}
      />
      <main style={styles.mainContent}>
        <div style={styles.contentInner}>
          {renderContent()}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Outfit', sans-serif; background: #0f1729; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  fullCenter: {
    height: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "#0f1729",
  },
  loadSpinner: {
    width: "40px", height: "40px",
    border: "3px solid rgba(99,102,241,0.2)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  appShell: {
    display: "flex",
    height: "100vh",
    background: "#0f1729",
    fontFamily: "'Outfit', sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    width: "240px",
    minWidth: "240px",
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    gap: "20px",
    height: "100vh",
    overflow: "hidden",
  },
  sidebarBrand: { display: "flex", alignItems: "center", gap: "12px", padding: "0 4px" },
  brandLogo:  { fontSize: "28px" },
  brandTitle: { color: "#fff", fontSize: "16px", fontWeight: 700 },
  brandSub:   { color: "rgba(255,255,255,0.35)", fontSize: "10px" },
  roleBadge: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "rgba(99,102,241,0.10)",
    border: "1px solid rgba(99,102,241,0.20)",
    borderRadius: "12px",
    padding: "10px 12px",
  },
  roleIcon: { fontSize: "24px" },
  roleName: { color: "#fff", fontSize: "13px", fontWeight: 600 },
  roleType: { color: "rgba(255,255,255,0.4)", fontSize: "11px" },
  nav: { display: "flex", flexDirection: "column", gap: "4px" },
  navItem: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px", borderRadius: "10px",
    border: "none", background: "transparent",
    color: "rgba(255,255,255,0.5)",
    fontSize: "13px", fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s",
    fontFamily: "'Outfit', sans-serif",
    width: "100%", textAlign: "left",
  },
  navActive: {
    background: "rgba(99,102,241,0.20)",
    color: "#818cf8",
  },
  navIcon: { fontSize: "16px", width: "20px", textAlign: "center" },
  statusBox: {
    background: "rgba(255,255,255,0.02)",
    borderRadius: "10px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statusRow: { display: "flex", alignItems: "center", gap: "6px" },
  statusDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", flexShrink: 0 },
  statusText: { color: "rgba(255,255,255,0.35)", fontSize: "11px", flex: 1 },
  statusOk:   { color: "#10b981", fontSize: "11px", fontWeight: 600 },
  logoutBtn: {
    padding: "10px 12px",
    background: "rgba(239,68,68,0.08)",
    color: "rgba(248,113,113,0.8)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: "10px",
    fontSize: "13px", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    textAlign: "left",
  },
  mainContent: {
    flex: 1,
    overflow: "auto",
    background: "#0f1729",
  },
  contentInner: {
    padding: "32px",
    maxWidth: "1200px",
    margin: "0 auto",
    minHeight: "100%",
  },
};
