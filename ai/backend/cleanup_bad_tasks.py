import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["ai_classroom"]
    tasks_coll = db["tasks"]

    print("Deleting tasks with random text...")
    
    # Delete tasks with "Nee question kittae irukkaa aamaa" or other obvious garbage
    result = await tasks_coll.delete_many({
        "title": {"$regex": "kittae|aamaa|singapore", "$options": "i"}
    })
    
    # Also delete anything that's categorized as General if any slipped through
    result_general = await tasks_coll.delete_many({
        "type": "General"
    })
    
    print(f"Removed {result.deleted_count} tasks containing invalid Tamil/random words.")
    print(f"Removed {result_general.deleted_count} General tasks.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(run())
