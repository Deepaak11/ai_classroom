/**
 * services/api.js
 * Centralized API calls to the FastAPI backend.
 * All fetch/axios calls live here — components just call these functions.
 */

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ─── Helper: attach JWT token to headers ──────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Helper: handle API response ──────────────────────────────────────────────
async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "An error occurred.");
  }
  return data;
}

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH
// ═════════════════════════════════════════════════════════════════════════════

export const authAPI = {
  register: async (name, email, password, role) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
};

// ═════════════════════════════════════════════════════════════════════════════
//  TASKS
// ═════════════════════════════════════════════════════════════════════════════

export const tasksAPI = {
  /**
   * Send raw transcript text → backend NLP → returns extracted tasks
   * @param {string} text - Raw speech transcript
   * @param {string} teacherId - Optional teacher ID
   */
  processText: async (text, teacherId = null) => {
    const res = await fetch(`${BASE_URL}/tasks/process-text`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ text, teacher_id: teacherId }),
    });
    return handleResponse(res);
  },

  /**
   * Fetch all tasks (with optional filters)
   * @param {object} filters - { status, type, subject }
   */
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status)  params.append("status",  filters.status);
    if (filters.type)    params.append("type",    filters.type);
    if (filters.subject) params.append("subject", filters.subject);

    const res = await fetch(`${BASE_URL}/tasks/?${params.toString()}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Create a task manually
   */
  createTask: async (taskData) => {
    const res = await fetch(`${BASE_URL}/tasks/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  /**
   * Mark task as completed or pending
   * @param {string} taskId
   * @param {string} status - "completed" | "pending"
   */
  updateTaskStatus: async (taskId, status) => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId) => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Get dashboard stats
   */
  getStats: async () => {
    const res = await fetch(`${BASE_URL}/tasks/stats/summary`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Get per-student progress (Teacher only)
   */
  getStudentProgress: async () => {
    const res = await fetch(`${BASE_URL}/tasks/student-progress`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};
