"""
routes/tasks.py
Task API endpoints:
  POST /tasks/process-text  → NLP pipeline → save tasks → return results
  GET  /tasks               → fetch all tasks (with filters)
  POST /tasks               → manually create a task
  PATCH /tasks/{id}         → update task status
  DELETE /tasks/{id}        → delete a task
"""

from fastapi import APIRouter, HTTPException, Query, Header
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database.connection import get_tasks_collection, get_users_collection
from models.task_model import TaskCreate, TaskUpdate, TranscriptInput
from nlp.processor import process_transcript
from routes.auth import verify_token

router = APIRouter()

# ─── Helper: convert MongoDB doc to JSON-serializable dict ────────────────────
def serialize_task(task: dict, current_user_id: Optional[str] = None) -> dict:
    task["id"] = str(task["_id"])
    del task["_id"]
    completed_by = task.get("completed_by", [])
    task["completed_by"] = completed_by
    if current_user_id:
        task["status"] = "completed" if current_user_id in completed_by else "pending"
    return task

# ─── POST /tasks/process-text ─────────────────────────────────────────────────
@router.post("/process-text")
async def process_text(input_data: TranscriptInput):
    """
    Main endpoint: Receive raw transcript → run NLP → save tasks → return them.
    Called by the Teacher Interface in real-time.
    """
    text = input_data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Transcript text cannot be empty.")

    # ── Run NLP Processing ────────────────────────────────────────────────────
    extracted_tasks = process_transcript(text)

    if not extracted_tasks:
        return {
            "message": "No tasks detected in this transcript.",
            "tasks_saved": 0,
            "tasks": []
        }

    # ── Save each task to MongoDB ─────────────────────────────────────────────
    collection = get_tasks_collection()
    saved_tasks = []

    for task_data in extracted_tasks:
        # Prevent repeating tasks (deduplication check)
        existing = await collection.find_one({
            "title": task_data.get("title", ""),
            "type": task_data.get("type", ""),
            "teacher_id": input_data.teacher_id or "unknown"
        })
        if existing:
            continue

        # Build document
        doc = {
            **task_data,
            "status":     "pending",
            "completed_by": [],
            "created_at": datetime.utcnow().isoformat(),
            "teacher_id": input_data.teacher_id or "unknown",
        }
        result = await collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        saved_tasks.append(doc)

    return {
        "message": f"{len(saved_tasks)} task(s) extracted and saved.",
        "tasks_saved": len(saved_tasks),
        "tasks": saved_tasks
    }

# ─── GET /tasks ───────────────────────────────────────────────────────────────
@router.get("/")
async def get_tasks(
    status: Optional[str]  = Query(None, description="Filter by status: pending/completed"),
    type:   Optional[str]  = Query(None, description="Filter by type: Assignment/Test/etc."),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    limit:  int            = Query(50,   description="Max results"),
    authorization: Optional[str] = Header(None)
):
    """
    Fetch all tasks with optional filters.
    Used by the Student Dashboard.
    """
    collection = get_tasks_collection()

    # Check user identity
    user_id = None
    role = None
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = verify_token(authorization.split(" ")[1])
            user_id = payload["user_id"]
            role = payload["role"]
        except Exception:
            pass

    # Build query filter
    query = {}
    
    # If a student requests tasks with a status filter, translate it to completed_by array query
    if role == "student" and user_id:
        if status == "completed":
            query["completed_by"] = user_id
        elif status == "pending":
            query["completed_by"] = {"$ne": user_id}
            
    if type:
        query["type"] = type
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}  # Case-insensitive

    cursor = collection.find(query).sort("created_at", -1).limit(limit)
    
    tasks = []
    users_coll = get_users_collection()
    student_count = await users_coll.count_documents({"role": "student"})
    
    async for task in cursor:
        task_dict = serialize_task(task, user_id)
        
        # Determine strict dynamic status for Teacher Dashboard
        if role != "student":
            comp_by = task_dict.get("completed_by", [])
            dynamic_status = "completed" if (student_count > 0 and len(comp_by) >= student_count) else "pending"
            task_dict["status"] = dynamic_status
            
            # Since DB status is always 'pending', we must apply the teacher's status filter dynamically
            if status and dynamic_status != status:
                continue
                
        tasks.append(task_dict)

    return {
        "total": len(tasks),
        "tasks": tasks
    }

# ─── POST /tasks ──────────────────────────────────────────────────────────────
@router.post("/")
async def create_task(task: TaskCreate):
    """Manually create a task (e.g., teacher types it directly)."""
    collection = get_tasks_collection()

    doc = {
        **task.dict(),
        "status":     "pending",
        "completed_by": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)

    return {"message": "Task created successfully.", "task": doc}

# ─── PATCH /tasks/{id} ────────────────────────────────────────────────────────
@router.patch("/{task_id}")
async def update_task_status(task_id: str, update: TaskUpdate, authorization: Optional[str] = Header(None)):
    """
    Update task status by pushing or pulling the student's ID from the completed_by array.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token for status update.")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    user_id = payload["user_id"]

    collection = get_tasks_collection()

    try:
        obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    if update.status == "completed":
        operation = {"$addToSet": {"completed_by": user_id}}
    else:
        operation = {"$pull": {"completed_by": user_id}}

    result = await collection.update_one({"_id": obj_id}, operation)

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found.")

    return {"message": f"Task marked as {update.status} for user."}

# ─── DELETE /tasks/{id} ───────────────────────────────────────────────────────
@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete a task by ID."""
    collection = get_tasks_collection()

    try:
        obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    result = await collection.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found.")

    return {"message": "Task deleted successfully."}

# ─── GET /tasks/stats ─────────────────────────────────────────────────────────
@router.get("/stats/summary")
async def get_stats(authorization: Optional[str] = Header(None)):
    """Return dashboard statistics for the requesting user."""
    collection = get_tasks_collection()
    
    user_id = None
    role = None
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = verify_token(authorization.split(" ")[1])
            user_id = payload["user_id"]
            role = payload["role"]
        except Exception:
            pass

    total = await collection.count_documents({})
    
    if role == "student" and user_id:
        completed = await collection.count_documents({"completed_by": user_id})
        pending = total - completed
    else:
        # Teacher global view: Aggregate totals across all students
        users_coll = get_users_collection()
        student_count = await users_coll.count_documents({"role": "student"})
        
        # Calculate total exact completions across all tasks
        pipeline = [
            {"$project": {"completed_count": {"$size": {"$ifNull": ["$completed_by", []]}}}}
        ]
        total_completed = 0
        async for doc in collection.aggregate(pipeline):
            total_completed += doc.get("completed_count", 0)
            
        # The true total "assignments" is tasks * students
        total_student_tasks = total * student_count if student_count > 0 else total
        total_pending = total_student_tasks - total_completed
        
        # Return average per student so "Total Tasks" remains the unique task count (total)
        # and the percentages calculated by the frontend (avg/total) are accurate.
        if student_count > 0:
            completed = total_completed / student_count
            pending = total_pending / student_count
        else:
            completed = total_completed
            pending = total_pending

    # Count by type
    pipeline = [{"$group": {"_id": "$type", "count": {"$sum": 1}}}]
    type_counts = {}
    async for doc in collection.aggregate(pipeline):
        type_counts[doc["_id"]] = doc["count"]

    return {
        "total":      total,
        "pending":    pending,
        "completed":  completed,
        "by_type":    type_counts,
    }

# ─── GET /tasks/student-progress ──────────────────────────────────────────────
@router.get("/student-progress")
async def get_student_progress():
    """Return all students and their completion progress (for Teacher Overview)."""
    users_coll = get_users_collection()
    tasks_coll = get_tasks_collection()
    
    students = [doc async for doc in users_coll.find({"role": "student"})]
    total_tasks = await tasks_coll.count_documents({})
    
    tasks = [doc async for doc in tasks_coll.find({}, {"completed_by": 1})]
    
    results = []
    for s in students:
        sid = str(s["_id"])
        completed_count = sum(1 for t in tasks if sid in t.get("completed_by", []))
        
        results.append({
            "student_id": sid,
            "name": s["name"],
            "email": s["email"],
            "completed": completed_count,
            "total": total_tasks,
            "pending": total_tasks - completed_count,
            "completion_pct": round((completed_count / total_tasks * 100)) if total_tasks > 0 else 0
        })
        
    return {"students": results}
