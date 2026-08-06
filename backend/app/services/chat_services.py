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
    prompt = f"""Generate a short chat title (4-6 words max) for a conversation that starts with this message:

"{question}"

Rules:
- Be specific and relevant (e.g. "PM Vishwakarma Scheme Details")
- No quotes, no punctuation at the end
- Title case
- Return ONLY the title, nothing else

Title:"""
    try:
        title = call_gemini(prompt).strip().strip('"').strip("'")
        return title[:60] if title else question[:40]
    except Exception:
        return question[:40]


def _build_prompt(question: str, language: str, profile=None, history=None, documents=None) -> str:
    """Build the best prompt based on what context is available."""

    # If we have documents from RAG — use structured prompt
    if documents:
        return PromptBuilder.build(profile, history, documents, question, language)

    # No documents — answer from AI knowledge directly
    return f"""You are CivicSync AI, a knowledgeable assistant for Indian citizens.

Answer the following question fully and accurately.

Question: {question}

Instructions:
- Answer directly and completely from your knowledge
- If it is about an Indian government scheme, policy, law or act — provide details like eligibility, benefits, how to apply
- If it is a general knowledge question — answer normally
- If it is a programming question — provide working code
- Never say you cannot find documents or that no schemes match
- Always give a helpful, complete answer
- You MUST respond entirely in {language}. If {language} is Hindi, write the ENTIRE response in Hindi (Devanagari script). If {language} is Punjabi, respond in Punjabi. If {language} is Bengali, respond in Bengali. If {language} is Telugu, respond in Telugu.
"""


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
        # Profile + History
        # ----------------------------------
        print("STEP 1: chat() started")
        profile = await self.profile.get_profile(user_id, user_defaults=current_user)

        print("STEP 2: profile loaded")
        history = await self.memory.get_recent_context(conversation_id)
        print("STEP 3: history loaded")

        # ----------------------------------
        # Question Classification
        # ----------------------------------
        router = QuestionRouter()
        question_type = router.classify(question)
        print("STEP 4: question type =", question_type)

        documents = []
        sources = []

        # ----------------------------------
        # Try RAG for government questions
        # ----------------------------------
        if question_type in [
            "government_scheme",
            "government_policy",
            "government_law",
            "government_act",
            "government_bill",
            "government_faq",
            "profile",
        ]:
            print("STEP 5: searching RAG")
            documents = await self.rag.search_documents(
                question, profile=profile, user_id=user_id
            )
            print("STEP 6: RAG returned", len(documents), "documents")
            if documents:
                sources = await self.rag.get_sources(documents)

        # ----------------------------------
        # Build prompt (with or without docs)
        # ----------------------------------
        prompt = _build_prompt(question, language, profile, history, documents)

        # ----------------------------------
        # Call AI + generate title in parallel
        # ----------------------------------
        print("STEP 7: calling AI")
        try:
            if is_new_conversation:
                answer = await asyncio.wait_for(
                    asyncio.to_thread(call_gemini, prompt),
                    timeout=60,
                )
                answer = (answer or "").strip()

                try:
                    smart_title = await asyncio.wait_for(
                        asyncio.to_thread(_generate_title, question),
                        timeout=10,
                    )
                except Exception:
                    smart_title = question[:40]

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
