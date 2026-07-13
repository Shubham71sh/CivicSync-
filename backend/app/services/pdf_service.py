import pypdf
import logging

logger = logging.getLogger("uvicorn.error")

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts plain text from a PDF file using the pypdf library.
    """
    try:
        logger.info(f"Starting text extraction for PDF file: {file_path}")
        reader = pypdf.PdfReader(file_path)
        text_content = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        
        full_text = "\n".join(text_content).strip()
        logger.info(f"Successfully extracted {len(full_text)} characters from {len(reader.pages)} pages.")
        return full_text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {file_path}: {e}")
        raise ValueError(f"Failed to process PDF document: {str(e)}")
