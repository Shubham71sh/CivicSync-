#!/usr/bin/env python3
"""
CivicSync Disaster Relief - Setup Verification Script

This script verifies that all dependencies are installed correctly
and the backend can start without errors.

Usage:
    python verify_setup.py
"""

import sys
import os

print("=" * 80)
print("CivicSync Disaster Relief - Setup Verification")
print("=" * 80)
print()

errors = []
warnings = []
success = []

# ── Check Python Version ──────────────────────────────────────────────────────
print("[1/10] Checking Python version...")
py_version = sys.version_info
if py_version.major == 3 and py_version.minor >= 8:
    success.append(f"✓ Python {py_version.major}.{py_version.minor}.{py_version.micro}")
else:
    errors.append(f"✗ Python version {py_version.major}.{py_version.minor} is too old. Requires Python 3.8+")

# ── Check FastAPI ─────────────────────────────────────────────────────────────
print("[2/10] Checking FastAPI...")
try:
    import fastapi
    success.append(f"✓ FastAPI {fastapi.__version__}")
except ImportError:
    errors.append("✗ FastAPI not installed. Run: pip install fastapi")

# ── Check Uvicorn ─────────────────────────────────────────────────────────────
print("[3/10] Checking Uvicorn...")
try:
    import uvicorn
    success.append(f"✓ Uvicorn {uvicorn.__version__}")
except ImportError:
    errors.append("✗ Uvicorn not installed. Run: pip install uvicorn")

# ── Check Firebase Admin ──────────────────────────────────────────────────────
print("[4/10] Checking Firebase Admin SDK...")
try:
    import firebase_admin
    success.append(f"✓ Firebase Admin SDK {firebase_admin.__version__}")
except ImportError:
    errors.append("✗ Firebase Admin SDK not installed. Run: pip install firebase-admin")

# ── Check Sentence Transformers ───────────────────────────────────────────────
print("[5/10] Checking Sentence Transformers (MiniLM)...")
try:
    import sentence_transformers
    success.append(f"✓ Sentence Transformers {sentence_transformers.__version__}")
except ImportError:
    errors.append("✗ Sentence Transformers not installed. Run: pip install sentence-transformers")

# ── Check FAISS ───────────────────────────────────────────────────────────────
print("[6/10] Checking FAISS...")
try:
    import faiss
    success.append(f"✓ FAISS (vector search library)")
except ImportError:
    warnings.append("⚠ FAISS not installed. Will use NumPy fallback. For better performance: pip install faiss-cpu")

# ── Check NumPy ───────────────────────────────────────────────────────────────
print("[7/10] Checking NumPy...")
try:
    import numpy as np
    success.append(f"✓ NumPy {np.__version__}")
except ImportError:
    errors.append("✗ NumPy not installed. Run: pip install numpy")

# ── Check Google Generative AI (Gemini) ───────────────────────────────────────
print("[8/10] Checking Google Generative AI (Gemini)...")
try:
    import google.genai
    success.append("✓ Google Generative AI (Gemini)")
except ImportError:
    try:
        import google.generativeai
        success.append("✓ Google Generative AI (Gemini - legacy)")
    except ImportError:
        errors.append("✗ Google Generative AI not installed. Run: pip install google-genai")

# ── Check Environment Variables ───────────────────────────────────────────────
print("[9/10] Checking environment variables...")
env_file = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_file):
    success.append("✓ .env file exists")
    
    # Check for critical variables
    with open(env_file, 'r') as f:
        env_content = f.read()
        
    if "FIREBASE_PROJECT_ID" in env_content and "your-project-id" not in env_content:
        success.append("✓ FIREBASE_PROJECT_ID configured")
    else:
        warnings.append("⚠ FIREBASE_PROJECT_ID not configured in .env")
        
    if "GEMINI_API_KEY" in env_content and "your-gemini-api-key" not in env_content:
        success.append("✓ GEMINI_API_KEY configured")
    else:
        warnings.append("⚠ GEMINI_API_KEY not configured in .env")
        
    if "SMTP_HOST" in env_content and len(env_content.split("SMTP_HOST=")[1].split("\n")[0].strip()) > 0:
        success.append("✓ SMTP configured (email delivery enabled)")
    else:
        warnings.append("⚠ SMTP not configured (email delivery disabled - app will log emails to console)")
else:
    errors.append("✗ .env file not found. Copy .env.example to .env and configure it.")

# ── Check Module Imports ──────────────────────────────────────────────────────
print("[10/10] Checking CivicSync module imports...")
try:
    sys.path.insert(0, os.path.dirname(__file__))
    from app.routers import reports
    success.append("✓ app.routers.reports imports successfully")
except Exception as e:
    errors.append(f"✗ Failed to import app.routers.reports: {str(e)}")

try:
    from app.routers import disaster_rag
    success.append("✓ app.routers.disaster_rag imports successfully")
except Exception as e:
    errors.append(f"✗ Failed to import app.routers.disaster_rag: {str(e)}")

try:
    from rag.embeddings import get_embedding_model
    success.append("✓ rag.embeddings imports successfully")
except Exception as e:
    errors.append(f"✗ Failed to import rag.embeddings: {str(e)}")

try:
    from rag.vector_store import get_vector_store
    success.append("✓ rag.vector_store imports successfully")
except Exception as e:
    errors.append(f"✗ Failed to import rag.vector_store: {str(e)}")

# ── Print Results ─────────────────────────────────────────────────────────────
print()
print("=" * 80)
print("VERIFICATION RESULTS")
print("=" * 80)
print()

if success:
    print("✅ SUCCESS:")
    for msg in success:
        print(f"  {msg}")
    print()

if warnings:
    print("⚠️  WARNINGS:")
    for msg in warnings:
        print(f"  {msg}")
    print()

if errors:
    print("❌ ERRORS:")
    for msg in errors:
        print(f"  {msg}")
    print()
    print("=" * 80)
    print("FAILED: Please fix the errors above before starting the backend.")
    print("=" * 80)
    sys.exit(1)
else:
    print("=" * 80)
    print("✅ VERIFICATION PASSED!")
    print()
    print("Your backend is ready to start. Run:")
    print("  uvicorn app.main:app --reload --host 127.0.0.1 --port 8000")
    print()
    print("Expected startup time:")
    print("  - Server starts: ~2 seconds")
    print("  - RAG warmup (background): ~20 seconds")
    print("  - First RAG request: Ready immediately (warmup continues)")
    print("=" * 80)
    sys.exit(0)
