# Quick Start Guide - Module 3 Integration

## Prerequisites
- Node.js (v16+)
- Python 3.8+
- MongoDB running locally or remotely
- Gemini API Key

---

## Step 1: Configure Environment Variables

### Frontend (.env)
Create `.env` in the project root:
```env
VITE_API_URL=http://localhost:8000/api
```

### Backend (.env)
Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/civicsync
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_secret_key_here
UPLOAD_DIR=uploads
```

---

## Step 2: Install Dependencies

### Frontend
```bash
npm install
```

### Backend
```bash
cd backend
pip install -r requirements.txt
```

---

## Step 3: Start the Servers

### Terminal 1 - Backend
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Terminal 2 - Frontend
```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## Step 4: Test the Integration

### 1. Upload a Bill
1. Navigate to http://localhost:5173
2. Login (or signup if needed)
3. Go to **Dashboard** → **Upload Bill**
4. Drag and drop a PDF file or click to browse
5. Click **Start AI Analysis**
6. Wait for processing (5-10 seconds)
7. Verify you see:
   - ✅ Bill title
   - ✅ AI-generated summary
   - ✅ Impact score
   - ✅ Processing status
8. You'll be redirected to Bill History

### 2. View Bill History
1. Go to **Dashboard** → **Bill History**
2. Verify bills display with:
   - ✅ Title and bill number
   - ✅ Upload date
   - ✅ Status badge
   - ✅ Summary
   - ✅ Impact score
3. Try the search box (type a bill name)
4. Try the status filter dropdown

### 3. View Bill Details
1. From Bill History, click the **eye icon** on any bill
2. Verify the details page shows:
   - ✅ Complete summary
   - ✅ Key points
   - ✅ Citizen impact
   - ✅ Tags
   - ✅ Metadata
3. Click **Back to History** to return

### 4. Compare Bills
1. Go to **Dashboard** → **Compare Bills**
2. Select two different bills from dropdowns
3. Click **Run AI Comparison**
4. Wait for AI analysis (3-5 seconds)
5. Verify you see:
   - ✅ Both bill summaries side-by-side
   - ✅ List of similarities
   - ✅ List of differences

### 5. Delete a Bill
1. Go to Bill History
2. Hover over a bill card
3. Click the **trash icon**
4. Confirm deletion
5. Verify bill is removed from the list

---

## Step 5: Verify Backend API (Optional)

Visit http://localhost:8000/docs to see the interactive API documentation.

Test endpoints directly:
- `POST /api/bills/upload` - Upload a bill
- `GET /api/bills` - Get all bills
- `GET /api/bills/{id}` - Get specific bill
- `POST /api/bills/compare` - Compare bills
- `DELETE /api/bills/{id}` - Delete a bill

---

## Troubleshooting

### Issue: "Failed to upload bill"
**Solution**: 
- Check backend is running on port 8000
- Verify Gemini API key is set in backend/.env
- Check backend terminal for error messages

### Issue: "Failed to load bills"
**Solution**:
- Verify MongoDB is running
- Check MONGODB_URI in backend/.env
- Ensure you're logged in (check JWT token)

### Issue: Bills not appearing
**Solution**:
- Clear browser cache
- Check browser console for errors
- Verify backend returned data (Network tab)

### Issue: CORS errors
**Solution**:
- Backend CORS is already configured for `*`
- If still having issues, update backend `main.py` CORS settings

### Issue: 401 Unauthorized
**Solution**:
- You've been logged out
- Login again at /login
- JWT token is automatically managed

---

## API Response Examples

### Upload Success
```json
{
  "bill": {
    "_id": "bill_abc123",
    "title": "Clean Energy Act 2024",
    "billNumber": "CEA-2024",
    "summary": "This bill promotes renewable energy...",
    "impactScore": 78,
    "status": "pending",
    "keyPoints": ["Point 1", "Point 2"],
    "uploadedAt": "2024-03-15T10:00:00Z"
  },
  "analysisId": "bill_abc123"
}
```

### Get Bills Success
```json
{
  "bills": [
    {
      "_id": "bill_001",
      "title": "Infrastructure Development Act",
      "summary": "...",
      "impactScore": 84
    }
  ],
  "total": 10,
  "page": 1,
  "pages": 1
}
```

---

## File Locations

### Frontend
- Bill Service: `src/services/billService.js`
- Upload Page: `src/pages/app/UploadBill.jsx`
- History Page: `src/pages/app/BillHistory.jsx`
- Details Page: `src/pages/app/BillDetails.jsx`
- Compare Page: `src/pages/app/CompareBills.jsx`

### Backend
- Main App: `backend/app/main.py`
- Bill Routes: `backend/app/api/routes/bills.py`
- Bill Controller: `backend/app/api/controllers/bill_controller.py`
- Compare Routes: `backend/app/api/routes/compare.py`
- Compare Controller: `backend/app/api/controllers/compare_controller.py`

---

## Success!

If all tests pass, Module 3 is fully integrated and ready to use! 🎉

The frontend now displays real data from:
- ✅ MongoDB (bill storage)
- ✅ Gemini AI (analysis and comparison)
- ✅ FastAPI (backend processing)

---

## Next Steps

1. Upload more sample bills to test pagination
2. Test search and filtering
3. Compare different types of bills
4. Customize the UI styling if needed
5. Deploy to production

---

**Need Help?** Check the detailed integration document: `MODULE3_INTEGRATION_COMPLETE.md`
