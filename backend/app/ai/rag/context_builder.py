"""
Context Builder for RAG generation.

Takes the user question, retrieved chunks, user profile details, and conversation history,
and formats it into a highly structured, grounded prompt for the LLM.
"""

from typing import Any, Dict, List, Optional
from app.ai.retrieval.retrieval_service import RetrievalChunk


class ContextBuilder:
    """
    Builds a grounded prompt for the local LLM using retrieved evidence.
    Strategically isolates evidence to prevent hallucination.
    """

    @staticmethod
    def build(
        question: str,
        chunks: List[RetrievalChunk],
        profile: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict[str, Any]]] = None,
        doc_type: Optional[str] = None,
        language: str = "English",
    ) -> str:
        """
        Builds the context prompt.
        """
        sections = []

        # 1. RETRIEVED EVIDENCE
        evidence_lines = []
        if chunks:
            for idx, chunk in enumerate(chunks, 1):
                page_info = f" | Page: {chunk.page}" if chunk.page else ""
                section_info = f" | Section: {chunk.section}" if chunk.section else ""
                evidence_lines.append(
                    f"EVIDENCE #{idx}\n"
                    f"Document: {chunk.title} (ID: {chunk.document_id}{page_info}{section_info})\n"
                    f"Content:\n{chunk.text.strip()}\n"
                    f"---"
                )
            evidence_text = "\n".join(evidence_lines)
        else:
            evidence_text = "No direct document evidence is available."

        sections.append(f"[RETRIEVED EVIDENCE]\n{evidence_text}")

        # 2. CITIZEN PROFILE (if available)
        if profile:
            profile_lines = []
            for field in [
                "location", "profession", "income", "employmentStatus", "category",
                "disabilityStatus", "veteranStatus", "studentStatus"
            ]:
                val = profile.get(field)
                if val:
                    profile_lines.append(f"- {field}: {val}")
            
            if profile_lines:
                sections.append(f"[CITIZEN PROFILE]\n" + "\n".join(profile_lines))

        # 3. CONVERSATION HISTORY
        if history:
            history_lines = []
            for turn in history[-5:]: # Keep last 5 turns max
                role = turn.get("role", "user").upper()
                text = turn.get("text", "")
                history_lines.append(f"{role}: {text}")
            sections.append(f"[CONVERSATION HISTORY]\n" + "\n".join(history_lines))

        # 4. USER QUESTION
        sections.append(f"[USER QUESTION]\n{question}")

        # 5. STRICT INSTRUCTIONS
        instructions = f"""[STRICT INSTRUCTIONS]
You are CivicSync AI, a highly precise civic intelligence assistant.
Your goal is to answer the USER QUESTION based strictly on the RETRIEVED EVIDENCE provided above.

Compliance Rules:
1. Base your response primarily on the RETRIEVED EVIDENCE.
2. If the evidence contains the answer, explain it clearly and cite the source document, section, and page using inline citations (e.g., "[Document Name, Section 4, Page 7]").
3. Do NOT make up, invent, or extrapolate facts, dates, amounts, or sections.
4. If the RETRIEVED EVIDENCE is insufficient to answer the question, state exactly: "I could not find enough reliable evidence in the uploaded documents to answer this question." Do not attempt to answer using general knowledge in this case.
5. Answer in a neutral, citizen-friendly, and informative tone.
6. Translate/answer entirely in the requested language: {language}. If {language} is Hindi (hi/hi-IN), respond in clear Hindi (Devanagari script). If {language} is Punjabi (pa), respond in Punjabi. If {language} is Bengali (bn), respond in Bengali. If {language} is Telugu (te), respond in Telugu.
7. Be concise yet comprehensive.
"""
        sections.append(instructions)

        return "\n\n".join(sections)
