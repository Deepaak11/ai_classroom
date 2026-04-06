import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['ai_classroom']
    async for t in db.tasks.find():
        print(f"ID: {t['_id']}, status: {t.get('status')}, completed_by: {t.get('completed_by')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
