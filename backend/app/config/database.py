"""
Firestore helper — provides get_col() to access Firestore collections.
All services should import and use this instead of MongoDB motor.

HEAD branch contributed: MockCollection / JSONFileDatabase / Database class
(a file-based fallback for offline/hackathon development).
devasish-dev contributed: Firestore-native get_col(), run_in_executor(), doc_to_dict(), docs_to_list().

MERGE DECISION:
- Primary database is Firestore (production).
- The MockCollection/JSONFileDatabase is preserved as an optional local dev fallback.
- Both contributions are retained. Firestore is used by default.
"""

import asyncio
import os
import re
import json
import logging
from datetime import datetime

from app.core.firebase import get_db

logger = logging.getLogger("uvicorn.error")

# ── Firestore Helpers (Primary — devasish-dev) ────────────────────────────────

def get_col(name: str):
    """Return a Firestore CollectionReference by name."""
    db = get_db()
    if db is None:
        raise RuntimeError("Firestore client is None. Cannot access collection.")
    return db.collection(name)



async def run_in_executor(fn, *args):
    """
    Run a synchronous Firestore call in a thread executor
    so it doesn't block FastAPI's event loop.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, fn, *args)


def doc_to_dict(doc) -> dict:
    """Convert a Firestore DocumentSnapshot to a plain dict with 'id' field."""
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def docs_to_list(query_snapshot) -> list:
    """Convert a Firestore QuerySnapshot to a list of dicts."""
    result = []
    for doc in query_snapshot:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        result.append(data)
    return result


# ── File-Based Mock Database (Local Dev Fallback — HEAD branch) ───────────────
# Used automatically when Firestore is unavailable (e.g., no serviceAccountKey.json).

try:
    from bson import ObjectId
except ImportError:
    # bson is optional — only needed if MockCollection is actually used
    class ObjectId:  # type: ignore
        def __init__(self):
            import uuid
            self._id = uuid.uuid4().hex

        def __str__(self):
            return self._id


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
