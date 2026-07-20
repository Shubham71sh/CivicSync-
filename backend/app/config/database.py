from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import logging
import asyncio
import os
import re
import json
import socket
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger("uvicorn.error")

# -------------------------------------------------------------
# JSON File-Based Database Fallback for development/hackathons
# -------------------------------------------------------------

class MockCursor:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def limit(self, n):
        self.data = self.data[:n]
        return self

    def skip(self, n):
        self.data = self.data[n:]
        return self

    def sort(self, key, direction=1):
        reverse = (direction == -1)
        def sort_key(x):
            val = x.get(key, "")
            if isinstance(val, datetime):
                return val.isoformat()
            return str(val)
        self.data.sort(key=sort_key, reverse=reverse)
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index >= len(self.data):
            raise StopAsyncIteration
        val = self.data[self.index]
        self.index += 1
        return val

class MockCollection:
    def __init__(self, db_file, collection_name):
        self.db_file = db_file
        self.collection_name = collection_name

    def _read_data(self):
        if not os.path.exists(self.db_file):
            return []
        try:
            with open(self.db_file, "r") as f:
                content = f.read().strip()
                if not content:
                    return []
                data = json.loads(content)
                return data.get(self.collection_name, [])
        except Exception:
            return []

    def _write_data(self, data):
        all_data = {}
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, "r") as f:
                    content = f.read().strip()
                    if content:
                        all_data = json.loads(content)
            except Exception:
                pass
        all_data[self.collection_name] = data
        os.makedirs(os.path.dirname(self.db_file), exist_ok=True)
        with open(self.db_file, "w") as f:
            json.dump(all_data, f, default=str, indent=2)

    async def find_one(self, query):
        data = self._read_data()
        for doc in data:
            match = True
            for k, v in query.items():
                if k == "_id" and isinstance(v, ObjectId):
                    v = str(v)
                doc_val = doc.get(k)
                if k == "_id":
                    doc_val = str(doc_val)
                if doc_val != v:
                    match = False
                    break
            if match:
                return doc
        return None

    def find(self, query=None):
        query = query or {}
        data = self._read_data()
        results = []
        for doc in data:
            match = True
            for k, v in query.items():
                if k == "$or":
                    or_match = False
                    for condition in v:
                        for cond_k, cond_v in condition.items():
                            val = doc.get(cond_k, "")
                            if isinstance(cond_v, dict) and "$regex" in cond_v:
                                regex_val = cond_v["$regex"]
                                if re.search(regex_val, str(val), re.IGNORECASE):
                                    or_match = True
                                    break
                        if or_match:
                            break
                    if not or_match:
                        match = False
                        break
                else:
                    if k == "_id" and isinstance(v, ObjectId):
                        v = str(v)
                    doc_val = doc.get(k)
                    if k == "_id":
                        doc_val = str(doc_val)
                    if doc_val != v:
                        match = False
                        break
            if match:
                results.append(doc)
        return MockCursor(results)

    async def insert_one(self, document):
        data = self._read_data()
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        elif isinstance(document["_id"], ObjectId):
            document["_id"] = str(document["_id"])
        
        for k, v in document.items():
            if isinstance(v, datetime):
                document[k] = v.isoformat() + "Z"

        data.append(document)
        self._write_data(data)
        
        class InsertResult:
            inserted_id = document["_id"]
        return InsertResult()

    async def update_one(self, query, update, upsert=False):
        data = self._read_data()
        matched_doc = None
        for doc in data:
            match = True
            for k, v in query.items():
                if k == "_id" and isinstance(v, ObjectId):
                    v = str(v)
                doc_val = doc.get(k)
                if k == "_id":
                    doc_val = str(doc_val)
                if doc_val != v:
                    match = False
                    break
            if match:
                matched_doc = doc
                break

        if matched_doc:
            if "$set" in update:
                for k, v in update["$set"].items():
                    if isinstance(v, datetime):
                        v = v.isoformat() + "Z"
                    matched_doc[k] = v
            self._write_data(data)
        elif upsert:
            new_doc = {}
            for k, v in query.items():
                if k == "_id" and isinstance(v, ObjectId):
                    v = str(v)
                new_doc[k] = v
            if "$set" in update:
                for k, v in update["$set"].items():
                    if isinstance(v, datetime):
                        v = v.isoformat() + "Z"
                    new_doc[k] = v
            if "$setOnInsert" in update:
                for k, v in update["$setOnInsert"].items():
                    if isinstance(v, ObjectId):
                        v = str(v)
                    new_doc[k] = v
            if "_id" not in new_doc:
                new_doc["_id"] = str(ObjectId())
            data.append(new_doc)
            self._write_data(data)

    async def delete_one(self, query):
        data = self._read_data()
        new_data = []
        deleted = False
        for doc in data:
            match = True
            for k, v in query.items():
                if k == "_id" and isinstance(v, ObjectId):
                    v = str(v)
                doc_val = doc.get(k)
                if k == "_id":
                    doc_val = str(doc_val)
                if doc_val != v:
                    match = False
                    break
            if match and not deleted:
                deleted = True
                continue
            new_data.append(doc)
        self._write_data(new_data)

    async def delete_many(self, query):
        data = self._read_data()
        new_data = []
        for doc in data:
            match = True
            for k, v in query.items():
                if k == "_id" and isinstance(v, ObjectId):
                    v = str(v)
                doc_val = doc.get(k)
                if k == "_id":
                    doc_val = str(doc_val)
                if doc_val != v:
                    match = False
                    break
            if match:
                continue
            new_data.append(doc)
        self._write_data(new_data)

    async def count_documents(self, query):
        cursor = self.find(query)
        return len(cursor.data)

class JSONFileDatabase:
    def __init__(self, db_file):
        self.db_file = db_file
        self.collections = {}

    def __getattr__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(self.db_file, name)
        return self.collections[name]

    def __getitem__(self, name):
        return getattr(self, name)


class Database:
    client = None
    db = None
    is_mock = False

db_helper = Database()

def get_db():
    if db_helper.db is None:
        try:
            logger.info("Initializing database connection...")
            client = AsyncIOMotorClient(
                settings.MONGODB_URL, 
                serverSelectionTimeoutMS=1500
            )
            
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
            if loop.is_running():
                # Perform a fast socket connection test
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1.0)
                url_host = "localhost"
                url_port = 27017
                
                url = settings.MONGODB_URL
                if "mongodb+srv://" in url:
                    # Let motor perform async check
                    loop.create_task(client.admin.command('ping'))
                else:
                    host_port = url.split("mongodb://")[-1].split("/")[0].split("?")[0]
                    if "@" in host_port:
                        host_port = host_port.split("@")[-1]
                    if "," in host_port:
                        host_port = host_port.split(",")[0]
                    
                    if ":" in host_port:
                        url_host, port_str = host_port.split(":")
                        url_port = int(port_str)
                    else:
                        url_host = host_port
                    
                    s.connect((url_host, url_port))
                    s.close()
                
                db_helper.client = client
                db_helper.db = client[settings.DATABASE_NAME]
                db_helper.is_mock = False
                logger.info(f"Connected to MongoDB at {settings.MONGODB_URL}")
            else:
                loop.run_until_complete(client.admin.command('ping'))
                db_helper.client = client
                db_helper.db = client[settings.DATABASE_NAME]
                db_helper.is_mock = False
                logger.info(f"Connected to MongoDB at {settings.MONGODB_URL}")
        except Exception as e:
            logger.warning(f"Error checking MongoDB connection: {e}")
            logger.warning("FALLING BACK TO LOCAL FILE-BASED DATABASE (data/db.json)")
            db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "db.json")
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            db_helper.db = JSONFileDatabase(db_path)
            db_helper.is_mock = True
            
    return db_helper.db

def close_db():
    if db_helper.client:
        db_helper.client.close()
        db_helper.client = None
    db_helper.db = None
    logger.info("Closed database connection")
