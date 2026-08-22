# 🔧 CivicSync Disaster Relief - Troubleshooting Guide

Quick solutions to common issues.

---

## 🚨 Critical Issues

### Backend Won't Start - NameError in reports.py

**Symptom:**
```
NameError: name '_build_email_html' is not defined
NameError: name '_email_row' is not defined
```

**Cause:** Old version of `backend/app/routers/reports.py` with missing function definitions.

**Solution:**
```bash
# Verify the file was updated correctly
cd e:\civic\backend
python -c "import app.routers.reports; print('✓ OK')"

# If error persists, check git status
git status

# If file wasn't updated, restore it
git checkout backend/app/routers/reports.py
```

**Verification:**
- Backend starts without errors
- File imports successfully

---

### ModuleNotFoundError: No module named 'sentence_transformers'

**Symptom:**
```
ModuleNotFoundError: No module named 'sentence_transformers'
ModuleNotFoundError: No module named 'faiss'
```

**Cause:** Missing ML dependencies for RAG system.

**Solution:**
```bash
cd e:\civic\backend
pip install sentence-transformers faiss-cpu numpy
```

**Or install all requirements:**
```bash
cd e:\civic\backend
pip install -r requirements.txt
```

**Verification:**
```bash
python -c "import sentence_transformers; print('✓ OK')"
python -c "import faiss; print('✓ OK')"
python -c "import numpy; print('✓ OK')"
```

---

### Frontend Shows "Backend health check failed, using mock connection"

**Symptom:**
- Browser console shows: `Backend health check failed, using mock connection`
- Network tab shows failed request to `/health`

**Cause:** Backend not running OR frontend still has old mock fallback code.

**Solution 1 - Start Backend:**
```bash
cd e:\civic\backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Solution 2 - Verify Frontend Code Updated:**
```bash
# Check if api.js was updated
cd e:\civic
git diff src/services/api.js
```

Look for this in `api.js`:
```javascript
// ✓ CORRECT (no try-catch)
export const checkBackend = async () => {
  const response = await API.get("/health");
  return response.data;
};

// ✗ WRONG (has mock fallback)
export const checkBackend = async () => {
  try {
    const response = await API.get("/health");
    return response.data;
  } catch (error) {
    return { status: "connected" }; // ← This is the bug
  }
};
```

**Solution 3 - Clear Cache:**
```bash
# Stop frontend (Ctrl+C)
# Clear browser cache (Ctrl+Shift+Delete)
# Restart frontend
cd e:\civic
npm run dev
```

**Verification:**
- Open http://localhost:5173
- Open DevTools Console (F12)
- NO "mock connection" message
- Network tab shows successful `/health` request

---

## ⚠️ Common Issues

### RAG Requests Timeout (First Request)

**Symptom:**
- First request to `/disaster-rag/schemes` takes 30+ seconds
- Browser shows timeout error
- Works fine on subsequent requests

**Cause:** MiniLM model loads on first request (~18 seconds).

**Solution:**
Wait for RAG warmup to complete. Backend logs should show:
```
INFO: [Warmup] Loading MiniLM all-MiniLM-L6-v2 model...
INFO: [Warmup] MiniLM model loaded in 18.34s
INFO: [Warmup] FAISS index loaded with 48 chunks in 0.42s
INFO: [Warmup] RAG warmup complete. Total: 18.76s
```

**Alternative:** Increase timeout in frontend:
```javascript
// src/services/api.js
const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 60000, // 60 seconds for first request
});
```

**Verification:**
- Wait 20 seconds after backend start
- First RAG request completes successfully
- Subsequent requests complete in <3 seconds

---

### Step 6 Shows All Schemes (Not Just Applied)

**Symptom:**
- User applied to 3 schemes in Step 5
- Step 6 shows 10+ schemes (all retrieved schemes, not just applied)

**Cause:** Frontend logic not filtering for applied schemes.

**Solution:**
Check `Step6Eligibility.jsx` - it should receive `appliedSchemes` as prop:

```javascript
// ✓ CORRECT
const Step6Eligibility = ({ appliedSchemes, onNext, onBack }) => {
  // Show only appliedSchemes
  return appliedSchemes.map(scheme => (
    <SchemeCard key={scheme.id} scheme={scheme} />
  ));
};

// ✗ WRONG
const Step6Eligibility = ({ allSchemes, onNext, onBack }) => {
  // Shows all schemes
  return allSchemes.map(scheme => (
    <SchemeCard key={scheme.id} scheme={scheme} />
  ));
};
```

**Verification:**
- Apply to exactly 3 schemes in Step 5
- Step 6 shows exactly 3 schemes
- Scheme names match those selected in Step 5

---

### CORS Error on Submit

**Symptom:**
```
Access to XMLHttpRequest at 'http://127.0.0.1:8000/reports/REP-xxx/submit' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Cause:** CORS not configured correctly in backend.

**Solution:**
Check `backend/app/main.py` CORS configuration:

```python
# ✓ CORRECT
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Restart backend** after changes.

**Verification:**
- Submit application
- Network tab shows successful POST request
- No CORS error in console

---

### Email Not Sending

**Symptom:**
- Application submits successfully
- `email_sent: false` in response
- Backend logs: "SMTP credentials not configured"

**Cause:** SMTP credentials missing or incorrect in `.env`.

**Solution 1 - This is Expected (Optional Email):**
Email delivery is optional. If you see:
```
[CivicSync Email] SMTP credentials not configured — email NOT sent.
```

This is normal. Email body is logged to console. Application submission still works.

**Solution 2 - Enable Email Delivery:**

Edit `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Gmail App Password
EMAIL_FROM=CivicSync <your-email@gmail.com>
```

**For Gmail App Password:**
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password (not your login password)

**Restart backend** after changes.

**Verification:**
- Submit application
- Backend logs: `[CivicSync Email] Successfully delivered to {email}`
- Response shows `email_sent: true`
- Email appears in inbox

---

### Google Maps BillingNotEnabledMapError

**Symptom:**
- Step 9 shows: "Google Maps API BillingNotEnabledMapError"
- Map doesn't load

**Cause:** Google Maps Places API billing not enabled.

**Solution 1 - Use Fallback (Recommended):**
This is expected and intentional. Step 9 has a graceful fallback:
- Shows 5 hardcoded emergency services
- "Get Directions" still works (opens Google Maps web)
- Workflow completes successfully

**No action needed** - this is the intended behavior.

**Solution 2 - Enable Google Maps Billing:**
Only if you want real-time nearby search:

1. Go to https://console.cloud.google.com/
2. Enable billing ($200 free credit monthly)
3. Enable "Places API" and "Maps JavaScript API"
4. Get API key with domain restrictions
5. Add to `.env`: `VITE_GOOGLE_MAPS_API_KEY=your-key`
6. Restart frontend

**Verification:**
- Step 9 map loads
- Nearby places appear dynamically
- Click markers to see place details

---

### Firebase Authentication Error

**Symptom:**
```
firebase_admin.exceptions.InvalidArgumentError: Invalid service account certificate
```

**Cause:** Missing or incorrect Firebase credentials in `.env`.

**Solution:**
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to: **Project Settings → Service Accounts**
4. Click: **Generate New Private Key**
5. Download JSON file
6. Copy values to `backend/.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_MULTILINE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Important:** Keep `\n` in the private key string.

**Restart backend** after changes.

**Verification:**
- Backend starts successfully
- Logs show: `Firebase + Firestore connected.`
- No authentication errors

---

### Gemini API Error - Invalid API Key

**Symptom:**
```
google.api_core.exceptions.PermissionDenied: 403 API key not valid
```

**Cause:** Missing or invalid Gemini API key.

**Solution:**
1. Go to: https://aistudio.google.com/apikey
2. Click: **Create API Key**
3. Copy the key
4. Add to `backend/.env`:

```env
GEMINI_API_KEY=AIzaSy...your-key-here
```

**Restart backend** after changes.

**Verification:**
- RAG requests complete successfully
- Step 5 returns scheme recommendations
- No 403 errors in backend logs

---

## 🛠️ Development Issues

### Frontend Hot Reload Not Working

**Symptom:**
- Changes to `.jsx` files don't update in browser
- Need to manually refresh every time

**Solution:**
```bash
# Stop frontend (Ctrl+C)
# Clear node_modules cache
cd e:\civic
rm -rf node_modules/.vite
npm run dev
```

**Alternative:**
```bash
# Clear browser cache
# Press Ctrl+Shift+Delete in browser
# Select "Cached images and files"
# Clear data
```

**Verification:**
- Make a small change to any `.jsx` file
- Browser updates automatically without manual refresh

---

### Backend Auto-Reload Not Working

**Symptom:**
- Changes to `.py` files don't restart server
- Need to manually restart every time

**Solution:**
```bash
# Make sure you're using --reload flag
cd e:\civic\backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**If still not working:**
```bash
# Install watchdog for better file watching
pip install watchdog
```

**Verification:**
- Make a small change to any `.py` file
- Console shows: `WARNING:  WatchFiles detected changes in 'file.py'. Reloading...`
- Server restarts automatically

---

### Port Already in Use

**Symptom:**
```
Error: Port 8000 is already in use
Error: Port 5173 is already in use
```

**Solution:**

**Option 1 - Kill Existing Process:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or for frontend
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Option 2 - Use Different Port:**
```bash
# Backend on port 8001
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

# Frontend on port 5174
npm run dev -- --port 5174
```

**Don't forget to update:**
- Frontend API base URL: `src/services/api.js`
- Backend CORS origins: `backend/app/main.py`

**Verification:**
- Server starts without "port in use" error
- Both frontend and backend accessible

---

## 📊 Performance Issues

### High Memory Usage

**Symptom:**
- Backend using >2GB RAM
- System becomes slow

**Cause:** MiniLM model loaded in memory (~500MB) + FAISS index (~50MB).

**Solution:**
This is normal. MiniLM needs memory for embeddings.

**To reduce memory:**
1. Close other applications
2. Restart backend server to clear leaked memory
3. Consider using smaller embedding model (future optimization)

**Not a bug** - just how transformer models work.

---

### Slow RAG Responses

**Symptom:**
- Every RAG request takes 10+ seconds
- Even subsequent requests are slow

**Cause:** 
- CPU bottleneck (no GPU acceleration)
- Large LLM prompts
- Network latency to Gemini API

**Solution:**

**Check CPU usage:**
```bash
# Windows Task Manager
# Look for python.exe using high CPU
```

**Reduce prompt size:**
- Decrease top_k results in vector search
- Limit context sent to Gemini
- Use shorter disaster descriptions

**Check network:**
- Ping Google AI API: https://generativelanguage.googleapis.com/
- Check internet connection speed
- Consider timeout settings

**Expected Performance:**
- First request: 20-30s (model load)
- Subsequent requests: 2-3s (normal)
- >10s every time: Investigate network/CPU

---

## 🔍 Debugging Tips

### Enable Debug Logging

**Backend:**
```python
# backend/app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```javascript
// src/services/api.js
API.interceptors.response.use(
  response => {
    console.log('[API]', response.config.url, response.data);
    return response;
  },
  error => {
    console.error('[API ERROR]', error.config?.url, error);
    throw error;
  }
);
```

### Check Logs Location

**Backend logs:**
- Terminal running `uvicorn` command
- Look for `[RAG]`, `[Warmup]`, `[CivicSync Email]` tags

**Frontend logs:**
- Browser DevTools Console (F12)
- Look for `[DisasterRAG]`, `[API]` tags

**Network logs:**
- Browser DevTools Network tab
- Filter by "Fetch/XHR"
- Check request/response payloads

### Test Endpoints Directly

**Using curl:**
```bash
# Health check
curl http://127.0.0.1:8000/health

# RAG schemes
curl -X POST http://127.0.0.1:8000/disaster-rag/schemes \
  -H "Content-Type: application/json" \
  -d '{"disaster_type":"flood","damage_percent":50,"severity":"Moderate"}'
```

**Using Postman:**
1. Import request: `POST http://127.0.0.1:8000/disaster-rag/schemes`
2. Set body: JSON `{"disaster_type":"flood","damage_percent":50,"severity":"Moderate"}`
3. Send request
4. Verify response has `rag_available: true`

---

## 📞 Getting Help

If issues persist after trying these solutions:

### Information to Provide

1. **Error message** (exact text)
2. **When it occurs** (which step, what action)
3. **Environment:**
   - OS: Windows/Mac/Linux
   - Python version: `python --version`
   - Node version: `node --version`
4. **Logs:**
   - Backend console output
   - Browser console errors
   - Network tab requests/responses
5. **What you tried** (from this guide)

### Self-Diagnosis Checklist

Run these commands and share output:

```bash
# Verify setup
cd e:\civic\backend
python verify_setup.py

# Test imports
python -c "import app.main; print('OK')"

# Check dependencies
pip list | grep -E "(sentence|faiss|numpy|fastapi|firebase)"

# Test health endpoint
curl http://127.0.0.1:8000/health
```

---

## ✅ Issue Resolved?

After fixing your issue:

- [ ] Mark the issue as resolved
- [ ] Document the solution if not in this guide
- [ ] Update VERIFICATION_CHECKLIST.md
- [ ] Continue with testing

---

**Most issues are environment/configuration related. Double-check `.env` and dependencies first! 🔧**
