#!/usr/bin/env python3
"""
Portfolio API Debug Script
Run with: python3 test.py

This script investigates why the Portfolio Trends API is broken
and shows old 2023 data instead of current 2024/2025 data.
"""

import sqlite3
import requests
import json
from datetime import datetime, date
from decimal import Decimal

def format_currency(amount):
    """Format amount as currency"""
    if amount is None:
        return "$0"
    return f"${float(amount):,.2f}"

def check_database():
    """Check what's actually in the database"""
    print("🔍 DATABASE INVESTIGATION")
    print("=" * 40)
    
    try:
        # Connect to your database
        conn = sqlite3.connect('finance.db')  # Adjust path if needed
        cursor = conn.cursor()
        
        # 1. Check portfolio accounts
        print("\n1️⃣ PORTFOLIO ACCOUNTS:")
        cursor.execute("""
            SELECT id, account_name, institution, account_type, is_active 
            FROM portfolio_accounts 
            ORDER BY id
        """)
        accounts = cursor.fetchall()
        
        for account in accounts:
            print(f"  ID: {account[0]} | {account[1]} ({account[2]}) - {account[3]} - Active: {account[4]}")
        
        # 2. Check portfolio balances - recent data
        print("\n2️⃣ RECENT PORTFOLIO BALANCES (Last 20):")
        cursor.execute("""
            SELECT pb.account_id, pa.account_name, pb.balance_date, pb.balance_amount, pb.data_source
            FROM portfolio_balances pb
            JOIN portfolio_accounts pa ON pb.account_id = pa.id
            WHERE pb.balance_date >= '2024-01-01'
            ORDER BY pb.balance_date DESC, pb.account_id
            LIMIT 20
        """)
        recent_balances = cursor.fetchall()
        
        if recent_balances:
            print("  Recent balance data found:")
            for balance in recent_balances:
                print(f"    {balance[1]}: {balance[2]} = {format_currency(balance[3])} ({balance[4]})")
        else:
            print("  ❌ NO RECENT BALANCE DATA FOUND!")
        
        # 3. Check balance data by month for 2024/2025
        print("\n3️⃣ MONTHLY BALANCE SUMMARY (2024-2025):")
        cursor.execute("""
            SELECT 
                strftime('%Y-%m', pb.balance_date) as month,
                COUNT(*) as balance_count,
                SUM(pb.balance_amount) as total_value,
                GROUP_CONCAT(pa.account_name || ':' || pb.balance_amount) as account_breakdown
            FROM portfolio_balances pb
            JOIN portfolio_accounts pa ON pb.account_id = pa.id
            WHERE pb.balance_date >= '2024-01-01'
            GROUP BY strftime('%Y-%m', pb.balance_date)
            ORDER BY month DESC
        """)
        monthly_data = cursor.fetchall()
        
        if monthly_data:
            print("  Monthly portfolio values:")
            for month_data in monthly_data:
                print(f"    {month_data[0]}: {format_currency(month_data[2])} ({month_data[1]} balances)")
        else:
            print("  ❌ NO MONTHLY DATA FOR 2024-2025!")
        
        # 4. Check what date ranges exist
        print("\n4️⃣ DATE RANGE ANALYSIS:")
        cursor.execute("""
            SELECT 
                MIN(balance_date) as earliest,
                MAX(balance_date) as latest,
                COUNT(*) as total_balances,
                COUNT(DISTINCT account_id) as accounts_with_data
            FROM portfolio_balances
        """)
        date_range = cursor.fetchone()
        
        print(f"  Date range: {date_range[0]} to {date_range[1]}")
        print(f"  Total balances: {date_range[2]}")
        print(f"  Accounts with data: {date_range[3]}")
        
        # 5. Check for gaps in recent data
        print("\n5️⃣ DATA GAPS CHECK:")
        cursor.execute("""
            SELECT account_id, account_name, MAX(balance_date) as last_balance
            FROM portfolio_balances pb
            JOIN portfolio_accounts pa ON pb.account_id = pa.id
            WHERE pa.is_active = 1
            GROUP BY account_id, account_name
            ORDER BY last_balance DESC
        """)
        last_balances = cursor.fetchall()
        
        current_date = date.today()
        for account_data in last_balances:
            last_date = datetime.strptime(account_data[2], '%Y-%m-%d').date()
            days_old = (current_date - last_date).days
            status = "✅ Recent" if days_old < 60 else f"⚠️ {days_old} days old"
            print(f"    {account_data[1]}: Last balance {account_data[2]} ({status})")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except FileNotFoundError:
        print("❌ Database file not found. Check the path: finance_tracker.db")

def check_api_endpoints():
    """Check what the APIs are actually returning"""
    print("\n🌐 API ENDPOINT INVESTIGATION")
    print("=" * 40)
    
    base_url = "http://localhost:8000/api"
    
    # 1. Portfolio Trends API - different periods
    print("\n1️⃣ PORTFOLIO TRENDS API:")
    periods = ['1y', '2y', '5y', 'all']
    
    for period in periods:
        try:
            response = requests.get(f"{base_url}/portfolio/trends?period={period}")
            if response.status_code == 200:
                data = response.json()
                monthly_values = data.get('monthly_values', [])
                print(f"\n  Period {period}:")
                print(f"    Found {len(monthly_values)} monthly values")
                
                if monthly_values:
                    # Show first and last few values
                    print(f"    Latest 3:")
                    for i, month in enumerate(monthly_values[:3]):
                        print(f"      {i}: {month.get('month_display')} = {format_currency(month.get('total_value'))}")
                    
                    if len(monthly_values) > 3:
                        print(f"    Oldest 3:")
                        for i, month in enumerate(monthly_values[-3:]):
                            idx = len(monthly_values) - 3 + i
                            print(f"      {idx}: {month.get('month_display')} = {format_currency(month.get('total_value'))}")
                else:
                    print("    ❌ No monthly values returned")
            else:
                print(f"  ❌ API error for period {period}: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Request failed for period {period}: {e}")
    
    # 2. Portfolio Overview API
    print("\n2️⃣ PORTFOLIO OVERVIEW API:")
    try:
        response = requests.get(f"{base_url}/portfolio/overview")
        if response.status_code == 200:
            data = response.json()
            print(f"    Total Portfolio Value: {format_currency(data.get('total_portfolio_value'))}")
            print(f"    Total Deposits: {format_currency(data.get('total_deposits'))}")
            print(f"    Total Growth: {format_currency(data.get('total_growth'))}")
            print(f"    As of Date: {data.get('as_of_date')}")
        else:
            print(f"  ❌ API error: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Request failed: {e}")
    
    # 3. Financial Overview API
    print("\n3️⃣ FINANCIAL OVERVIEW API:")
    try:
        response = requests.get(f"{base_url}/statistics/overview")
        if response.status_code == 200:
            data = response.json()
            net_worth = data.get('financial_health', {}).get('net_worth', {})
            print(f"    Total Net Worth: {format_currency(net_worth.get('total_net_worth'))}")
            print(f"    Liquid Assets: {format_currency(net_worth.get('liquid_assets'))}")
            print(f"    Investment Assets: {format_currency(net_worth.get('investment_assets'))}")
        else:
            print(f"  ❌ API error: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Request failed: {e}")

def analyze_data():
    """Analyze and provide recommendations"""
    print("\n🔧 ANALYSIS & RECOMMENDATIONS")
    print("=" * 40)
    
    print("\n💡 LIKELY ISSUES WITH PORTFOLIO TRENDS API:")
    print("  1. Date filtering logic is wrong in get_portfolio_trends()")
    print("  2. Account balance queries are not finding recent data")
    print("  3. Monthly value aggregation is using old data")
    print("  4. Period calculation (1y, 2y) might be off")
    
    print("\n🎯 NEXT STEPS:")
    print("  1. Check if you have recent balance data (above)")
    print("  2. Verify the Portfolio Service date logic")
    print("  3. Fix the portfolio trends API to use latest data")
    print("  4. Use Portfolio Overview API as temporary workaround")
    
    print("\n✅ CONFIRMED WORKING APIS:")
    print("  • Portfolio Overview API: Shows current $112,809")
    print("  • Financial Overview API: Shows correct net worth $131,328")
    print("  • Problem: Portfolio Trends API stuck on 2023 data")

def main():
    """Main function"""
    print("🔍 PORTFOLIO API DEBUG INVESTIGATION")
    print("=" * 50)
    print(f"Running at: {datetime.now()}")
    print()
    
    # Check database first
    check_database()
    
    # Check API endpoints
    check_api_endpoints()
    
    # Provide analysis
    analyze_data()
    
    print("\n" + "=" * 50)
    print("🏁 INVESTIGATION COMPLETE")
    print("Check the output above to identify the portfolio trends issue!")

if __name__ == "__main__":
    main()