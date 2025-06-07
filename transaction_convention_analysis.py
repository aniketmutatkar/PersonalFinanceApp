# transaction_convention_analysis.py
import sqlite3
import pandas as pd

def analyze_transaction_convention():
    """Analyze your existing transaction sign convention to determine what's correct"""
    
    conn = sqlite3.connect('finances.db')
    
    print("=== TRANSACTION SIGN CONVENTION ANALYSIS ===\n")
    
    # 1. Check various expense categories to understand the convention
    print("1. EXPENSE CATEGORIES (Should these be positive or negative?):")
    expense_sample = pd.read_sql_query("""
    SELECT category, 
           COUNT(*) as count, 
           AVG(amount) as avg_amount,
           MIN(amount) as min_amount,
           MAX(amount) as max_amount,
           SUM(amount) as total_amount
    FROM transactions 
    WHERE category IN ('Groceries', 'Rent', 'Gas', 'Food', 'Shopping')
    GROUP BY category
    ORDER BY total_amount DESC
    """, conn)
    print(expense_sample.to_string(index=False))
    
    # 2. Check income categories
    print("\n2. INCOME CATEGORIES (Should these be positive or negative?):")
    income_sample = pd.read_sql_query("""
    SELECT category, 
           COUNT(*) as count, 
           AVG(amount) as avg_amount,
           MIN(amount) as min_amount,
           MAX(amount) as max_amount,
           SUM(amount) as total_amount
    FROM transactions 
    WHERE category IN ('Pay', 'Payment')
    GROUP BY category
    ORDER BY total_amount DESC
    """, conn)
    print(income_sample.to_string(index=False))
    
    # 3. Sample actual transaction records to see the pattern
    print("\n3. SAMPLE TRANSACTIONS BY CATEGORY:")
    sample_transactions = pd.read_sql_query("""
    SELECT date, description, amount, category
    FROM transactions 
    WHERE category IN ('Pay', 'Groceries', 'Acorns', 'Rent')
    ORDER BY category, date DESC
    LIMIT 20
    """, conn)
    print(sample_transactions.to_string(index=False))
    
    # 4. Check if there are any negative amounts in your data
    print("\n4. NEGATIVE AMOUNT ANALYSIS:")
    negative_analysis = pd.read_sql_query("""
    SELECT 
        COUNT(CASE WHEN amount < 0 THEN 1 END) as negative_count,
        COUNT(CASE WHEN amount > 0 THEN 1 END) as positive_count,
        COUNT(CASE WHEN amount = 0 THEN 1 END) as zero_count,
        COUNT(*) as total_count,
        MIN(amount) as most_negative,
        MAX(amount) as most_positive
    FROM transactions
    """, conn)
    print(negative_analysis.to_string(index=False))
    
    # 5. Show some negative transactions if they exist
    print("\n5. NEGATIVE TRANSACTIONS (if any):")
    negative_transactions = pd.read_sql_query("""
    SELECT date, description, amount, category, source
    FROM transactions 
    WHERE amount < 0
    ORDER BY amount
    LIMIT 10
    """, conn)
    print(negative_transactions.to_string(index=False))
    
    conn.close()
    
    print("\n=== INTERPRETATION GUIDE ===")
    print("Based on the results above, determine:")
    print("1. Are regular expenses (Groceries, Rent) positive or negative?")
    print("2. Is income (Pay) positive or negative?") 
    print("3. Are investments (Acorns, etc.) positive or negative?")
    print("4. Does this follow a consistent pattern?")
    print("\nLOGICAL CONVENTIONS:")
    print("Option A - Bank Statement View: Expenses=Positive, Income=Negative")
    print("Option B - Accounting View: Expenses=Positive, Income=Negative") 
    print("Option C - Cash Flow View: Money Out=Positive, Money In=Negative")
    print("Option D - Investment View: Money Invested=Positive, Expenses=Positive, Income=Negative")

if __name__ == "__main__":
    analyze_transaction_convention()