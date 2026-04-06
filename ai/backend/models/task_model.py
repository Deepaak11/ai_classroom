"""
models/task_model.py
Pydantic data models (schemas) for Task and User
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# ─── Task Model ───────────────────────────────────────────────────────────────
class TaskCreate(BaseModel):
    """Model for creating a new task (sent from NLP output)."""
    type: Literal["Assignment", "Test", "Quiz", "Exam", "Reminder", "General"]
    title: str
    deadline: Optional[str] = None          # e.g., "2026-04-02"
    subject: Optional[str] = None           # e.g., "DBMS"
    description: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high"]] = "medium"

class TaskUpdate(BaseModel):
    """Model for updating task status."""
    status: Literal["pending", "completed"]

class TaskResponse(BaseModel):
    """Model returned to the frontend."""
    id: str
    type: str
    title: str
    deadline: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    completed_by: list[str] = []
    created_at: str

# ─── Text Processing Model ────────────────────────────────────────────────────
class TranscriptInput(BaseModel):
    """Input model for POST /tasks/process-text"""
    text: str                               # Raw transcript from speech recognition
    teacher_id: Optional[str] = None        # Optional: which teacher sent this

# ─── Auth Models ──────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: Literal["teacher", "student"] = "student"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    token: str
