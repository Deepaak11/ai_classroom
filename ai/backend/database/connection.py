"""
database/connection.py
Async MongoDB connection using Motor
Database: ai_classroom
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# ─── Global DB Client ──────────────────────────────────────────────────────────
class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

# ─── Connect ──────────────────────────────────────────────────────────────────
async def connect_to_mongo():
    """Create MongoDB connection on app startup."""
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_instance.client = AsyncIOMotorClient(mongo_url)
    db_instance.db = db_instance.client["ai_classroom"]   # Database name
    print(f"✅ Connected to MongoDB at {mongo_url}")

# ─── Disconnect ───────────────────────────────────────────────────────────────
async def close_mongo_connection():
    """Close MongoDB connection on app shutdown."""
    if db_instance.client:
        db_instance.client.close()
        print("🔌 MongoDB connection closed.")

# ─── Get Collections ──────────────────────────────────────────────────────────
def get_tasks_collection():
    """Return the 'tasks' collection."""
    return db_instance.db["tasks"]

def get_users_collection():
    """Return the 'users' collection."""
    return db_instance.db["users"]
