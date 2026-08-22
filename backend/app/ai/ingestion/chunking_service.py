"""
Section-Aware Document Chunking Service.

Chunking strategy:
1. Detect section headings (Section X, Chapter Y, Article Z, Clause N patterns)
2. Split text at section boundaries first (section-aware chunking)
3. If a section is too large, sub-split at paragraph boundaries
4. If still too large, split at sentence boundaries
5. Apply overlap between consecutive chunks

Each chunk carries:
- page number (if available from pypdf extraction)
- section heading (detected or inferred)
- chunk index within document
- position markers for citation (start_char, end_char)

This approach preserves document structure and avoids breaking mid-clause.
"""

import re
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from app.config.settings import settings


# ── Section heading patterns ──────────────────────────────────────────────────
# Matches: "Section 14", "Section 14(2)", "Chapter III", "Article 7", 
#          "Clause 4.1", "PART A", "Schedule II", "Subsection (a)"
_HEADING_PATTERNS = [
    r"^(?:SECTION|Section)\s+\d+[\.\(\w]*",
    r"^(?:CHAPTER|Chapter)\s+(?:\d+|[IVXLCDM]+)",
    r"^(?:ARTICLE|Article)\s+\d+",
    r"^(?:CLAUSE|Clause)\s+\d+[\.\d]*",
    r"^(?:PART|Part)\s+(?:\d+|[A-Z]+)",
    r"^(?:SCHEDULE|Schedule)\s+(?:\d+|[IVXLCDM]+)",
    r"^(?:SUBSECTION|Subsection)\s+\(?[a-zA-Z0-9]+\)?",
    r"^\d+\.\s+[A-Z][A-Za-z\s]{5,}",  # "1. Definition of Terms"
    r"^[A-Z][A-Z\s]{5,}:?\s*$",         # All-caps headings like "ELIGIBILITY CRITERIA"
]

_HEADING_RE = re.compile(
    "|".join(f"({p})" for p in _HEADING_PATTERNS),
    re.MULTILINE,
)


@dataclass
class TextChunk:
    """A single text chunk ready for embedding and indexing."""
    chunk_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    text: str = ""
    page: int = 0
    section: str = ""
    chunk_index: int = 0
    start_char: int = 0
    end_char: int = 0


# ── Chunking helpers ──────────────────────────────────────────────────────────

def _is_heading(line: str) -> bool:
    """Return True if the line looks like a section/chapter heading."""
    return bool(_HEADING_RE.match(line.strip()))


def _detect_section(line: str) -> Optional[str]:
    """Return the section heading text if detected, else None."""
    stripped = line.strip()
    if _is_heading(stripped):
        return stripped[:120]  # cap length
    return None


def _split_at_paragraph_boundaries(text: str, chunk_size: int, overlap: int) -> List[str]:
    """
    Split text into chunks at paragraph boundaries.
    Falls back to sentence-boundary splitting if paragraphs are too large.
    """
    paragraphs = re.split(r"\n{2,}", text)
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current) + len(para) + 2 <= chunk_size:
            current = (current + "\n\n" + para).strip() if current else para
        else:
            if current:
                chunks.append(current)
                # Overlap: keep the last `overlap` chars of current as prefix
                overlap_text = current[-overlap:] if len(current) > overlap else current
                current = (overlap_text + "\n\n" + para).strip()
            else:
                # Single paragraph larger than chunk_size — split at sentences
                sent_chunks = _split_at_sentences(para, chunk_size, overlap)
                chunks.extend(sent_chunks[:-1])
                current = sent_chunks[-1] if sent_chunks else para[:chunk_size]

    if current:
        chunks.append(current)

    return [c for c in chunks if c.strip()]


def _split_at_sentences(text: str, chunk_size: int, overlap: int) -> List[str]:
    """Last-resort: split at sentence boundaries."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: List[str] = []
    current = ""

    for sent in sentences:
        if len(current) + len(sent) + 1 <= chunk_size:
            current = (current + " " + sent).strip() if current else sent
        else:
            if current:
                chunks.append(current)
                overlap_text = current[-overlap:] if len(current) > overlap else current
                current = (overlap_text + " " + sent).strip()
            else:
                # Sentence itself exceeds chunk_size — hard split
                chunks.append(sent[:chunk_size])
                current = sent[chunk_size - overlap:] if len(sent) > chunk_size else ""

    if current:
        chunks.append(current)

    return [c for c in chunks if c.strip()]


# ── Section-aware chunking ────────────────────────────────────────────────────

def chunk_text(
    text: str,
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None,
) -> List[TextChunk]:
    """
    Section-aware chunking for bills, laws, and policy documents.

    Algorithm:
    1. Split text into lines.
    2. Detect section headings.
    3. Group lines into sections.
    4. Sub-split each section at paragraph/sentence boundaries if needed.
    5. Assign metadata (page, section, chunk_index).

    Args:
        text:       Full extracted text of the document.
        chunk_size: Max characters per chunk (default: settings.CHUNK_SIZE).
        overlap:    Overlap characters between consecutive chunks (default: settings.CHUNK_OVERLAP).

    Returns:
        List of TextChunk objects.
    """
    chunk_size = chunk_size or settings.CHUNK_SIZE
    overlap = overlap or settings.CHUNK_OVERLAP

    if not text or not text.strip():
        return []

    lines = text.splitlines()
    sections: List[Tuple[str, str]] = []  # (section_heading, section_text)

    current_section = "Introduction"
    current_lines: List[str] = []

    for line in lines:
        heading = _detect_section(line)
        if heading and current_lines:
            # Save current section
            sections.append((current_section, "\n".join(current_lines)))
            current_section = heading
            current_lines = []
        elif heading:
            current_section = heading
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_section, "\n".join(current_lines)))

    # Fallback: if no sections detected, treat entire text as one section
    if not sections:
        sections = [("Document", text)]

    # Now chunk each section
    all_chunks: List[TextChunk] = []
    chunk_index = 0
    char_offset = 0

    for section_heading, section_text in sections:
        section_text = section_text.strip()
        if not section_text:
            continue

        if len(section_text) <= chunk_size:
            # Section fits in one chunk
            all_chunks.append(TextChunk(
                text=section_text,
                section=section_heading,
                chunk_index=chunk_index,
                start_char=char_offset,
                end_char=char_offset + len(section_text),
            ))
            chunk_index += 1
            char_offset += len(section_text) + 1
        else:
            # Section is too large — sub-split
            sub_texts = _split_at_paragraph_boundaries(section_text, chunk_size, overlap)
            for sub_text in sub_texts:
                all_chunks.append(TextChunk(
                    text=sub_text,
                    section=section_heading,
                    chunk_index=chunk_index,
                    start_char=char_offset,
                    end_char=char_offset + len(sub_text),
                ))
                chunk_index += 1
                char_offset += len(sub_text)

    return [c for c in all_chunks if len(c.text.strip()) >= 50]  # filter tiny chunks


def chunk_text_with_pages(
    pages: List[Tuple[int, str]],  # [(page_num, page_text), ...]
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None,
) -> List[TextChunk]:
    """
    Chunk text extracted page-by-page, preserving page numbers.

    Args:
        pages: List of (page_number, page_text) tuples.
        chunk_size: Max characters per chunk.
        overlap: Overlap characters between consecutive chunks.

    Returns:
        List of TextChunk objects with correct page numbers.
    """
    chunk_size = chunk_size or settings.CHUNK_SIZE
    overlap = overlap or settings.CHUNK_OVERLAP

    all_chunks: List[TextChunk] = []
    chunk_index = 0

    for page_num, page_text in pages:
        if not page_text or not page_text.strip():
            continue

        page_chunks = chunk_text(page_text, chunk_size=chunk_size, overlap=overlap)
        for pc in page_chunks:
            pc.page = page_num
            pc.chunk_index = chunk_index
            all_chunks.append(pc)
            chunk_index += 1

    return all_chunks
