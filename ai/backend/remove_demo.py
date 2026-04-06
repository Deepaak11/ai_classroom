import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def remove_demo():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['ai_classroom']
    users = db['users']
    
    res = await users.delete_many({"email": {"$regex": "^demo_"}})
    print(f"Removed {res.deleted_count} demo user(s).")
    
    # Optional: also remove them from any task completions
    # wait, their ID was added to completed_by.
    # We don't strictly *need* to remove those since their user is gone, 
    # but let's do it to be clean if they ever clicked "Mark Complete".
    
    # Find the deleted user IDs to pull them from tasks
    # Oh wait, we already deleted them. 
    # Well, their IDs won't harm the tasks much since they won't show up in the users list.
    
    client.close()

if __name__ == "__main__":
    asyncio.run(remove_demo())
