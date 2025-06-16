# security_cleanup_step1.py
"""
STEP 1: Remove Account Numbers from Database
Security cleanup script to remove sensitive account number data.
Run this ONCE before deploying the code changes.
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
    
    backup_path = f'finances_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
    
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

def cleanup_account_numbers():
    """Remove all account numbers from database tables"""
    db_path = 'finances.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🧹 STEP 1: Removing account numbers from database...")
        
        # Check which tables exist and have account_number columns
        tables_to_clean = [
            'bank_balances',
            'portfolio_balances', 
            'statement_uploads',
            'investment_accounts'
        ]
        
        total_cleaned = 0
        
        for table in tables_to_clean:
            table_info = get_table_info(conn, table)
            if not table_info:
                print(f"⚠️  Table '{table}' doesn't exist (OK)")
                continue
            
            # Check if account_number column exists
            columns = [col[1] for col in table_info]
            if 'account_number' not in columns:
                print(f"⚠️  Table '{table}' has no account_number column (OK)")
                continue
            
            # Get count of records with account numbers before cleanup
            cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE account_number IS NOT NULL")
            before_count = cursor.fetchone()[0]
            
            if before_count > 0:
                # Clear account numbers
                cursor.execute(f"UPDATE {table} SET account_number = NULL")
                affected = cursor.rowcount
                total_cleaned += affected
                print(f"✅ Cleaned {affected} account numbers from {table}")
            else:
                print(f"✅ Table {table} already clean (no account numbers found)")
        
        # Commit all changes
        conn.commit()
        print(f"✅ Total records cleaned: {total_cleaned}")
        
        # Verify cleanup
        print("\n🔍 Verification - checking for remaining account numbers...")
        verification_passed = True
        
        for table in tables_to_clean:
            table_info = get_table_info(conn, table)
            if not table_info:
                continue
                
            columns = [col[1] for col in table_info]
            if 'account_number' not in columns:
                continue
                
            cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE account_number IS NOT NULL")
            remaining = cursor.fetchone()[0]
            
            if remaining > 0:
                print(f"❌ {table} still has {remaining} account numbers!")
                verification_passed = False
            else:
                print(f"✅ {table} is clean")
        
        if verification_passed:
            print("✅ All account numbers successfully removed!")
        else:
            print("❌ Some account numbers remain - manual review needed")
            
        return verification_passed
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False
    finally:
        conn.close()

def main():
    """Main cleanup function"""
    print("🔒 FINANCE TRACKER SECURITY CLEANUP - STEP 1")
    print("=" * 50)
    
    # Step 1: Backup database
    if not backup_database():
        print("❌ Cannot proceed without backup. Exiting.")
        return
    
    # Step 2: Clean account numbers
    success = cleanup_account_numbers()
    
    if success:
        print("\n✅ STEP 1 COMPLETE!")
        print("Next: Apply code changes, then run step 2 (OCR cleanup)")
    else:
        print("\n❌ STEP 1 FAILED!")
        print("Check the errors above and try again")

if __name__ == "__main__":
    main()