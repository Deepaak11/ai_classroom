import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["ai_classroom"]
    tasks_coll = db["tasks"]

    print("Checking for duplicate tasks...")
    
    # We will iterate through all tasks and keep a set of (title, type, teacher_id)
    seen = set()
    removed_count = 0
    
    # Process oldest first so we keep the original and delete the newer duplicates
    cursor = tasks_coll.find().sort("created_at", 1)
    
    async for task in cursor:
        key = (task.get("title", "").lower().strip(), task.get("type", ""), task.get("teacher_id", ""))
        
        if key in seen:
            print(f"Removing duplicate: {task.get('title')}")
            await tasks_coll.delete_one({"_id": task["_id"]})
            removed_count += 1
        else:
            seen.add(key)
            
    print(f"Done. Removed {removed_count} duplicate tasks.")
    client.close()

if __name__ == "__main__":
    asyncio.run(run())
