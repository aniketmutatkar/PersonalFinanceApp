# security_cleanup_step2.py
"""
STEP 2: Remove OCR Text Storage from Database
Security cleanup script to remove sensitive OCR text data.
Run this ONCE before deploying the Step 2 code changes.
"""

import sqlite3
import os
from datetime import datetime

def backup_database():
    """Create a backup of the current database before cleanup"""
    db_path = 'finances.db'
    if not os.path.exists(db_path):
        print("❌ Database file 'finances.db' not found!")
        return False
    
    backup_path = f'finances_backup_step2_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
    
    try:
        # Create backup using sqlite3
        source = sqlite3.connect(db_path)
        backup = sqlite3.connect(backup_path)
        source.backup(backup)
        source.close()
        backup.close()
        
        print(f"✅ Database backed up to: {backup_path}")
        return True
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False

def get_table_info(conn, table_name):
    """Get information about table columns"""
    cursor = conn.cursor()
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        return cursor.fetchall()
    except sqlite3.OperationalError:
        return []

def analyze_ocr_text_usage():
    """Analyze how much OCR text data exists"""
    db_path = 'finances.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Analyzing OCR text storage usage...")
        
        # Check statement_uploads table
        table_info = get_table_info(conn, 'statement_uploads')
        if not table_info:
            print("⚠️  Table 'statement_uploads' doesn't exist")
            return
        
        columns = [col[1] for col in table_info]
        if 'raw_extracted_text' not in columns:
            print("⚠️  Column 'raw_extracted_text' doesn't exist")
            return
        
        # Count records with OCR text
        cursor.execute("SELECT COUNT(*) FROM statement_uploads WHERE raw_extracted_text IS NOT NULL")
        total_with_text = cursor.fetchone()[0]
        
        # Count total records
        cursor.execute("SELECT COUNT(*) FROM statement_uploads")
        total_records = cursor.fetchone()[0]
        
        if total_with_text > 0:
            # Get sample of OCR text lengths
            cursor.execute("""
                SELECT LENGTH(raw_extracted_text) as text_length 
                FROM statement_uploads 
                WHERE raw_extracted_text IS NOT NULL 
                ORDER BY text_length DESC 
                LIMIT 5
            """)
            lengths = cursor.fetchall()
            
            # Calculate total size
            cursor.execute("SELECT SUM(LENGTH(raw_extracted_text)) FROM statement_uploads WHERE raw_extracted_text IS NOT NULL")
            total_size = cursor.fetchone()[0] or 0
            
            print(f"📊 OCR Text Analysis:")
            print(f"   - Records with OCR text: {total_with_text}")
            print(f"   - Total statement records: {total_records}")
            print(f"   - Total OCR text size: {total_size:,} characters")
            print(f"   - Largest OCR texts: {[length[0] for length in lengths]} characters")
            
            # Show a snippet of what's stored (first 200 chars, redacted)
            cursor.execute("SELECT raw_extracted_text FROM statement_uploads WHERE raw_extracted_text IS NOT NULL LIMIT 1")
            sample = cursor.fetchone()
            if sample and sample[0]:
                snippet = sample[0][:200] + "..." if len(sample[0]) > 200 else sample[0]
                print(f"   - Sample OCR content: '{snippet}'")
        else:
            print("✅ No OCR text found in database")
            
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
    finally:
        conn.close()

def cleanup_ocr_text():
    """Remove all OCR text from database tables"""
    db_path = 'finances.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🧹 STEP 2: Removing OCR text from database...")
        
        # Check which tables exist and have raw_extracted_text columns
        tables_to_clean = [
            'statement_uploads'
        ]
        
        total_cleaned = 0
        
        for table in tables_to_clean:
            table_info = get_table_info(conn, table)
            if not table_info:
                print(f"⚠️  Table '{table}' doesn't exist (OK)")
                continue
            
            # Check if raw_extracted_text column exists
            columns = [col[1] for col in table_info]
            if 'raw_extracted_text' not in columns:
                print(f"⚠️  Table '{table}' has no raw_extracted_text column (OK)")
                continue
            
            # Get count of records with OCR text before cleanup
            cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE raw_extracted_text IS NOT NULL")
            before_count = cursor.fetchone()[0]
            
            if before_count > 0:
                # Clear OCR text
                cursor.execute(f"UPDATE {table} SET raw_extracted_text = NULL")
                affected = cursor.rowcount
                total_cleaned += affected
                print(f"✅ Cleaned {affected} OCR text records from {table}")
            else:
                print(f"✅ Table {table} already clean (no OCR text found)")
        
        # Commit all changes
        conn.commit()
        print(f"✅ Total records cleaned: {total_cleaned}")
        
        # Verify cleanup
        print("\n🔍 Verification - checking for remaining OCR text...")
        verification_passed = True
        
        for table in tables_to_clean:
            table_info = get_table_info(conn, table)
            if not table_info:
                continue
                
            columns = [col[1] for col in table_info]
            if 'raw_extracted_text' not in columns:
                continue
                
            cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE raw_extracted_text IS NOT NULL")
            remaining = cursor.fetchone()[0]
            
            if remaining > 0:
                print(f"❌ {table} still has {remaining} OCR text records!")
                verification_passed = False
            else:
                print(f"✅ {table} is clean")
        
        if verification_passed:
            print("✅ All OCR text successfully removed!")
        else:
            print("❌ Some OCR text remains - manual review needed")
            
        return verification_passed
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False
    finally:
        conn.close()

def main():
    """Main cleanup function"""
    print("🔒 FINANCE TRACKER SECURITY CLEANUP - STEP 2")
    print("=" * 50)
    
    # Step 1: Analyze current OCR usage
    analyze_ocr_text_usage()
    
    print("\n" + "=" * 50)
    
    # Step 2: Backup database
    if not backup_database():
        print("❌ Cannot proceed without backup. Exiting.")
        return
    
    # Step 3: Clean OCR text
    success = cleanup_ocr_text()
    
    if success:
        print("\n✅ STEP 2 COMPLETE!")
        print("Next: Apply code changes, then run step 3 (institution addresses)")
        print("\n🔒 Security Status:")
        print("✅ Account numbers removed (Step 1)")
        print("✅ OCR text removed (Step 2)")
        print("⏳ Institution addresses (Step 3)")
        print("⏳ Network IP cleanup (Step 4)")
        print("⏳ Authentication layer (Step 5)")
    else:
        print("\n❌ STEP 2 FAILED!")
        print("Check the errors above and try again")

if __name__ == "__main__":
    main()