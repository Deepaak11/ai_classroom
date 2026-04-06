import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['ai_classroom']
    tasks = db['tasks']
    
    # Update tasks missing completed_by
    res1 = await tasks.update_many(
        {"completed_by": {"$exists": False}},
        {"$set": {"completed_by": []}}
    )
    print(f"Added completed_by: [] to {res1.modified_count} tasks")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix())
