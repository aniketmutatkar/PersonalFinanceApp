"""
Transaction repository for database operations related to transactions.
"""

from typing import List, Dict, Set, Tuple, Optional
from datetime import date
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from src.models.models import Transaction
from database import get_db_session, TransactionModel


class TransactionRepository:
    """Repository for transaction database operations"""
    
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
            # Query transactions by month
            query = text("""
            SELECT * FROM transactions
            WHERE month = :month_str
            ORDER BY date(date) DESC
            """)
            
            result = session.execute(query, {"month_str": month_str}).fetchall()
            
            # Convert to domain entities
            transactions = []
            for row in result:
                transaction = Transaction(
                    id=row.id,
                    date=row.date,
                    description=row.description,
                    amount=Decimal(str(row.amount)),
                    category=row.category,
                    source=row.source,
                    transaction_hash=row.transaction_hash,
                    month_str=row.month
                )
                transactions.append(transaction)
            
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
            # Query transactions by category
            query = text("""
            SELECT * FROM transactions
            WHERE category = :category
            ORDER BY date(date) DESC
            """)
            
            result = session.execute(query, {"category": category}).fetchall()
            
            # Convert to domain entities
            transactions = []
            for row in result:
                transaction = Transaction(
                    id=row.id,
                    date=row.date,
                    description=row.description,
                    amount=Decimal(str(row.amount)),
                    category=row.category,
                    source=row.source,
                    transaction_hash=row.transaction_hash,
                    month_str=row.month
                )
                transactions.append(transaction)
            
            return transactions
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
            # Query transactions by date range
            query = text("""
            SELECT * FROM transactions
            WHERE date(date) BETWEEN date(:start_date) AND date(:end_date)
            ORDER BY date(date) DESC
            """)
            
            params = {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
            
            result = session.execute(query, params).fetchall()
            
            # Convert to domain entities
            transactions = []
            for row in result:
                transaction = Transaction(
                    id=row.id,
                    date=row.date,
                    description=row.description,
                    amount=Decimal(str(row.amount)),
                    category=row.category,
                    source=row.source,
                    transaction_hash=row.transaction_hash,
                    month_str=row.month
                )
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
            # Query for all transactions, limited and ordered by date
            query = text("""
            SELECT * FROM transactions
            ORDER BY date(date) DESC
            LIMIT :limit
            """)
            
            result = session.execute(query, {"limit": limit}).fetchall()
            
            # Convert to domain entities
            transactions = []
            for row in result:
                transaction = Transaction(
                    id=row.id,
                    date=row.date,
                    description=row.description,
                    amount=Decimal(str(row.amount)),
                    category=row.category,
                    source=row.source,
                    transaction_hash=row.transaction_hash,
                    month_str=row.month
                )
                transactions.append(transaction)
            
            return transactions
        finally:
            session.close()