"""
Reporting service for generating financial reports.
"""

import os
from typing import Optional, Dict, List
import pandas as pd
from tabulate import tabulate
from datetime import date

from src.models.models import MonthlySummary, Transaction
from src.repositories.transaction_repository import TransactionRepository
from src.repositories.monthly_summary_repository import MonthlySummaryRepository
from src.utils.utilities import format_currency


class ReportingService:
    """Service for generating financial reports"""
    
    def __init__(
        self,
        transaction_repository: TransactionRepository,
        monthly_summary_repository: MonthlySummaryRepository
    ):
        self.transaction_repository = transaction_repository
        self.monthly_summary_repository = monthly_summary_repository
    
    def generate_monthly_summary_report(self) -> Optional[pd.DataFrame]:
        """
        Generate and display monthly summary report.
        
        Returns:
            DataFrame with monthly summary data or None if no data
        """
        # Get all monthly summaries
        summaries = self.monthly_summary_repository.find_all()
        
        if not summaries:
            print("No monthly summary data available.")
            return None
        
        # Convert to DataFrame
        data = []
        for summary in summaries:
            row = {
                'id': summary.id,
                'month_year': summary.month_year,
                'month': summary.month,
                'year': summary.year,
                'total': float(summary.total),
                'investment_total': float(summary.investment_total),
                'total_minus_invest': float(summary.total_minus_invest)
            }
            
            # Add category totals
            for category, amount in summary.category_totals.items():
                row[category] = float(amount)
            
            data.append(row)
        
        # Create DataFrame
        summary_df = pd.DataFrame(data)
        
        # Create a display copy
        display_df = summary_df.copy()
        
        # Drop ID column for display
        if 'id' in display_df.columns:
            display_df = display_df.drop(['id'], axis=1)
        
        # Format month_year as index
        display_df.set_index('month_year', inplace=True)
        
        # Drop redundant columns
        display_df = display_df.drop(['month', 'year'], axis=1)
        
        print("\nMonthly Expense Summary:")
        print(tabulate(display_df, headers='keys', tablefmt='psql', floatfmt='.2f'))
        
        return summary_df
    
    def generate_category_report(self, category: Optional[str] = None) -> Optional[pd.DataFrame]:
        """
        Generate a report for a specific category or all categories.
        
        Args:
            category: Optional category name to filter by
            
        Returns:
            DataFrame with category data
        """
        # Get all monthly summaries
        summaries = self.monthly_summary_repository.find_all()
        
        if not summaries:
            print("No monthly summary data available.")
            return None
        
        if category:
            # Report for a specific category
            data = []
            for summary in summaries:
                if category in summary.category_totals:
                    data.append({
                        'month_year': summary.month_year,
                        'amount': float(summary.category_totals[category])
                    })
            
            if not data:
                print(f"No data found for category: {category}")
                return None
                
            category_df = pd.DataFrame(data)
            
            print(f"\nExpense Report for {category}:")
            print(tabulate(category_df, headers='keys', tablefmt='psql', floatfmt='.2f'))
            
            return category_df
        else:
            # Report with category totals
            # First convert summaries to DataFrame (reuse code from monthly summary)
            data = []
            for summary in summaries:
                row = {
                    'month_year': summary.month_year,
                    'total': float(summary.total),
                    'investment_total': float(summary.investment_total),
                    'total_minus_invest': float(summary.total_minus_invest)
                }
                
                # Add category totals
                for category, amount in summary.category_totals.items():
                    row[category] = float(amount)
                
                data.append(row)
            
            summary_df = pd.DataFrame(data)
            
            # Calculate averages
            numeric_columns = summary_df.select_dtypes(include=['number']).columns.tolist()
            
            averages = summary_df[numeric_columns].mean().to_frame().T
            averages['month_year'] = 'Average'
            
            # Reorder columns to match summary_df
            averages = averages[['month_year'] + numeric_columns]
            
            # Combine with summary data
            combined_df = pd.concat([summary_df[['month_year'] + numeric_columns], averages])
            
            print("\nCategory Summary with Averages:")
            print(tabulate(combined_df, headers='keys', tablefmt='psql', floatfmt='.2f'))
            
            return combined_df
    
    def get_transactions_report(
        self, 
        category: Optional[str] = None, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        month_str: Optional[str] = None
    ) -> Optional[pd.DataFrame]:
        """
        Get detailed transaction report with optional filters.
        
        Args:
            category: Optional category filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            month_str: Optional month string filter (YYYY-MM)
            
        Returns:
            DataFrame with transaction data
        """
        # Add debug logging
        print(f"Reporting service get_transactions_report called with: category={category}, start_date={start_date}, end_date={end_date}, month_str={month_str}")
        
        # Get transactions based on filters
        transactions = []
        
        if month_str:
            # If month is provided, use that
            print(f"Finding transactions by month: {month_str}")
            transactions = self.transaction_repository.find_by_month(month_str)
        elif start_date and end_date:
            # If date range is provided, use that
            print(f"Finding transactions by date range: {start_date} to {end_date}")
            transactions = self.transaction_repository.find_by_date_range(start_date, end_date)
        elif category:
            # If only category is provided, use that
            print(f"Finding transactions by category: {category}")
            transactions = self.transaction_repository.find_by_category(category)
        else:
            # No filters, get all transactions
            print("No filters, trying to get all transactions")
            try:
                # Implement a method to get all transactions if needed
                print("Using find_all_transactions method")
                transactions = self.transaction_repository.find_all_transactions()
            except AttributeError:
                print("find_all_transactions method not found, trying alternative approach")
                # Use a different approach if the method doesn't exist
                # For example, use most recent month or year
                transactions = []
        
        print(f"Found {len(transactions)} transactions")
        
        if not transactions:
            print("No transactions found matching the criteria.")
            return None
        
        # Convert to DataFrame
        data = []
        for tx in transactions:
            data.append({
                'date': tx.date,
                'description': tx.description,
                'amount': float(tx.amount),
                'category': tx.category,
                'source': tx.source
            })
        
        transactions_df = pd.DataFrame(data)
        
        # Apply category filter if provided
        if category and 'category' in transactions_df.columns:
            transactions_df = transactions_df[transactions_df['category'] == category]
        
        # Format the date column
        if 'date' in transactions_df.columns:
            transactions_df['date'] = pd.to_datetime(transactions_df['date']).dt.strftime('%Y-%m-%d')
        
        # Format the amount column to 2 decimal places
        if 'amount' in transactions_df.columns:
            transactions_df['amount'] = transactions_df['amount'].round(2)
        
        print("\nTransaction Report:")
        if category:
            print(f"Category: {category}")
        if start_date:
            print(f"From: {start_date}")
        if end_date:
            print(f"To: {end_date}")
        if month_str:
            print(f"Month: {month_str}")
            
        print(tabulate(transactions_df, headers='keys', tablefmt='psql', floatfmt='.2f'))
        
        return transactions_df
    
    def export_to_csv(self, df: pd.DataFrame, filename: str) -> None:
        """
        Export DataFrame to CSV.
        
        Args:
            df: DataFrame to export
            filename: Output filename
        """
        if df is None:
            print(f"No data to export to {filename}")
            return
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        df.to_csv(filename, index=False)
        print(f"Exported data to {filename}")