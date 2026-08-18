import traceback
import asyncio

from dotenv import load_dotenv

from app.services.memory_service import MemoryService
from app.services.profile_service import ProfileService
from app.services.prompt_builder import PromptBuilder
from app.services.rag_service import RAGService
from app.services.question_router import QuestionRouter
from app.services.gemini_client import call_gemini

load_dotenv()


def _generate_title(question: str) -> str:
    """Ask the AI to produce a short, relevant chat title from the first message."""
    prompt = f"""Generate a short chat title (4-6 words max) for this message: "{question}"
Rules: Be specific, no quotes, no punctuation, Title Case, return ONLY the title.
Title:"""
    try:
        title = call_gemini(prompt).strip().strip('"').strip("'")
        return title[:60] if title else question[:40]
    except Exception:
        return question[:40]


def _build_prompt(question: str, language: str, profile=None, history=None, documents=None) -> str:
    """Always use PromptBuilder so the citizen profile is included in every prompt."""
    return PromptBuilder.build(profile, history, documents or [], question, language)


class ChatService:

    def __init__(self, db):
        self.db = db
        self.memory = MemoryService(db)
        self.profile = ProfileService(db)
        self.rag = RAGService(db)

    async def chat(
        self,
        user_id,
        question,
        language="English",
        conversation_id=None,
        current_user=None,
    ):
        # ----------------------------------
        # Conversation
        # ----------------------------------
        is_new_conversation = conversation_id is None
        if is_new_conversation:
            conversation = await self.memory.create_conversation(user_id, "New Chat")
            conversation_id = conversation["_id"]

        # ----------------------------------
        # Profile + History — fetched in parallel
        # ----------------------------------
        print("STEP 1: chat() started")
        profile, history = await asyncio.gather(
            self.profile.get_profile(user_id, user_defaults=current_user),
            self.memory.get_recent_context(conversation_id),
        )
        print("STEP 2: profile + history loaded")

        # ----------------------------------
        # Question Classification
        # ----------------------------------
        router = QuestionRouter()
        question_type = router.classify(question)
        print("STEP 3: question type =", question_type)

        documents = []
        sources = []

        # ----------------------------------
        # RAG — runs for ALL question types
        # FAISS semantic search is fast enough (< 5ms on warm cache) and smart
        # enough to find relevant docs even for general questions.
        # Only skip for purely conversational messages with no keywords.
        # ----------------------------------
        print("STEP 4: searching RAG")
        documents = await self.rag.search_documents(
            question, profile=profile, user_id=user_id
        )
        print("STEP 5: RAG returned", len(documents), "documents")
        if documents:
            sources = await self.rag.get_sources(documents)

        # ----------------------------------
        # Build prompt (with or without docs)
        # ----------------------------------
        prompt = _build_prompt(question, language, profile, history, documents)

        # ----------------------------------
        # Call AI + generate title in parallel
        # ----------------------------------
        print("STEP 6: calling AI")
        try:
            if is_new_conversation:
                # Run answer and title generation concurrently — saves ~800 ms
                answer_task = asyncio.wait_for(
                    asyncio.to_thread(call_gemini, prompt),
                    timeout=60,
                )
                title_task = asyncio.wait_for(
                    asyncio.to_thread(_generate_title, question),
                    timeout=10,
                )
                results = await asyncio.gather(answer_task, title_task, return_exceptions=True)

                answer = results[0] if not isinstance(results[0], Exception) else None
                if isinstance(results[0], Exception):
                    print(f"\n========== ANSWER TASK FAILED ==========")
                    print(f"Type   : {type(results[0]).__name__}")
                    print(f"Message: {results[0]}")
                    print(f"=========================================\n")
                    raise results[0]
                answer = (answer or "").strip()

                smart_title = results[1] if not isinstance(results[1], Exception) else question[:40]
                smart_title = (smart_title or question[:40]).strip()

                await self.memory.rename_conversation(conversation_id, smart_title)
                print(f"STEP 8: title set to '{smart_title}'")
            else:
                answer = await asyncio.wait_for(
                    asyncio.to_thread(call_gemini, prompt),
                    timeout=60,
                )
                answer = (answer or "").strip()

            if not answer:
                raise ValueError("AI returned an empty response.")

        except asyncio.TimeoutError:
            print("\n========== AI TIMEOUT ==========\n")
            answer = "I could not finish that request in time. Please try again."

        except Exception as e:
            print("\n========== AI ERROR ==========")
            print(f"Type   : {type(e).__name__}")
            print(f"Message: {e}")
            traceback.print_exc()
            print("==================================\n")
            answer = "I could not process that request right now. Please try again in a moment."

        # ----------------------------------
        # Save messages
        # ----------------------------------
        await self.memory.save_message(conversation_id, user_id, "user", question)
        await self.memory.save_message(conversation_id, user_id, "bot", answer)

        return {
            "conversation_id": conversation_id,
            "response": answer,
            "sources": sources,
        }
