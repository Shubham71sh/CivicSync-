"""
Migration Script: Convert List Summaries to String Format
==========================================================

This script fixes existing Firestore bill documents where the "summary" field
is stored as a list of strings instead of a single formatted string.

Usage:
    python migrate_bill_summaries.py

What it does:
1. Fetches all documents from the "bills" collection
2. Identifies documents where "summary" is a list
3. Converts the list to a formatted string using "\n\n".join()
4. Updates the Firestore document with the corrected summary
5. Reports statistics on documents processed and fixed

Requirements:
- Firebase Admin SDK must be initialized
- serviceAccountKey.json must be present in backend/ directory
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config.database import get_col
from app.core.firebase import get_db

def migrate_bill_summaries():
    """
    Main migration function to convert list summaries to string format.
    """
    print("=" * 70)
    print("BILL SUMMARY MIGRATION SCRIPT")
    print("=" * 70)
    print()
    
    # Initialize Firebase/Firestore
    try:
        db = get_db()
        print("✅ Firestore connection established")
    except Exception as e:
        print(f"❌ Failed to connect to Firestore: {e}")
        return
    
    # Fetch all bills
    print("📥 Fetching all bill documents...")
    bills_ref = get_col("bills")
    docs = list(bills_ref.stream())
    total_docs = len(docs)
    print(f"📊 Found {total_docs} bill document(s)\n")
    
    if total_docs == 0:
        print("ℹ️  No bills found in database. Migration complete.")
        return
    
    # Process each document
    fixed_count = 0
    already_correct_count = 0
    error_count = 0
    
    for doc in docs:
        doc_id = doc.id
        data = doc.to_dict()
        summary = data.get("summary")
        
        # Check if summary is a list
        if isinstance(summary, list):
            print(f"🔧 Fixing document ID: {doc_id}")
            print(f"   Title: {data.get('title', 'N/A')}")
            print(f"   Bill Number: {data.get('billNumber', 'N/A')}")
            print(f"   Summary type: {type(summary).__name__} (length: {len(summary)})")
            
            # Convert list to string
            summary_str = "\n\n".join(summary)
            
            try:
                # Update Firestore document
                bills_ref.document(doc_id).update({"summary": summary_str})
                fixed_count += 1
                print(f"   ✅ Successfully converted to string ({len(summary_str)} chars)\n")
            except Exception as e:
                error_count += 1
                print(f"   ❌ Error updating document: {e}\n")
        
        elif isinstance(summary, str):
            already_correct_count += 1
            print(f"✓ Document ID: {doc_id} - summary already a string (OK)")
        
        else:
            print(f"⚠️  Document ID: {doc_id} - summary type is {type(summary).__name__} (unexpected)")
    
    # Print summary
    print()
    print("=" * 70)
    print("MIGRATION COMPLETE")
    print("=" * 70)
    print(f"Total documents:        {total_docs}")
    print(f"Already correct:        {already_correct_count}")
    print(f"Fixed (list → string):  {fixed_count}")
    print(f"Errors:                 {error_count}")
    print("=" * 70)
    
    if fixed_count > 0:
        print(f"\n✅ Successfully migrated {fixed_count} document(s)")
    if error_count > 0:
        print(f"\n⚠️  {error_count} document(s) failed to update")
    if already_correct_count == total_docs:
        print("\n✅ All documents already have correct summary format")

if __name__ == "__main__":
    try:
        migrate_bill_summaries()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migration interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Migration failed with unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
