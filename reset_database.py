# reset_database.py
"""
Script to truncate transactions and monthly_summary tables for fresh start.
Run this before testing the new rank-based duplicate detection system.
"""

from database import get_db_session
from sqlalchemy import text

def reset_transactions_and_summaries():
    """
    Truncate transactions and monthly_summary tables to start fresh.
    This preserves the table structure but removes all data.
    """
    session = get_db_session()
    
    try:
        print("🗑️  Resetting database tables...")
        
        # Disable foreign key checks (SQLite specific)
        session.execute(text("PRAGMA foreign_keys = OFF"))
        
        # Truncate transactions table
        print("   Clearing transactions table...")
        session.execute(text("DELETE FROM transactions"))
        session.execute(text("DELETE FROM sqlite_sequence WHERE name='transactions'"))  # Reset auto-increment
        
        # Truncate monthly_summary table  
        print("   Clearing monthly_summary table...")
        session.execute(text("DELETE FROM monthly_summary"))
        session.execute(text("DELETE FROM sqlite_sequence WHERE name='monthly_summary'"))  # Reset auto-increment
        
        # Re-enable foreign key checks
        session.execute(text("PRAGMA foreign_keys = ON"))
        
        # Commit all changes
        session.commit()
        
        print("✅ Database reset complete!")
        print("   - All transactions deleted")
        print("   - All monthly summaries deleted") 
        print("   - Auto-increment counters reset")
        print("   - Table structures preserved")
        print("\n🚀 Ready for fresh data upload!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error resetting database: {str(e)}")
        raise e
    finally:
        session.close()

def verify_reset():
    """
    Verify that tables are empty after reset.
    """
    session = get_db_session()
    
    try:
        # Count transactions
        transaction_count = session.execute(text("SELECT COUNT(*) FROM transactions")).scalar()
        
        # Count monthly summaries
        summary_count = session.execute(text("SELECT COUNT(*) FROM monthly_summary")).scalar()
        
        print(f"\n📊 Verification:")
        print(f"   Transactions: {transaction_count} records")
        print(f"   Monthly summaries: {summary_count} records")
        
        if transaction_count == 0 and summary_count == 0:
            print("✅ Reset verified - tables are empty")
        else:
            print("⚠️  Warning - tables still contain data")
            
    except Exception as e:
        print(f"❌ Error verifying reset: {str(e)}")
    finally:
        session.close()

if __name__ == "__main__":
    print("🔄 Finance Tracker Database Reset")
    print("=" * 50)
    
    # Ask for confirmation
    confirm = input("Are you sure you want to delete ALL transactions and monthly summaries? (yes/no): ")
    
    if confirm.lower() in ['yes', 'y']:
        reset_transactions_and_summaries()
        verify_reset()
    else:
        print("❌ Reset cancelled")