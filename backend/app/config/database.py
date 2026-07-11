from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import logging

logger = logging.getLogger("uvicorn.error")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_helper = Database()

def get_db():
    if db_helper.db is None:
        try:
            db_helper.client = AsyncIOMotorClient(settings.MONGODB_URL)
            db_helper.db = db_helper.client[settings.DATABASE_NAME]
            logger.info(f"Connected to MongoDB at {settings.MONGODB_URL}")
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {e}")
            raise e
    return db_helper.db

def close_db():
    if db_helper.client:
        db_helper.client.close()
        db_helper.client = None
        db_helper.db = None
        logger.info("Closed MongoDB connection")
