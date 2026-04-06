/**
 * components/TeacherInterface.js
 * Teacher's dashboard:
 *   - Tab 1: Live Recording (speech → NLP → extracted tasks)
 *   - Tab 2: Student Overview (class-wide stats, task breakdown, recent tasks)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { tasksAPI } from "../services/api";

// ─── Task type config ──────────────────────────────────────────────────────────
const TYPE_COLORS = {
  Assignment: { bg: "#3b82f620", border: "#3b82f6", text: "#60a5fa", icon: "📝" },
  Test:       { bg: "#f5973320", border: "#f59733", text: "#fbbf24", icon: "📋" },
  Quiz:       { bg: "#a855f720", border: "#a855f7", text: "#c084fc", icon: "❓" },
  Exam:       { bg: "#ef444420", border: "#ef4444", text: "#f87171", icon: "📚" },
  Reminder:   { bg: "#10b98120", border: "#10b981", text: "#34d399", icon: "🔔" },
  General:    { bg: "#6b728020", border: "#6b7280", text: "#9ca3af", icon: "💬" },
};

// ─── Stable bar heights (avoids Math.random on every render) ──────────────────
const BAR_HEIGHTS = Array.from({ length: 20 }, () => Math.floor(Math.random() * 30 + 10));

// ─── Animated Waveform ────────────────────────────────────────────────────────
function Waveform({ isActive }) {
  return (
    <div style={styles.waveform}>
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          style={{
            ...styles.waveBar,
            animationDelay: isActive ? `${i * 0.08}s` : "0s",
            background: isActive ? `hsl(${220 + i * 8}, 70%, 65%)` : "rgba(255,255,255,0.15)",
            animation: isActive ? "wave 1.2s ease-in-out infinite" : "none",
            height: isActive ? `${h}px` : "4px",
          }}
        />
      ))}
    </div>
  );
}

// ─── Extracted Task Card (Recording tab) ──────────────────────────────────────
function ExtractedTaskCard({ task }) {
  const colors = TYPE_COLORS[task.type] || TYPE_COLORS.General;
  return (
    <div style={{ ...styles.taskCard, borderLeft: `3px solid ${colors.border}`, background: colors.bg }}>
      <div style={styles.taskHeader}>
        <span style={styles.taskIcon}>{colors.icon}</span>
        <span style={{ ...styles.taskBadge, color: colors.text, borderColor: colors.border }}>
          {task.type}
        </span>
        {task.priority && (
          <span style={{ ...styles.priorityBadge, background: task.priority === "high" ? "#ef444420" : "#f5973320" }}>
            {task.priority} priority
          </span>
        )}
      </div>
      <p style={styles.taskTitle}>{task.title}</p>
      <div style={styles.taskMeta}>
        {task.subject  && <span style={styles.metaTag}>📖 {task.subject}</span>}
        {task.deadline && <span style={styles.metaTag}>📅 {task.deadline}</span>}
      </div>
    </div>
  );
}

// ─── Student Overview Tab ─────────────────────────────────────────────────────
function StudentOverview() {
  const [stats,      setStats]      = useState(null);
  const [tasks,      setTasks]      = useState([]);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastSync,   setLastSync]   = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      const filters = typeFilter !== "all" ? { type: typeFilter } : {};
      const [statsData, taskData, progressData] = await Promise.all([
        tasksAPI.getStats(),
        tasksAPI.getTasks(filters),
        tasksAPI.getStudentProgress(),
      ]);
      setStats(statsData);
      setTasks(taskData.tasks || []);
      setStudents(progressData.students || []);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch student overview:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div style={styles.loadingCenter}>
        <div style={styles.spinner} />
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 12 }}>Loading student data...</p>
      </div>
    );
  }

  if (!stats) return null;

  const completionPct = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const pendingPct = stats.total > 0
    ? Math.round((stats.pending / stats.total) * 100)
    : 0;

  const summaryCards = [
    { label: "Total Tasks",   value: stats.total,     icon: "📋", color: "#6366f1" },
    { label: "Pending",       value: `${pendingPct}%`, icon: "⏳", color: "#f59e0b" },
    { label: "Completed",     value: `${completionPct}%`, icon: "✅", color: "#10b981" },
    { label: "Completion",    value: `${completionPct}%`, icon: "📊", color: "#a855f7" },
  ];

  const typeOrder = ["Assignment", "Test", "Quiz", "Exam", "Reminder"];
  const byType    = stats.by_type || {};
  const maxCount  = Math.max(...Object.values(byType), 1);

  const TYPE_FILTERS = ["all", "Assignment", "Test", "Quiz", "Exam", "Reminder"];

  return (
    <div style={styles.overviewContainer}>

      {/* Header */}
      <div style={styles.overviewHeader}>
        <div>
          <h2 style={styles.panelTitle}>📊 Student Overview</h2>
          {lastSync && <span style={styles.syncLabel}>Auto-refreshes every 20s · Last: {lastSync}</span>}
        </div>
        <button onClick={fetchData} style={styles.refreshBtn}>🔄 Refresh</button>
      </div>

      {/* Summary stat cards */}
      <div style={styles.summaryGrid}>
        {summaryCards.map(c => (
          <div key={c.label} style={{ ...styles.statCard, borderTop: `3px solid ${c.color}` }}>
            <div style={styles.statIcon}>{c.icon}</div>
            <div style={{ ...styles.statValue, color: c.color, display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px" }}>
              {c.value}
              {c.subtext && <span style={{ fontSize: "14px", fontWeight: 600, opacity: 0.7 }}>({c.subtext})</span>}
            </div>
            <div style={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Completion progress bar */}
      <div style={styles.progressSection}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>Class Completion Rate</span>
          <span style={{ ...styles.progressPct, color: completionPct >= 70 ? "#10b981" : completionPct >= 40 ? "#f59e0b" : "#ef4444" }}>
            {completionPct}%
          </span>
        </div>
        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressFill,
            width: `${completionPct}%`,
            background: completionPct >= 70
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : completionPct >= 40
              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
              : "linear-gradient(90deg, #ef4444, #f87171)",
          }} />
        </div>
      </div>

      {/* Tasks by type breakdown */}
      {Object.keys(byType).length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>Tasks by Type</p>
          <div style={styles.typeRows}>
            {typeOrder.filter(t => byType[t]).map(t => {
              const cfg = TYPE_COLORS[t] || TYPE_COLORS.General;
              const pct = Math.round((byType[t] / maxCount) * 100);
              return (
                <div key={t} style={styles.typeRow}>
                  <span style={styles.typeRowIcon}>{cfg.icon}</span>
                  <span style={{ ...styles.typeRowLabel, color: cfg.text }}>{t}</span>
                  <div style={styles.typeBarTrack}>
                    <div style={{ ...styles.typeBarFill, width: `${pct}%`, background: cfg.border }} />
                  </div>
                  <span style={{ ...styles.typeCount, color: cfg.text }}>{byType[t]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Student Roster */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>Student Roster</p>
        {students.length === 0 ? (
          <div style={styles.emptyTasks}>
            <span style={{ fontSize: 24 }}>👥</span>
            <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 8, fontSize: 13 }}>No students enrolled yet.</p>
          </div>
        ) : (
          <div style={{ ...styles.taskTable, marginTop: 8 }}>
            <div style={styles.tableHead}>
              <span style={{ flex: 2 }}>Student Name</span>
              <span style={{ flex: 2 }}>Email</span>
              <span style={{ flex: 1, textAlign: "center" }}>Completed</span>
              <span style={{ flex: 1, textAlign: "center" }}>Pending</span>
              <span style={{ flex: 1.5 }}>Progress</span>
            </div>
            {students.map(std => {
              const totalTasks = std.completed + std.pending;
              const compPct = totalTasks > 0 ? Math.round((std.completed / totalTasks) * 100) : 0;
              const pendPct = totalTasks > 0 ? Math.round((std.pending / totalTasks) * 100) : 0;
              
              return (
                <div key={std.student_id} style={{ ...styles.tableRow, padding: "12px 12px" }}>
                  <span style={{ flex: 2, color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>{std.name}</span>
                  <span style={{ flex: 2, color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{std.email}</span>
                  <span style={{ flex: 1, textAlign: "center", color: "#10b981", fontWeight: 600, fontSize: 13 }}>
                    {std.completed}
                    {totalTasks > 0 && <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>({compPct}%)</span>}
                  </span>
                  <span style={{ flex: 1, textAlign: "center", color: "#f59e0b", fontWeight: 600, fontSize: 13 }}>
                    {std.pending}
                    {totalTasks > 0 && <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>({pendPct}%)</span>}
                  </span>
                  <span style={{ flex: 1.5, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3, transition: "width 0.4s ease", width: `${std.completion_pct}%`,
                        background: std.completion_pct >= 70 ? "#10b981" : std.completion_pct >= 40 ? "#f59e0b" : "#ef4444"
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", width: 28, textAlign: "right" }}>{std.completion_pct}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent tasks list with filter */}
      <div style={styles.section}>
        <div style={styles.taskListHeader}>
          <p style={styles.sectionTitle}>Recent Tasks</p>
          <div style={styles.typeFilterRow}>
            {TYPE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                style={{ ...styles.filterChip, ...(typeFilter === f ? styles.filterChipActive : {}) }}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>

        {tasks.length === 0 ? (
          <div style={styles.emptyTasks}>
            <span style={{ fontSize: 32 }}>🎒</span>
            <p style={{ color: "rgba(255,255,255,0.3)", marginTop: 8, fontSize: 13 }}>No tasks found</p>
          </div>
        ) : (
          <div style={styles.taskTable}>
            {/* Table header */}
            <div style={styles.tableHead}>
              <span style={{ flex: 2 }}>Title</span>
              <span style={{ flex: 1 }}>Type</span>
              <span style={{ flex: 1 }}>Subject</span>
              <span style={{ flex: 1 }}>Deadline</span>
              <span style={{ flex: 1, textAlign: "center" }}>Status</span>
              <span style={{ flex: 1, textAlign: "center" }}>Priority</span>
              <span style={{ flex: 0.5, textAlign: "center" }}>Action</span>
            </div>
            {tasks.slice(0, 25).map((task, i) => {
              const cfg  = TYPE_COLORS[task.type] || TYPE_COLORS.General;
              const done = task.status === "completed";
              return (
                <div key={task.id || i} style={{ ...styles.tableRow, opacity: done ? 0.6 : 1 }}>
                  <span style={{ flex: 2, color: done ? "rgba(255,255,255,0.4)" : "#e2e8f0", fontSize: 13, textDecoration: done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {task.title}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cfg.text, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "2px 7px", borderRadius: 5 }}>
                      {cfg.icon} {task.type}
                    </span>
                  </span>
                  <span style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                    {task.subject || "—"}
                  </span>
                  <span style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                    {task.deadline || "—"}
                  </span>
                  <span style={{ flex: 1, textAlign: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                      background: done ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                      color:      done ? "#34d399"               : "#fbbf24",
                    }}>
                      {done ? "✓ Done" : "⏳ Pending"}
                    </span>
                  </span>
                  <span style={{ flex: 1, textAlign: "center" }}>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 5,
                      background: task.priority === "high" ? "rgba(239,68,68,0.15)" : task.priority === "low" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                      color:      task.priority === "high" ? "#f87171"               : task.priority === "low" ? "#34d399"               : "#fbbf24",
                    }}>
                      {task.priority || "medium"}
                    </span>
                  </span>
                  <span style={{ flex: 0.5, display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={() => tasksAPI.deleteTask(task.id).then(fetchData)}
                      style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}
                      title="Delete Task permanently"
                    >
                      🗑️
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Teacher Component ────────────────────────────────────────────────────
export default function TeacherInterface() {
  const {
    transcript, finalTranscript,
    isListening, isSupported,
    startListening, stopListening, resetTranscript,
  } = useSpeechRecognition();

  const [activeTab,      setActiveTab]      = useState("record");  // "record" | "students"
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [processing,     setProcessing]     = useState(false);
  const [sessionLog,     setSessionLog]     = useState([]);
  const [totalExtracted, setTotalExtracted] = useState(0);

  const sentRef            = useRef("");
  const timerRef           = useRef(null);
  const logEndRef          = useRef(null);
  const finalTranscriptRef = useRef("");

  // ── Auto-scroll log ───────────────────────────────────────────────────────
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionLog]);

  // ── Send transcript to backend ────────────────────────────────────────────
  const sendToBackend = useCallback(async (text) => {
    const newText = text.replace(sentRef.current, "").trim();
    if (!newText || newText.length < 15) return;

    setProcessing(true);
    try {
      const result = await tasksAPI.processText(newText);
      if (result.tasks && result.tasks.length > 0) {
        setExtractedTasks(prev => [...result.tasks, ...prev]);
        setTotalExtracted(prev => prev + result.tasks.length);
        setSessionLog(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          text: newText.substring(0, 80) + (newText.length > 80 ? "..." : ""),
          tasksFound: result.tasks.length,
        }]);
      }
      sentRef.current = text;
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setProcessing(false);
    }
  }, []);

  // ── Keep ref in sync ──────────────────────────────────────────────────────
  useEffect(() => {
    finalTranscriptRef.current = finalTranscript;
  }, [finalTranscript]);

  // ── Auto-send every 8 s; send remainder on stop ───────────────────────────
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        if (finalTranscriptRef.current) sendToBackend(finalTranscriptRef.current);
      }, 8000);
    } else {
      clearInterval(timerRef.current);
      if (finalTranscriptRef.current) sendToBackend(finalTranscriptRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isListening, sendToBackend]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      sentRef.current = "";
      startListening();
    }
  };

  const handleManualSend = () => {
    if (finalTranscript) sendToBackend(finalTranscript);
  };

  const clearSession = () => {
    stopListening();
    resetTranscript();
    sentRef.current = "";
    setExtractedTasks([]);
    setSessionLog([]);
  };

  // ── Not supported fallback ────────────────────────────────────────────────
  if (!isSupported) {
    return (
      <div style={styles.unsupported}>
        <div style={{ fontSize: "48px" }}>🚫</div>
        <h3 style={{ color: "#fff", margin: "16px 0 8px" }}>Browser Not Supported</h3>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Web Speech API requires Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* ── Tab Bar ── */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab("record")}
          style={{ ...styles.tab, ...(activeTab === "record" ? styles.tabActive : {}) }}
        >
          🎙️ Live Recording
          {totalExtracted > 0 && (
            <span style={styles.tabBadge}>{totalExtracted}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("students")}
          style={{ ...styles.tab, ...(activeTab === "students" ? styles.tabActive : {}) }}
        >
          📊 Student Overview
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "record" ? (
        <div style={styles.container}>
          {/* Left Panel: Recording */}
          <div style={styles.leftPanel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>🎙️ Live Recording</h2>
              <span style={{ ...styles.statusPill, background: isListening ? "#10b98130" : "#6b728030", color: isListening ? "#34d399" : "#9ca3af" }}>
                {isListening ? "● Recording" : "○ Idle"}
              </span>
            </div>

            <div style={styles.recordCenter}>
              <button onClick={handleToggle} style={{ ...styles.recordBtn, background: isListening ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)", borderColor: isListening ? "#ef4444" : "#6366f1" }}>
                <span style={styles.recordBtnIcon}>{isListening ? "⏹" : "🎙️"}</span>
                <span style={styles.recordBtnText}>{isListening ? "Stop Recording" : "Start Recording"}</span>
              </button>
              <Waveform isActive={isListening} />
            </div>

            <div style={styles.transcriptBox}>
              <div style={styles.transcriptHeader}>
                <span style={styles.transcriptLabel}>Live Transcript</span>
                {processing && <span style={styles.processingBadge}>⚙️ Processing...</span>}
              </div>
              <div style={styles.transcriptScroll}>
                {finalTranscript && <p style={styles.finalText}>{finalTranscript}</p>}
                {transcript      && <p style={styles.interimText}>{transcript}</p>}
                {!finalTranscript && !transcript && (
                  <p style={styles.emptyText}>
                    {isListening ? "Listening… speak now" : "Press Start to begin recording"}
                  </p>
                )}
              </div>
            </div>

            <div style={styles.actionRow}>
              <button onClick={handleManualSend} disabled={!finalTranscript || processing} style={styles.sendBtn}>
                🚀 Send to AI
              </button>
              <button onClick={clearSession} style={styles.clearBtn}>🗑 Clear Session</button>
            </div>

            {sessionLog.length > 0 && (
              <div style={styles.activityLog}>
                <p style={styles.logTitle}>Activity Log</p>
                {sessionLog.map((entry, i) => (
                  <div key={i} style={styles.logEntry}>
                    <span style={styles.logTime}>{entry.time}</span>
                    <span style={styles.logText}>"{entry.text}"</span>
                    <span style={styles.logFound}>+{entry.tasksFound} task(s)</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}
          </div>

          {/* Right Panel: Extracted Tasks */}
          <div style={styles.rightPanel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>✨ Extracted Tasks</h2>
              {totalExtracted > 0 && (
                <span style={styles.countBadge}>{totalExtracted} found</span>
              )}
            </div>

            {extractedTasks.length === 0 ? (
              <div style={styles.emptyTasks}>
                <div style={{ fontSize: "48px" }}>🤖</div>
                <p style={styles.emptyTasksText}>
                  AI will extract tasks from your speech and display them here in real-time.
                </p>
              </div>
            ) : (
              <div style={styles.tasksList}>
                {extractedTasks.map((task, i) => (
                  <ExtractedTaskCard key={i} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <StudentOverview />
      )}

      {/* Waveform + animation CSS */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1);   }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  wrapper:  { display: "flex", flexDirection: "column", gap: "20px", height: "100%" },

  // Tab bar
  tabBar:   { display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0" },
  tab: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "10px 20px", borderRadius: "10px 10px 0 0",
    border: "1px solid transparent", borderBottom: "none",
    background: "transparent", color: "rgba(255,255,255,0.4)",
    fontSize: "14px", fontWeight: 500, cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", transition: "all 0.2s",
  },
  tabActive: {
    background: "rgba(99,102,241,0.15)",
    color: "#818cf8",
    borderColor: "rgba(99,102,241,0.3)",
  },
  tabBadge: {
    background: "#6366f1", color: "#fff",
    borderRadius: "10px", fontSize: "11px", fontWeight: 700,
    padding: "1px 7px",
  },

  // Recording layout
  container: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flex: 1 },
  leftPanel:  { display: "flex", flexDirection: "column", gap: "20px" },
  rightPanel: { display: "flex", flexDirection: "column", gap: "16px" },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  panelTitle:  { color: "#fff", fontSize: "18px", fontWeight: 600, margin: 0 },
  statusPill: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 500 },
  countBadge: { background: "rgba(99,102,241,0.25)", color: "#818cf8", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },

  recordCenter: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
    padding: "24px", background: "rgba(255,255,255,0.03)",
    borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)",
  },
  recordBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
    padding: "24px 40px", borderRadius: "20px", border: "2px solid", cursor: "pointer",
    transition: "all 0.3s", fontFamily: "'Outfit', sans-serif",
  },
  recordBtnIcon: { fontSize: "36px" },
  recordBtnText: { color: "#fff", fontSize: "15px", fontWeight: 600 },
  waveform:      { display: "flex", alignItems: "center", gap: "3px", height: "48px" },
  waveBar:       { width: "4px", borderRadius: "2px", transition: "height 0.3s" },

  transcriptBox: {
    flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", minHeight: "180px",
  },
  transcriptHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  transcriptLabel:  { color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" },
  processingBadge:  { background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "3px 10px", borderRadius: "10px", fontSize: "11px" },
  transcriptScroll: { padding: "16px", maxHeight: "220px", overflowY: "auto" },
  finalText:        { color: "#e2e8f0", lineHeight: 1.7, fontSize: "14px", margin: 0 },
  interimText:      { color: "rgba(255,255,255,0.4)", lineHeight: 1.7, fontSize: "14px", fontStyle: "italic", margin: "8px 0 0" },
  emptyText:        { color: "rgba(255,255,255,0.2)", textAlign: "center", fontSize: "14px", margin: "40px 0" },

  actionRow: { display: "flex", gap: "12px" },
  sendBtn: {
    flex: 1, padding: "12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  },
  clearBtn: {
    padding: "12px 20px", background: "rgba(239,68,68,0.1)", color: "#f87171",
    border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", fontSize: "14px",
    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  },

  activityLog: { background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", maxHeight: "120px", overflowY: "auto" },
  logTitle:   { color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" },
  logEntry:   { display: "flex", gap: "8px", alignItems: "baseline", padding: "4px 0", borderTop: "1px solid rgba(255,255,255,0.04)" },
  logTime:    { color: "rgba(255,255,255,0.3)", fontSize: "11px", whiteSpace: "nowrap" },
  logText:    { color: "rgba(255,255,255,0.5)", fontSize: "11px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logFound:   { color: "#34d399", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" },

  emptyTasks:     { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px" },
  emptyTasksText: { color: "rgba(255,255,255,0.4)", fontSize: "14px", lineHeight: 1.6, maxWidth: "300px", margin: "12px 0 24px" },
  tipBox:         { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "16px 20px", textAlign: "left" },
  tipTitle:       { color: "#818cf8", fontSize: "13px", fontWeight: 600, margin: "0 0 10px" },
  tipText:        { color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "6px 0", fontStyle: "italic" },
  tasksList:      { display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" },
  taskCard:       { padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", animation: "slideIn 0.3s ease" },
  taskHeader:     { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" },
  taskIcon:       { fontSize: "16px" },
  taskBadge:      { fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", padding: "2px 8px", borderRadius: "6px", border: "1px solid" },
  priorityBadge:  { fontSize: "11px", color: "#fbbf24", padding: "2px 8px", borderRadius: "6px" },
  taskTitle:      { color: "#e2e8f0", fontSize: "14px", fontWeight: 500, margin: "0 0 8px", lineHeight: 1.4 },
  taskMeta:       { display: "flex", gap: "8px", flexWrap: "wrap" },
  metaTag:        { color: "rgba(255,255,255,0.45)", fontSize: "11px", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "6px" },

  // Student overview
  overviewContainer: { display: "flex", flexDirection: "column", gap: "24px" },
  overviewHeader:    { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  syncLabel:         { color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: 4, display: "block" },
  refreshBtn: {
    padding: "8px 16px", background: "rgba(99,102,241,0.15)", color: "#818cf8",
    border: "1px solid rgba(99,102,241,0.3)", borderRadius: "10px", fontSize: "13px",
    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  },

  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  statCard:    { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "16px", textAlign: "center" },
  statIcon:    { fontSize: "22px", marginBottom: "8px" },
  statValue:   { fontSize: "28px", fontWeight: 700, lineHeight: 1 },
  statLabel:   { color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "6px" },

  progressSection: { background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" },
  progressHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  progressLabel:   { color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 500 },
  progressPct:     { fontSize: "20px", fontWeight: 700 },
  progressTrack:   { height: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "5px", overflow: "hidden" },
  progressFill:    { height: "100%", borderRadius: "5px", transition: "width 0.6s ease" },

  section:      { background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" },
  sectionTitle: { color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" },

  typeRows:      { display: "flex", flexDirection: "column", gap: "10px" },
  typeRow:       { display: "flex", alignItems: "center", gap: "10px" },
  typeRowIcon:   { fontSize: "16px", width: "20px", textAlign: "center" },
  typeRowLabel:  { fontSize: "13px", fontWeight: 500, width: "90px" },
  typeBarTrack:  { flex: 1, height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" },
  typeBarFill:   { height: "100%", borderRadius: "4px", transition: "width 0.5s ease" },
  typeCount:     { fontSize: "13px", fontWeight: 700, width: "24px", textAlign: "right" },

  taskListHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  typeFilterRow:  { display: "flex", gap: "6px", flexWrap: "wrap" },
  filterChip: {
    padding: "4px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: "11px",
    cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s",
  },
  filterChipActive: { background: "rgba(99,102,241,0.2)", color: "#818cf8", borderColor: "rgba(99,102,241,0.4)" },

  taskTable: { display: "flex", flexDirection: "column", gap: "4px" },
  tableHead: {
    display: "flex", gap: "8px", padding: "8px 12px",
    color: "rgba(255,255,255,0.3)", fontSize: "11px", fontWeight: 600,
    letterSpacing: "0.06em", textTransform: "uppercase",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  tableRow: {
    display: "flex", gap: "8px", alignItems: "center", padding: "10px 12px",
    borderRadius: "8px", transition: "background 0.15s",
    background: "rgba(255,255,255,0.02)",
  },

  loadingCenter: { display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0" },
  spinner: { width: "36px", height: "36px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  unsupported: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", textAlign: "center" },
};
