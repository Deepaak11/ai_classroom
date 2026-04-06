"""
seed_database.py
Seed MongoDB with sample tasks from the CSV dataset.
Run: python seed_database.py

This is useful for:
  - Testing the student dashboard without recording
  - Verifying MongoDB connection works
  - Demonstrating the app with pre-loaded data
"""

import csv
import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

# ─── Resolve placeholder dates ────────────────────────────────────────────────
def resolve_placeholder_date(date_str: str) -> str:
    """Convert placeholder strings to real YYYY-MM-DD dates."""
    today = datetime.now()
    mapping = {
        "next_friday":    (today + timedelta(days=(4 - today.weekday()) % 7 + 1)).strftime("%Y-%m-%d"),
        "tomorrow":       (today + timedelta(days=1)).strftime("%Y-%m-%d"),
        "end_of_week":    (today + timedelta(days=(6 - today.weekday()))).strftime("%Y-%m-%d"),
        "thursday":       (today + timedelta(days=(3 - today.weekday()) % 7)).strftime("%Y-%m-%d"),
        "next_monday":    (today + timedelta(days=(7 - today.weekday()))).strftime("%Y-%m-%d"),
        "friday":         (today + timedelta(days=(4 - today.weekday()) % 7)).strftime("%Y-%m-%d"),
        "sunday":         (today + timedelta(days=(6 - today.weekday()) % 7)).strftime("%Y-%m-%d"),
        "wednesday":      (today + timedelta(days=(2 - today.weekday()) % 7)).strftime("%Y-%m-%d"),
        "today":          today.strftime("%Y-%m-%d"),
        "next_week":      (today + timedelta(days=7)).strftime("%Y-%m-%d"),
        "next_tuesday":   (today + timedelta(days=(1 - today.weekday()) % 7 + 7)).strftime("%Y-%m-%d"),
        "in_two_weeks":   (today + timedelta(days=14)).strftime("%Y-%m-%d"),
        "in_three_weeks": (today + timedelta(days=21)).strftime("%Y-%m-%d"),
        "end_of_month":   today.replace(day=28).strftime("%Y-%m-%d"),
    }
    return mapping.get(date_str, date_str)

def estimate_priority(task_type: str, deadline_str: str) -> str:
    """Estimate priority based on task type and deadline."""
    if not deadline_str:
        return "medium"
    try:
        deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
        days_left = (deadline - datetime.now()).days
        if task_type in ["Exam", "Test"] or days_left <= 2:
            return "high"
        elif days_left <= 5:
            return "medium"
        else:
            return "low"
    except Exception:
        return "medium"

async def seed():
    """Main seeding function."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["ai_classroom"]
    collection = db["tasks"]

    # Clear existing sample data (optional)
    result = await collection.delete_many({"teacher_id": "seed_script"})
    print(f"🗑  Cleared {result.deleted_count} existing seeded tasks.")

    # Load CSV
    csv_path = "sample_dataset.csv"
    if not os.path.exists(csv_path):
        print(f"❌ CSV not found at {csv_path}. Make sure to run from project root.")
        return

    tasks = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            deadline = row["expected_deadline"].strip()
            if deadline:
                deadline = resolve_placeholder_date(deadline)

            # Build task document
            task = {
                "type":        row["expected_type"].strip(),
                "title":       row["expected_title"].strip(),
                "deadline":    deadline if deadline else None,
                "subject":     row["expected_subject"].strip() or None,
                "description": row["raw_transcript"].strip(),
                "priority":    estimate_priority(row["expected_type"], deadline),
                "status":      "pending",
                "created_at":  datetime.utcnow().isoformat(),
                "teacher_id":  "seed_script",
            }
            tasks.append(task)

    if tasks:
        result = await collection.insert_many(tasks)
        print(f"✅ Seeded {len(result.inserted_ids)} tasks into MongoDB!")
        print(f"   Database: ai_classroom | Collection: tasks")
        print(f"   Run the app and check the Student Dashboard.")
    else:
        print("⚠️  No tasks to seed.")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
