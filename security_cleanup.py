# security_cleanup.py
"""
Security cleanup script to remove sensitive data from existing database.
Run this ONCE to clean up your existing data before deploying code changes.
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

def cleanup_sensitive_data():
    """Remove all sensitive data from database tables"""
    db_path = 'finances.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🧹 Starting security cleanup...")
        
        # 1. Remove account numbers from bank_balances table
        try:
            cursor.execute("UPDATE bank_balances SET account_number = NULL")
            affected = cursor.rowcount
            print(f"✅ Cleaned {affected} bank account numbers")
        except sqlite3.OperationalError:
            print("⚠️  bank_balances.account_number column doesn't exist (OK)")
        
        # 2. Remove raw OCR text from statement_uploads table
        try:
            cursor.execute("UPDATE statement_uploads SET raw_extracted_text = NULL")
            affected = cursor.rowcount
            print(f"✅ Cleaned {affected} OCR text records")
        except sqlite3.OperationalError:
            print("⚠️  statement_uploads.raw_extracted_text column doesn't exist (OK)")
        
        # 3. Remove account numbers from portfolio_balances table (if exists)
        try:
            cursor.execute("UPDATE portfolio_balances SET account_number = NULL")
            affected = cursor.rowcount
            print(f"✅ Cleaned {affected} portfolio account numbers")
        except sqlite3.OperationalError:
            print("⚠️  portfolio_balances.account_number column doesn't exist (OK)")
        
        # 4. Clean any other potential sensitive fields
        tables_to_check = [
            ("investment_accounts", "account_number"),
            ("statement_uploads", "account_number"),
        ]
        
        for table, column in tables_to_check:
            try:
                cursor.execute(f"UPDATE {table} SET {column} = NULL")
                affected = cursor.rowcount
                if affected > 0:
                    print(f"✅ Cleaned {affected} records from {table}.{column}")
            except sqlite3.OperationalError:
                pass  # Column doesn't exist, which is fine
        
        # 5. Vacuum database to reclaim space
        cursor.execute("VACUUM")
        print("✅ Database vacuumed to reclaim space")
        
        conn.commit()
        conn.close()
        
        print("🎉 Security cleanup completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False

def verify_cleanup():
    """Verify that sensitive data has been removed"""
    db_path = 'finances.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("\n🔍 Verifying cleanup...")
        
        # Check for remaining account numbers
        checks = [
            ("bank_balances", "account_number"),
            ("statement_uploads", "raw_extracted_text"),
            ("portfolio_balances", "account_number"),
            ("investment_accounts", "account_number"),
        ]
        
        all_clean = True
        for table, column in checks:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE {column} IS NOT NULL AND {column} != ''")
                count = cursor.fetchone()[0]
                if count > 0:
                    print(f"⚠️  {table}.{column} still has {count} non-null values")
                    all_clean = False
                else:
                    print(f"✅ {table}.{column} is clean")
            except sqlite3.OperationalError:
                print(f"✅ {table}.{column} doesn't exist (good)")
        
        conn.close()
        
        if all_clean:
            print("🎉 All sensitive data successfully removed!")
        else:
            print("⚠️  Some sensitive data may still exist")
            
        return all_clean
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    """Main cleanup function"""
    print("🔒 Finance Tracker Security Cleanup")
    print("=" * 40)
    
    # Step 1: Backup database
    print("\n📁 Step 1: Creating database backup...")
    if not backup_database():
        print("❌ Cannot proceed without backup. Exiting.")
        return
    
    # Step 2: Clean sensitive data
    print("\n🧹 Step 2: Removing sensitive data...")
    if not cleanup_sensitive_data():
        print("❌ Cleanup failed. Check backup file.")
        return
    
    # Step 3: Verify cleanup
    print("\n🔍 Step 3: Verifying cleanup...")
    verify_cleanup()
    
    print("\n" + "=" * 40)
    print("🎉 Security cleanup completed!")
    print("\n📋 Next steps:")
    print("1. Run the updated code with security improvements")
    print("2. Test your application to ensure everything works")
    print("3. Delete backup file once you're confident: finances_backup_*.db")

if __name__ == "__main__":
    main()