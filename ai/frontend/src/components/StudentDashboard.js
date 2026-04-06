/**
 * components/StudentDashboard.js
 * Student's task dashboard:
 *   - Stats row (total, pending, completed)
 *   - Filter bar (All / Pending / Completed / by type)
 *   - Task cards with deadline countdown
 *   - Mark as complete toggle
 *   - Auto-refresh every 15 seconds
 */

import React, { useState, useEffect, useCallback } from "react";
import { tasksAPI } from "../services/api";

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  Assignment: { color: "#3b82f6", icon: "📝", bg: "rgba(59,130,246,0.12)" },
  Test:       { color: "#f59e0b", icon: "📋", bg: "rgba(245,158,11,0.12)" },
  Quiz:       { color: "#a855f7", icon: "❓", bg: "rgba(168,85,247,0.12)" },
  Exam:       { color: "#ef4444", icon: "📚", bg: "rgba(239,68,68,0.12)" },
  Reminder:   { color: "#10b981", icon: "🔔", bg: "rgba(16,185,129,0.12)" },
  General:    { color: "#6b7280", icon: "💬", bg: "rgba(107,114,128,0.12)" },
};

const PRIORITY_BADGE = {
  high:   { bg: "rgba(239,68,68,0.15)",   color: "#f87171",  label: "🔴 High"   },
  medium: { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24",  label: "🟡 Medium" },
  low:    { bg: "rgba(16,185,129,0.15)",  color: "#34d399",  label: "🟢 Low"    },
};

// ─── Deadline Countdown ────────────────────────────────────────────────────────
function DeadlineChip({ deadline }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Only tick the timer if there is a deadline
    if (!deadline) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline) return <span style={styles.noDeadline}>No deadline</span>;

  // Assume deadline is end of the given day if time isn't specified
  let due = new Date(deadline);
  if (due.getHours() === 0 && due.getMinutes() === 0) {
    due.setHours(23, 59, 59, 999);
  }

  const msLeft = due - now;
  let color = "#34d399", label = "";

  if (msLeft < 0) {
    color = "#6b7280";
    label = "Overdue";
  } else {
    const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    
    if (daysLeft >= 2) {
      label = `${daysLeft} days left`;
      if (daysLeft <= 3) color = "#f59e0b";
    } else {
      // Less than 2 days -- show an active hour:min:sec timer
      const h = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
      const m = Math.floor((msLeft / 1000 / 60) % 60);
      const s = Math.floor((msLeft / 1000) % 60);
      
      const timeStr = `${h}h ${m}m ${s}s`;
      label = daysLeft === 1 ? `Due Tomorrow (${timeStr})` : `Due Today! (${timeStr})`;
      color = daysLeft === 1 ? "#f59e0b" : "#ef4444";
    }
  }

  // extract just YYYY-MM-DD for clean display
  const dateStr = deadline.split('T')[0];

  return (
    <span style={{ ...styles.deadlineChip, color, borderColor: color + "50", background: color + "18" }}>
      📅 {dateStr} · {label}
    </span>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete }) {
  const [updating, setUpdating] = useState(false);
  const cfg = TYPE_CONFIG[task.type] || TYPE_CONFIG.General;
  const pri = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium;
  const done = task.status === "completed";

  const handleToggle = async () => {
    setUpdating(true);
    await onToggle(task.id, done ? "pending" : "completed");
    setUpdating(false);
  };

  return (
    <div style={{
      ...styles.card,
      opacity: done ? 0.6 : 1,
      borderLeft: `4px solid ${done ? "#374151" : cfg.color}`,
      background: done ? "rgba(255,255,255,0.02)" : cfg.bg,
    }}>
      {/* Card Header */}
      <div style={styles.cardHeader}>
        <div style={styles.cardLeft}>
          <span style={styles.typeIcon}>{cfg.icon}</span>
          <span style={{ ...styles.typeBadge, color: cfg.color, borderColor: cfg.color + "60" }}>
            {task.type}
          </span>
          {task.subject && (
            <span style={styles.subjectBadge}>📖 {task.subject}</span>
          )}
        </div>
        <div style={styles.cardRight}>
          <span style={{ ...styles.priorityBadge, background: pri.bg, color: pri.color }}>
            {pri.label}
          </span>
          <button
            onClick={() => onDelete(task.id)}
            style={styles.deleteBtn}
            title="Delete task"
          >✕</button>
        </div>
      </div>

      {/* Task Title */}
      <p style={{ ...styles.cardTitle, textDecoration: done ? "line-through" : "none" }}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && task.description !== task.title && (
        <p style={styles.cardDesc}>{task.description}</p>
      )}

      {/* Footer */}
      <div style={styles.cardFooter}>
        <DeadlineChip deadline={task.deadline} />
        <button
          onClick={handleToggle}
          disabled={updating}
          style={{
            ...styles.completeBtn,
            background: done ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.15)",
            color:      done ? "#34d399" : "#818cf8",
            borderColor: done ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.3)",
          }}
        >
          {updating ? "..." : done ? "✓ Completed" : "Mark Complete"}
        </button>
      </div>
    </div>
  );
}

// ─── Stats Row ─────────────────────────────────────────────────────────────────
function StatsRow({ stats }) {
  const completionPct = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const pendingPct = stats.total > 0
    ? Math.round((stats.pending / stats.total) * 100)
    : 0;

  const items = [
    { label: "Total Tasks",  value: stats.total,     icon: "📋", color: "#6366f1" },
    { label: "Pending",      value: `${pendingPct}%`, icon: "⏳", color: "#f59e0b" },
    { label: "Completed",    value: `${completionPct}%`, icon: "✅", color: "#10b981" },
    { label: "Completion",   value: `${completionPct}%`, icon: "📊", color: "#a855f7" },
  ];

  return (
    <div style={styles.statsRow}>
      {items.map(item => (
        <div key={item.label} style={{ ...styles.statCard, borderTop: `3px solid ${item.color}` }}>
          <div style={styles.statIcon}>{item.icon}</div>
          <div style={{ ...styles.statValue, color: item.color, display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px" }}>
            {item.value}
            {item.subtext && <span style={{ fontSize: "14px", fontWeight: 600, opacity: 0.7 }}>({item.subtext})</span>}
          </div>
          <div style={styles.statLabel}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [tasks,      setTasks]      = useState([]);
  const [stats,      setStats]      = useState({ total: 0, pending: 0, completed: 0 });
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");   // all | pending | completed
  const [typeFilter, setTypeFilter] = useState("all");   // all | Assignment | Test | etc.
  const [lastSync,   setLastSync]   = useState(null);

  const FILTERS = ["all", "pending", "completed"];
  const TYPE_FILTERS = ["all", "Assignment", "Test", "Quiz", "Exam", "Reminder"];

  // ── Calculate urgent tasks ───────────────────────────────────────────────────
  const urgentTasks = tasks.filter(t => {
    if (t.status === "completed" || !t.deadline) return false;
    const today = new Date();
    const due = new Date(t.deadline);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff <= 1; // Due tomorrow, today, or overdue
  });

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const filters = {};
      if (filter !== "all")     filters.status = filter;
      if (typeFilter !== "all") filters.type   = typeFilter;

      const [taskData, statsData] = await Promise.all([
        tasksAPI.getTasks(filters),
        tasksAPI.getStats(),
      ]);
      setTasks(taskData.tasks || []);
      setStats(statsData);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  // ── Auto-refresh every 15 seconds ─────────────────────────────────────────
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleToggle = async (taskId, newStatus) => {
    await tasksAPI.updateTaskStatus(taskId, newStatus);
    fetchTasks();
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Delete this task?")) {
      await tasksAPI.deleteTask(taskId);
      fetchTasks();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.dashHeader}>
        <div>
          <h2 style={styles.dashTitle}>📚 My Tasks</h2>
          {lastSync && <span style={styles.syncText}>Last synced: {lastSync}</span>}
        </div>
        <button onClick={fetchTasks} style={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>

      {/* Urgent Tasks Alert */}
      {urgentTasks.length > 0 && (
        <div style={styles.alertBanner}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontWeight: 700, fontSize: "16px", color: "#fca5a5" }}>
              Task time checking – please complete your work quickly!
            </span>
            <span style={{ fontSize: "13px", color: "rgba(254,226,226,0.8)" }}>
              You have {urgentTasks.length} task{urgentTasks.length !== 1 ? "s" : ""} that {urgentTasks.length === 1 ? "is" : "are"} overdue or due very soon.
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Filters */}
      <div style={styles.filterSection}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Status:</span>
          <div style={styles.filterRow}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Type:</span>
          <div style={styles.filterRow}>
            {TYPE_FILTERS.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{ ...styles.filterBtn, ...(typeFilter === t ? styles.filterActive : {}) }}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: "64px" }}>🎒</div>
          <h3 style={{ color: "#fff", margin: "16px 0 8px" }}>No tasks found</h3>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>
            Tasks will appear here once your teacher records a lecture.
          </p>
        </div>
      ) : (
        <div style={styles.taskGrid}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container: { display: "flex", flexDirection: "column", gap: "24px" },
  dashHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  dashTitle: { color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 },
  syncText:  { color: "rgba(255,255,255,0.3)", fontSize: "11px" },
  refreshBtn: {
    padding: "8px 16px",
    background: "rgba(99,102,241,0.15)",
    color: "#818cf8",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "10px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
  },
  alertBanner: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)",
  },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  statCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "16px",
    textAlign: "center",
  },
  statIcon:  { fontSize: "22px", marginBottom: "8px" },
  statValue: { fontSize: "28px", fontWeight: 700, lineHeight: 1 },
  statLabel: { color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "6px" },
  filterSection: { display: "flex", flexDirection: "column", gap: "10px" },
  filterGroup: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  filterLabel: { color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 500, minWidth: "48px" },
  filterRow: { display: "flex", gap: "6px", flexWrap: "wrap" },
  filterBtn: {
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    transition: "all 0.2s",
  },
  filterActive: {
    background: "rgba(99,102,241,0.25)",
    color: "#818cf8",
    borderColor: "rgba(99,102,241,0.5)",
  },
  taskGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" },
  card: {
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "opacity 0.2s",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" },
  cardLeft:   { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" },
  cardRight:  { display: "flex", alignItems: "center", gap: "6px" },
  typeIcon:   { fontSize: "16px" },
  typeBadge: {
    fontSize: "11px", fontWeight: 600,
    padding: "2px 8px", borderRadius: "6px",
    border: "1px solid",
  },
  subjectBadge: {
    fontSize: "11px", color: "rgba(255,255,255,0.5)",
    background: "rgba(255,255,255,0.06)",
    padding: "2px 8px", borderRadius: "6px",
  },
  priorityBadge: { fontSize: "11px", padding: "2px 10px", borderRadius: "6px" },
  deleteBtn: {
    background: "transparent",
    border: "none", color: "rgba(255,255,255,0.2)",
    cursor: "pointer", fontSize: "14px",
    padding: "2px 6px", borderRadius: "4px",
  },
  cardTitle: { color: "#e2e8f0", fontSize: "15px", fontWeight: 600, margin: 0, lineHeight: 1.4 },
  cardDesc:  { color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0, lineHeight: 1.5 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginTop: "4px" },
  deadlineChip: { fontSize: "12px", padding: "4px 10px", borderRadius: "8px", border: "1px solid" },
  noDeadline:   { color: "rgba(255,255,255,0.2)", fontSize: "12px" },
  completeBtn: {
    fontSize: "12px", fontWeight: 600,
    padding: "6px 14px", borderRadius: "8px",
    border: "1px solid", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    transition: "all 0.2s",
  },
  loadingState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "80px", gap: "16px" },
  spinner: {
    width: "40px", height: "40px",
    border: "3px solid rgba(99,102,241,0.2)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyState: { textAlign: "center", padding: "80px 20px" },
};
