# Bill Summary Migration Guide

## Problem

Some Firestore bill documents have the `summary` field stored as a **list of strings** instead of a **single string**. This causes FastAPI ResponseValidationError when returning bills via the API.

### Error Message
```
fastapi.exceptions.ResponseValidationError
response -> bills -> summary
Input should be a valid string
```

### Root Cause
- Gemini AI returns summary as an array: `["point 1", "point 2", ...]`
- Some older code saved this list directly to Firestore without converting to string
- Pydantic response model expects: `summary: str`

---

## Solution Overview

The fix involves:

1. **Prevention** - AI service now converts list to string before returning
2. **Defensive Code** - All read operations convert list to string if needed
3. **Migration** - Clean up existing Firestore documents

---

## Files Modified

### 1. `app/services/ai_summary_service.py`
**Purpose:** Convert Gemini's list response to formatted string

**Changes:**
```python
# NEW: Type conversion logic
summary_raw = analysis.get("summary", "Summary of the legislative document.")
if isinstance(summary_raw, list):
    summary_str = "\n\n".join(summary_raw)
else:
    summary_str = summary_raw

return {
    "summary": summary_str,  # Always returns string
}
```

**Why:** Prevents new documents from being saved with list-type summaries

---

### 2. `app/api/controllers/bill_controller.py`
**Purpose:** Add defensive code when reading bills from Firestore

#### Change A: `get_bills_flow()` method
```python
for doc in docs:
    data = doc.to_dict()
    data["id"] = doc.id
    data["_id"] = doc.id
    
    # DEFENSIVE: Convert summary from list to string if needed
    summary = data.get("summary", "")
    if isinstance(summary, list):
        data["summary"] = "\n\n".join(summary)
    
    bills_list.append(data)
```

**Why:** GET /api/bills returns array of bills - ensures all summaries are strings

#### Change B: `get_bill_by_id_flow()` method
```python
bill_data = doc.to_dict()
bill_data["id"] = doc.id
bill_data["_id"] = doc.id

# DEFENSIVE: Convert summary from list to string if needed
summary = bill_data.get("summary", "")
if isinstance(summary, list):
    bill_data["summary"] = "\n\n".join(summary)

return {"bill": bill_data}
```

**Why:** GET /api/bills/{id} returns single bill - ensures summary is a string

---

### 3. `app/api/controllers/compare_controller.py`
**Purpose:** Normalize summaries before comparison

**Changes:**
```python
bills_list = await loop.run_in_executor(None, _fetch)

# DEFENSIVE: Normalize summary fields to strings
for bill in bills_list:
    summary = bill.get("summary", "")
    if isinstance(summary, list):
        bill["summary"] = "\n\n".join(summary)
```

**Why:** POST /api/bills/compare uses summaries - prevents errors in AI comparison

---

### 4. `app/services/compare_service.py`
**Purpose:** Handle summary safely when building comparison prompt

**Changes:**
```python
for idx, b in enumerate(bills):
    # DEFENSIVE: Convert summary from list to string if needed
    summary = b.get('summary', '')
    if isinstance(summary, list):
        summary = "\n\n".join(summary)
    
    bills_context.append(f"""
        Summary: {summary}
    """)
```

**Why:** Prevents string formatting errors when summary is a list

---

## Migration Script Usage

### Step 1: Run the Migration Script

```bash
cd backend
python migrate_bill_summaries.py
```

### Step 2: Review Output

The script will display:
- Total documents found
- How many were already correct
- How many were fixed (list → string)
- Any errors encountered

### Example Output:
```
======================================================================
BILL SUMMARY MIGRATION SCRIPT
======================================================================

✅ Firestore connection established
📥 Fetching all bill documents...
📊 Found 5 bill document(s)

🔧 Fixing document ID: bill_a1b2c3d4
   Title: Healthcare Reform Bill
   Bill Number: HR-2026-001
   Summary type: list (length: 8)
   ✅ Successfully converted to string (1247 chars)

✓ Document ID: bill_e5f6g7h8 - summary already a string (OK)

======================================================================
MIGRATION COMPLETE
======================================================================
Total documents:        5
Already correct:        3
Fixed (list → string):  2
Errors:                 0
======================================================================

✅ Successfully migrated 2 document(s)
```

---

## Verification Steps

### 1. Check API Endpoint
```bash
curl http://localhost:8000/api/bills
```

**Expected:** HTTP 200 with JSON response (no validation errors)

### 2. Check Individual Bill
```bash
curl http://localhost:8000/api/bills/{bill_id}
```

**Expected:** HTTP 200 with bill details where `summary` is a string

### 3. Check FastAPI Logs
Look for:
- ✅ No `ResponseValidationError` messages
- ✅ Successful GET requests returning 200

---

## Summary Field Format

### Before (Incorrect - List):
```json
{
  "summary": [
    "This bill establishes new healthcare standards...",
    "It requires hospitals to maintain minimum staffing levels...",
    "The bill allocates $5 billion for rural healthcare...",
    "Implementation timeline spans 18 months..."
  ]
}
```

### After (Correct - String):
```json
{
  "summary": "This bill establishes new healthcare standards...\n\nIt requires hospitals to maintain minimum staffing levels...\n\nThe bill allocates $5 billion for rural healthcare...\n\nImplementation timeline spans 18 months..."
}
```

The string format preserves all content with double-newline separators for readable formatting.

---

## Testing

### Manual Test 1: Upload New Bill
1. Upload a PDF via POST /api/bills/upload
2. Verify response has `summary` as string
3. Check Firestore document - `summary` field should be string

### Manual Test 2: Fetch Bills List
1. Call GET /api/bills
2. Verify HTTP 200 response
3. Check all bills have `summary` as string (not array)

### Manual Test 3: Fetch Single Bill
1. Call GET /api/bills/{id}
2. Verify HTTP 200 response
3. Check `summary` is formatted string with `\n\n` separators

### Manual Test 4: Compare Bills
1. Call POST /api/bills/compare with 2 bill IDs
2. Verify HTTP 200 response
3. Check comparison results are generated correctly

---

## Rollback (If Needed)

If you need to revert changes:

1. **Code Changes:** Use git to revert to previous commit
   ```bash
   git checkout HEAD~1 -- app/services/ai_summary_service.py
   git checkout HEAD~1 -- app/api/controllers/bill_controller.py
   git checkout HEAD~1 -- app/api/controllers/compare_controller.py
   git checkout HEAD~1 -- app/services/compare_service.py
   ```

2. **Database Changes:** Cannot easily revert (would need backup)
   - The string format is compatible with list format after splitting
   - Frontend can handle both formats
   - Recommended: Keep the string format

---

## FAQ

**Q: Will this break existing frontend code?**
A: No. Frontend receives a string, which is easier to display than an array.

**Q: Can I run the migration script multiple times?**
A: Yes, it's idempotent. Already-correct documents are skipped.

**Q: What if migration fails midway?**
A: Script processes documents one at a time. Already-fixed documents remain fixed. Re-run to complete.

**Q: Do I need to restart the backend server?**
A: Yes, restart FastAPI after running the migration to load the updated code.

**Q: What about bills uploaded during migration?**
A: The new AI service code ensures new bills always have string summaries.

---

## Support

If issues persist after migration:

1. Check FastAPI logs for detailed error messages
2. Verify Firestore connection is working
3. Confirm serviceAccountKey.json is present and valid
4. Check that all code changes were applied correctly
5. Test individual endpoints with curl or Postman

---

## Summary of Changes

✅ **Prevention**: AI service converts list → string before saving  
✅ **Defense**: All read operations handle both types gracefully  
✅ **Migration**: Script fixes existing Firestore documents  
✅ **Validation**: Pydantic schemas expect string (correct type)  
✅ **Compatibility**: No breaking changes to API contract  

The solution ensures that `summary` is always a string throughout the entire data pipeline.
