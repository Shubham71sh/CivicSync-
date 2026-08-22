# 🚀 CivicSync Disaster Relief - Quick Start Guide

## Prerequisites

- **Python 3.8+** (check: `python --version`)
- **Node.js 16+** (check: `node --version`)
- **Firebase Project** with Firestore enabled
- **Gemini API Key** from Google AI Studio

---

## 📦 Installation (5 minutes)

### Step 1: Install Backend Dependencies

```bash
cd e:\civic\backend
pip install -r requirements.txt
```

**Note:** First installation of `sentence-transformers` downloads the MiniLM model (~80MB) and may take 2-5 minutes.

### Step 2: Configure Environment

```bash
# Copy example to .env
cd e:\civic\backend
copy .env.example .env

# Edit .env with your credentials
notepad .env
```

**Minimum required configuration:**

```env
# Firebase (get from Firebase Console → Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Gemini AI (get from https://aistudio.google.com/apikey)
GEMINI_API_KEY=AIza...your-key-here

# SMTP (optional - for email delivery)
# If not configured, emails will be logged to console
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Step 3: Verify Setup

```bash
cd e:\civic\backend
python verify_setup.py
```

**Expected output:**
```
✅ VERIFICATION PASSED!
Your backend is ready to start.
```

### Step 4: Install Frontend Dependencies

```bash
cd e:\civic
npm install
```

---

## ▶️ Starting the Application

### Terminal 1 - Backend (FastAPI)

```bash
cd e:\civic\backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Expected logs:**
```
INFO: Starting CivicSync backend...
INFO: Firebase + Firestore connected.
INFO: Seeded X government schemes.
INFO: [DisasterRAG] Seeded 48 knowledge chunks.
INFO: [Lifespan] RAG warmup launched in background thread. Server is ready.
INFO: Uvicorn running on http://127.0.0.1:8000

[Background - within 20 seconds:]
INFO: [Warmup] Loading MiniLM all-MiniLM-L6-v2 model...
INFO: [Warmup] MiniLM model loaded in 18.34s
INFO: [Warmup] FAISS index loaded with 48 chunks in 0.42s
INFO: [Warmup] RAG warmup complete. Total: 18.76s
```

### Terminal 2 - Frontend (React)

```bash
cd e:\civic
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in xxx ms
➜ Local:   http://localhost:5173/
```

### Open Browser

Navigate to: **http://localhost:5173**

---

## ✅ Testing the Disaster Relief Module

### Test Flow (Steps 1-9)

1. **Navigate to Disaster Relief** from the main menu
2. **Step 1:** Select disaster type (e.g., "Flood")
3. **Step 2:** Upload damage evidence images (optional - can skip)
4. **Step 3:** AI analyzes damage (shows severity and estimated loss)
5. **Step 5:** See government schemes (RAG-powered, verified data)
   - Apply to multiple schemes (no limit)
6. **Step 6:** View eligibility for ONLY applied schemes
7. **Step 7:** See required documents for ONLY applied schemes
8. **Step 8:** Review application timeline
9. **Step 9:** View nearby emergency services (Google Maps or fallback)
10. **Submit Application** - sends email confirmation

### What to Check

**Backend Console (Terminal 1):**
- ✅ No import errors
- ✅ RAG warmup completes successfully
- ✅ No CORS errors when frontend calls API
- ✅ RAG endpoints return verified government data

**Frontend Console (Browser DevTools):**
- ✅ NO "Backend health check failed, using mock connection"
- ✅ NO "using mock scheme data"
- ✅ RAG requests complete successfully
- ✅ Step 6 shows ONLY schemes from Step 5
- ✅ Submit Application calls real backend endpoint

**Network Tab (Browser DevTools):**
- ✅ `GET /health` returns `{"status": "healthy"}`
- ✅ `POST /disaster-rag/schemes` returns verified schemes
- ✅ `POST /reports/{id}/submit` returns `{"success": true}`
- ✅ No CORS errors

---

## 🐛 Troubleshooting

### Backend won't start

**Check Python version:**
```bash
python --version
# Should be 3.8 or higher
```

**Run verification script:**
```bash
cd e:\civic\backend
python verify_setup.py
```

**Check for import errors:**
```bash
cd e:\civic\backend
python -c "import app.main; print('OK')"
```

### Frontend shows "Backend health check failed"

**1. Check if backend is running:**
- Open http://127.0.0.1:8000/health in browser
- Should see: `{"status": "healthy", "server": "running"}`

**2. Check CORS configuration:**
- Backend terminal should NOT show CORS errors
- If you see CORS errors, verify `app/main.py` has:
  ```python
  allow_origins=[
      "http://localhost:5173",
      "http://127.0.0.1:5173",
  ]
  ```

**3. Check frontend is calling correct URL:**
- Open browser DevTools → Network tab
- Should see requests to `http://127.0.0.1:8000`

### RAG requests timeout

**First request after server start:**
- First RAG request triggers MiniLM load (~20 seconds)
- This is normal - subsequent requests are fast (<3 seconds)

**Always timing out:**
- Check backend terminal for errors
- Verify `sentence-transformers` is installed: `pip list | grep sentence`
- Try restarting backend server

### Email not sending

**Expected behavior:**
- If SMTP not configured: Email logged to console, submission still works
- If SMTP configured incorrectly: Error logged, submission still works
- Email is OPTIONAL - application submission always works

**To enable email:**
1. Add SMTP credentials to `backend/.env`
2. For Gmail: Use App Password (not login password)
3. Restart backend server
4. Check backend logs for `[CivicSync Email] Successfully delivered`

### Step 9 Google Maps error

**BillingNotEnabledMapError:**
- This is normal if Google Maps billing not enabled
- Step 9 shows fallback emergency services (5 hardcoded)
- "Get Directions" still works (opens Google Maps web URL)
- Workflow can complete successfully

**To enable real Google Maps:**
1. Go to https://console.cloud.google.com/
2. Enable "Places API" and billing
3. Get API key
4. Add to `.env`: `VITE_GOOGLE_MAPS_API_KEY=your-key`
5. Restart frontend: `npm run dev`

---

## 📚 Documentation

- **Full Fix Summary:** `DISASTER_RELIEF_FIX_SUMMARY.md`
- **Environment Setup:** `backend/.env.example`
- **API Endpoints:** See `DISASTER_RELIEF_FIX_SUMMARY.md` Section 8
- **Architecture:** See `DISASTER_RELIEF_FIX_SUMMARY.md` Section 4

---

## 🔗 Important URLs

### Development
- **Frontend:** http://localhost:5173
- **Backend:** http://127.0.0.1:8000
- **API Health:** http://127.0.0.1:8000/health
- **API Docs:** http://127.0.0.1:8000/docs (FastAPI Swagger)

### External Services
- **Firebase Console:** https://console.firebase.google.com/
- **Google AI Studio (Gemini):** https://aistudio.google.com/apikey
- **Google Cloud Console (Maps):** https://console.cloud.google.com/

---

## 🎯 Success Criteria

Your setup is complete when:

✅ Backend starts without errors  
✅ Frontend loads at http://localhost:5173  
✅ Health check returns `{"status": "healthy"}`  
✅ RAG warmup completes (check backend logs)  
✅ Step 5 shows government schemes (not mock data)  
✅ Step 6 shows ONLY schemes applied in Step 5  
✅ Submit Application works without CORS errors  
✅ Email sent (or logged if SMTP not configured)  

---

## 💡 Next Steps

1. **Test complete workflow** (Step 1 through Submit)
2. **Configure SMTP** for real email delivery
3. **Enable Google Maps billing** (optional - fallback works)
4. **Review logs** to verify RAG is using real data
5. **Deploy to production** (update CORS origins)

---

## 📞 Support

If you encounter issues:

1. Check `DISASTER_RELIEF_FIX_SUMMARY.md` for detailed explanations
2. Run `python verify_setup.py` to diagnose dependencies
3. Check backend logs for errors
4. Check browser console for frontend errors
5. Verify `.env` configuration

---

**Happy Coding! 🚀**

The CivicSync Disaster Relief module is now fully functional with:
- ✅ MiniLM embeddings
- ✅ FAISS vector search
- ✅ Verified government scheme data
- ✅ Email confirmation system
- ✅ Complete RAG pipeline
