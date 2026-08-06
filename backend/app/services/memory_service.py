"""
Memory Service — Firestore-based conversation and chat history storage.

Migration notes (MongoDB → Firebase):
- Removed: `from bson import ObjectId` — Firestore uses string document IDs.
- Removed: Motor async cursors (`async for doc in cursor`) — replaced with
  `asyncio.run_in_executor` wrapping synchronous Firestore SDK calls.
- Removed: `self.db.conversations.insert_one / find_one / find / update_one / delete_one /
  delete_many` — replaced with Firestore CollectionReference operations.
- Firestore document IDs replace MongoDB ObjectId. The key "_id" in returned dicts
  is set to the Firestore doc ID (string) to keep backward compatibility with
  chat.py and chat_services.py which read `conversation["_id"]`.
- The `db` constructor argument is accepted but ignored — all storage now goes
  directly through `get_col()` so ChatService/RAGService don't need changes.
"""

import asyncio
import uuid
import logging
from datetime import datetime
from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")


def _now_iso() -> str:
    return datetime.utcnow().isoformat()


class MemoryService:

    def __init__(self, db=None):
        # `db` is kept for backward compatibility with callers that pass get_db().
        # All operations use get_col() directly — Firestore only.
        pass

    # --------------------------------------------------
    # Conversation Functions
    # --------------------------------------------------

    async def create_conversation(self, user_id, title="New Chat"):
        loop = asyncio.get_event_loop()
        conversation_id = str(uuid.uuid4())
        now = _now_iso()

        conversation = {
            "userId": str(user_id),
            "title": title,
            "createdAt": now,
            "updatedAt": now,
        }

        await loop.run_in_executor(
            None,
            lambda: get_col("conversations").document(conversation_id).set(conversation),
        )

        # Return with "_id" key for backward compatibility with chat.py
        conversation["_id"] = conversation_id
        return conversation

    async def get_conversation(self, conversation_id):
        loop = asyncio.get_event_loop()
        doc = await loop.run_in_executor(
            None,
            lambda: get_col("conversations").document(conversation_id).get(),
        )
        if not doc.exists:
            return None
        data = doc.to_dict()
        data["_id"] = doc.id
        return data

    async def get_all_conversations(self, user_id):
        loop = asyncio.get_event_loop()

        def _fetch():
            return list(
                get_col("conversations")
                .where("userId", "==", str(user_id))
                .stream()
            )

        docs = await loop.run_in_executor(None, _fetch)

        conversations = []
        for doc in docs:
            data = doc.to_dict()
            data["_id"] = doc.id
            conversations.append(data)

        # Sort by updatedAt descending (mirrors MongoDB .sort("updatedAt", -1))
        conversations.sort(key=lambda c: c.get("updatedAt", ""), reverse=True)
        return conversations

    async def rename_conversation(self, conversation_id, title):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: get_col("conversations").document(conversation_id).update({
                "title": title,
                "updatedAt": _now_iso(),
            }),
        )

    async def update_conversation_time(self, conversation_id):
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: get_col("conversations").document(conversation_id).update({
                    "updatedAt": _now_iso(),
                }),
            )
        except Exception as e:
            logger.warning(f"update_conversation_time failed for {conversation_id}: {e}")

    async def delete_conversation(self, conversation_id):
        loop = asyncio.get_event_loop()

        def _delete():
            # Delete all chat_history docs for this conversation
            msgs = list(
                get_col("chat_history")
                .where("conversationId", "==", conversation_id)
                .stream()
            )
            db_ref = get_col("chat_history")._client
            batch = db_ref.batch()
            for msg in msgs:
                batch.delete(msg.reference)
            batch.commit()

            # Delete the conversation document itself
            get_col("conversations").document(conversation_id).delete()

        await loop.run_in_executor(None, _delete)

    async def clear_all_conversations(self, user_id):
        loop = asyncio.get_event_loop()

        def _clear():
            conversations = list(
                get_col("conversations")
                .where("userId", "==", str(user_id))
                .stream()
            )
            db_ref = get_col("conversations")._client
            batch = db_ref.batch()

            for conv in conversations:
                conv_id = conv.id
                # Delete related chat_history
                msgs = list(
                    get_col("chat_history")
                    .where("conversationId", "==", conv_id)
                    .stream()
                )
                for msg in msgs:
                    batch.delete(msg.reference)
                # Delete conversation doc
                batch.delete(conv.reference)

            batch.commit()

        await loop.run_in_executor(None, _clear)

    # --------------------------------------------------
    # Message Functions
    # --------------------------------------------------

    async def save_message(self, conversation_id, user_id, role, message):
        loop = asyncio.get_event_loop()
        msg_id = str(uuid.uuid4())
        now = _now_iso()

        chat = {
            "conversationId": conversation_id,
            "userId": str(user_id),
            "type": role,
            "text": message,
            "timestamp": now,
        }

        await loop.run_in_executor(
            None,
            lambda: get_col("chat_history").document(msg_id).set(chat),
        )

        chat["_id"] = msg_id
        await self.update_conversation_time(conversation_id)
        return chat

    async def get_messages(self, conversation_id):
        loop = asyncio.get_event_loop()

        def _fetch():
            return list(
                get_col("chat_history")
                .where("conversationId", "==", conversation_id)
                .stream()
            )

        docs = await loop.run_in_executor(None, _fetch)
        messages = []
        for doc in docs:
            data = doc.to_dict()
            data["_id"] = doc.id
            messages.append(data)

        # Sort by timestamp ascending (mirrors MongoDB .sort("timestamp", 1))
        messages.sort(key=lambda m: m.get("timestamp", ""))
        return messages

    async def delete_messages(self, conversation_id):
        loop = asyncio.get_event_loop()

        def _delete():
            msgs = list(
                get_col("chat_history")
                .where("conversationId", "==", conversation_id)
                .stream()
            )
            db_ref = get_col("chat_history")._client
            batch = db_ref.batch()
            for msg in msgs:
                batch.delete(msg.reference)
            batch.commit()

        await loop.run_in_executor(None, _delete)

    async def get_recent_context(self, conversation_id, limit=20):
        loop = asyncio.get_event_loop()

        def _fetch():
            return list(
                get_col("chat_history")
                .where("conversationId", "==", conversation_id)
                .stream()
            )

        docs = await loop.run_in_executor(None, _fetch)
        history = []
        for doc in docs:
            data = doc.to_dict()
            data["_id"] = doc.id
            history.append(data)

        # Sort by timestamp descending, take `limit`, then reverse for chronological order
        history.sort(key=lambda m: m.get("timestamp", ""), reverse=True)
        history = history[:limit]
        history.reverse()
        return history