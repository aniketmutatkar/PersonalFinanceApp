"""
Transaction repository for database operations related to transactions.
"""

from typing import List, Dict, Set, Tuple, Optional
from datetime import date
from datetime import datetime
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from src.models.models import Transaction
from database import get_db_session, TransactionModel


class TransactionRepository:
    """Repository for transaction database operations"""
    
    def _parse_date(self, date_str):
        """
        Parse date string from database into date object.
        Handles multiple date formats.
        """
        if not isinstance(date_str, str):
            return date_str
        
        # Try MM/DD/YYYY format first (your current format)
        try:
            return datetime.strptime(date_str, '%m/%d/%Y').date()
        except ValueError:
            pass
        
        # Try YYYY-MM-DD format
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
        
        # Last resort - use pandas
        try:
            import pandas as pd
            return pd.to_datetime(date_str).date()
        except:
            # If all else fails, return the original string
            # This will cause Pydantic to fail, but at least we'll know
            return date_str

    def _create_transaction_from_row(self, row):
        """
        Helper method to create Transaction domain entity from database row.
        Handles date parsing consistently.
        """
        return Transaction(
            id=row.id,
            date=self._parse_date(row.date),
            description=row.description,
            amount=Decimal(str(row.amount)),
            category=row.category,
            source=row.source,
            transaction_hash=row.transaction_hash,
            month_str=row.month
        )

    def save(self, transaction: Transaction) -> Transaction:
        """
        Save a transaction to the database.
        
        Args:
            transaction: The transaction to save
            
        Returns:
            The saved transaction with ID
            
        Raises:
            ValueError: If a transaction with the same hash already exists
        """
        session = get_db_session()
        
        try:
            # Create a SQLAlchemy model from the domain entity
            transaction_model = TransactionModel(
                date=str(transaction.date),
                description=transaction.description,
                amount=float(transaction.amount),
                category=transaction.category,
                source=transaction.source,
                month=transaction.month_str,
                transaction_hash=transaction.transaction_hash
            )
            
            # Add to session and flush to get ID
            session.add(transaction_model)
            session.flush()
            
            # Update domain entity with generated ID
            transaction.id = transaction_model.id
            
            # Commit
            session.commit()
            
            return transaction
            
        except IntegrityError:
            # Unique constraint violation (duplicate hash)
            session.rollback()
            raise ValueError(f"Transaction with hash {transaction.transaction_hash} already exists")
        finally:
            session.close()
    
    def save_many(self, transactions: List[Transaction]) -> Tuple[int, Dict[str, Set[str]]]:
        """
        Save multiple transactions to the database.
        
        Args:
            transactions: List of transactions to save
            
        Returns:
            Tuple containing:
                - Number of transactions added
                - Dictionary mapping affected months to sets of affected categories
        """
        if not transactions:
            return 0, {}
        
        session = get_db_session()
        records_added = 0
        affected_data = {}  # Structure will be {month: set(categories)}
        
        try:
            # Process each transaction
            for transaction in transactions:
                # Create a SQLAlchemy model
                transaction_model = TransactionModel(
                    date=str(transaction.date),
                    description=transaction.description,
                    amount=float(transaction.amount),
                    category=transaction.category,
                    source=transaction.source,
                    month=transaction.month_str,
                    transaction_hash=transaction.transaction_hash
                )
                
                try:
                    # Add and commit
                    session.add(transaction_model)
                    session.commit()
                    records_added += 1
                    
                    # Update domain entity with generated ID
                    transaction.id = transaction_model.id
                    
                    # Track which month and category were affected
                    month = transaction.month_str
                    category = transaction.category
                    
                    if month not in affected_data:
                        affected_data[month] = set()
                    affected_data[month].add(category)
                    
                except IntegrityError:
                    # Skip duplicates (unique constraint violation)
                    session.rollback()
        finally:
            session.close()
        
        return records_added, affected_data
    
    def find_by_month(self, month_str: str) -> List[Transaction]:
        """
        Find transactions for a specific month.
        
        Args:
            month_str: Month string in format 'YYYY-MM'
            
        Returns:
            List of transactions for that month
        """
        session = get_db_session()
        
        try:
            query = text("""
            SELECT * FROM transactions
            WHERE month = :month_str
            ORDER BY date(date) DESC
            """)
            
            result = session.execute(query, {"month_str": month_str}).fetchall()
            
            # Convert to domain entities using helper
            transactions = []
            for row in result:
                transactions.append(self._create_transaction_from_row(row))
            
            return transactions
        finally:
            session.close()

    def find_by_category(self, category: str) -> List[Transaction]:
        """
        Find transactions for a specific category.
        
        Args:
            category: Category name
            
        Returns:
            List of transactions in that category
        """
        session = get_db_session()
        
        try:
            query = text("""
            SELECT * FROM transactions
            WHERE category = :category
            ORDER BY date(date) DESC
            """)
            
            result = session.execute(query, {"category": category}).fetchall()
            
            # Convert to domain entities using helper
            transactions = []
            for row in result:
                transactions.append(self._create_transaction_from_row(row))
            
            return transactions
        finally:
            session.close()

    def find_by_id(self, transaction_id: int) -> Optional[Transaction]:
        """
        Find a transaction by its ID.
        
        Args:
            transaction_id: The transaction ID to find
            
        Returns:
            The transaction if found, None otherwise
        """
        session = get_db_session()
        
        try:
            query = text("""
            SELECT * FROM transactions
            WHERE id = :transaction_id
            """)
            
            result = session.execute(query, {"transaction_id": transaction_id}).fetchone()
            
            if not result:
                return None
            
            return self._create_transaction_from_row(result)
        finally:
            session.close()

    def find_by_date_range(self, start_date: date, end_date: date) -> List[Transaction]:
        """
        Find transactions within a date range.
        
        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            
        Returns:
            List of transactions within the date range
        """
        session = get_db_session()
        
        try:
            # Since your dates are stored as MM/DD/YYYY strings, we need to handle the comparison carefully
            # Convert the input dates to the same format for comparison
            start_date_str = start_date.strftime('%m/%d/%Y')
            end_date_str = end_date.strftime('%m/%d/%Y')
            
            # Use a more flexible approach that works with your date format
            query = text("""
            SELECT * FROM transactions
            WHERE date(substr('0' || date, -10)) BETWEEN date(:start_date) AND date(:end_date)
            OR date(date) BETWEEN date(:start_date) AND date(:end_date)
            ORDER BY date DESC
            """)
            
            params = {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
            
            result = session.execute(query, params).fetchall()
            
            # Convert to domain entities using helper
            transactions = []
            for row in result:
                transaction = self._create_transaction_from_row(row)
                # Double-check the date is in range after parsing
                if start_date <= transaction.date <= end_date:
                    transactions.append(transaction)
            
            return transactions
        finally:
            session.close()

    def get_existing_hashes(self) -> List[str]:
        """
        Get all existing transaction hashes.
        
        Returns:
            List of transaction hash strings
        """
        session = get_db_session()
        
        try:
            # Query for all transaction hashes
            query = text("SELECT transaction_hash FROM transactions")
            result = session.execute(query).fetchall()
            
            # Extract hash values
            return [row[0] for row in result]
        finally:
            session.close()

    def find_all_transactions(self, limit: int = 1000) -> List[Transaction]:
        """
        Find all transactions, with optional limit.
        
        Args:
            limit: Maximum number of transactions to return
            
        Returns:
            List of transactions
        """
        session = get_db_session()
        
        try:
            query = text("""
            SELECT * FROM transactions
            ORDER BY date DESC
            LIMIT :limit
            """)
            
            result = session.execute(query, {"limit": limit}).fetchall()
            
            # Convert to domain entities using helper
            transactions = []
            for row in result:
                transactions.append(self._create_transaction_from_row(row))
            
            return transactions
        finally:
            session.close()