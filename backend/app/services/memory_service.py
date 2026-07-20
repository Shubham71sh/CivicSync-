from datetime import datetime
from bson import ObjectId


class MemoryService:

    def __init__(self, db):
        self.db = db

    # --------------------------------------------------
    # Conversation Functions
    # --------------------------------------------------

    async def create_conversation(self, user_id, title="New Chat"):

        conversation = {
            "userId": str(user_id),
            "title": title,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        result = await self.db.conversations.insert_one(conversation)

        conversation["_id"] = str(result.inserted_id)

        return conversation

    async def get_conversation(self, conversation_id):

        conversation = await self.db.conversations.find_one(
            {
                "_id": ObjectId(conversation_id)
            }
        )

        if conversation:
            conversation["_id"] = str(conversation["_id"])

        return conversation

    async def get_all_conversations(self, user_id):

        conversations = []

        cursor = self.db.conversations.find(
            {
                "userId": str(user_id)
            }
        ).sort(
            "updatedAt",
            -1
        )

        async for item in cursor:

            item["_id"] = str(item["_id"])

            conversations.append(item)

        return conversations

    async def rename_conversation(
        self,
        conversation_id,
        title
    ):

        await self.db.conversations.update_one(
            {
                "_id": ObjectId(conversation_id)
            },
            {
                "$set": {
                    "title": title,
                    "updatedAt": datetime.utcnow()
                }
            }
        )

    async def update_conversation_time(
        self,
        conversation_id
    ):

        await self.db.conversations.update_one(
            {
                "_id": ObjectId(conversation_id)
            },
            {
                "$set": {
                    "updatedAt": datetime.utcnow()
                }
            }
        )

    async def delete_conversation(
        self,
        conversation_id
    ):

        await self.db.conversations.delete_one(
            {
                "_id": ObjectId(conversation_id)
            }
        )

        await self.db.chat_history.delete_many(
            {
                "conversationId": conversation_id
            }
        )

    async def clear_all_conversations(
        self,
        user_id
    ):

        conversations = self.db.conversations.find(
            {
                "userId": str(user_id)
            }
        )

        async for conversation in conversations:

            await self.db.chat_history.delete_many(
                {
                    "conversationId": str(conversation["_id"])
                }
            )

        await self.db.conversations.delete_many(
            {
                "userId": str(user_id)
            }
        )

    # --------------------------------------------------
    # Message Functions
    # --------------------------------------------------

    async def save_message(

        self,

        conversation_id,

        user_id,

        role,

        message

    ):

        chat = {

            "conversationId": conversation_id,

            "userId": str(user_id),

            "type": role,

            "text": message,

            "timestamp": datetime.utcnow()

        }

        result = await self.db.chat_history.insert_one(chat)

        chat["_id"] = str(result.inserted_id)

        await self.update_conversation_time(
            conversation_id
        )

        return chat

    async def get_messages(

        self,

        conversation_id

    ):

        messages = []

        cursor = self.db.chat_history.find(

            {

                "conversationId": conversation_id

            }

        ).sort(

            "timestamp",

            1

        )

        async for item in cursor:

            item["_id"] = str(item["_id"])

            messages.append(item)

        return messages

    async def delete_messages(

        self,

        conversation_id

    ):

        await self.db.chat_history.delete_many(

            {

                "conversationId": conversation_id

            }

        )

    async def get_recent_context(

        self,

        conversation_id,

        limit=20

    ):

        history = []

        cursor = self.db.chat_history.find(

            {

                "conversationId": conversation_id

            }

        ).sort(

            "timestamp",

            -1

        ).limit(limit)

        async for msg in cursor:

            history.append(msg)

        history.reverse()

        return history