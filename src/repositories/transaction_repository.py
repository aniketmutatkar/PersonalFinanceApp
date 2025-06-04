# src/repositories/transaction_repository.py

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

    def find_with_filters(
        self,
        categories: Optional[List[str]] = None,
        description: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        month_str: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> Tuple[List[Transaction], int]:
        """
        Find transactions with advanced filtering support.
        
        Args:
            categories: List of categories to filter by (OR logic)
            description: Search term for description (case-insensitive)
            start_date: Start date filter (inclusive)
            end_date: End date filter (inclusive)
            month_str: Month filter in YYYY-MM format
            limit: Maximum number of results to return
            offset: Number of results to skip (for pagination)
            
        Returns:
            Tuple of (transactions, total_count)
        """
        session = get_db_session()
        
        try:
            # Build WHERE clauses dynamically
            where_clauses = []
            params = {}
            
            # Category filter (OR logic)
            if categories and len(categories) > 0:
                # Remove empty strings and None values
                clean_categories = [cat for cat in categories if cat and cat.strip()]
                if clean_categories:
                    placeholders = [f":category_{i}" for i in range(len(clean_categories))]
                    where_clauses.append(f"category IN ({', '.join(placeholders)})")
                    for i, category in enumerate(clean_categories):
                        params[f"category_{i}"] = category
            
            # Description search (case-insensitive)
            if description and description.strip():
                where_clauses.append("LOWER(description) LIKE LOWER(:description)")
                params["description"] = f"%{description.strip()}%"
            
            # Month filter (takes priority over date range)
            if month_str and month_str.strip():
                where_clauses.append("month = :month_str")
                params["month_str"] = month_str.strip()
            elif start_date and end_date:
                # Date range filter (only if no month filter)
                where_clauses.append("date(date) BETWEEN date(:start_date) AND date(:end_date)")
                params["start_date"] = start_date.isoformat()
                params["end_date"] = end_date.isoformat()
            elif start_date:
                where_clauses.append("date(date) >= date(:start_date)")
                params["start_date"] = start_date.isoformat()
            elif end_date:
                where_clauses.append("date(date) <= date(:end_date)")
                params["end_date"] = end_date.isoformat()
            
            # Build the WHERE clause
            where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
            
            # Count query for total results
            count_query = text(f"""
            SELECT COUNT(*) as total
            FROM transactions
            {where_sql}
            """)
            
            count_result = session.execute(count_query, params).fetchone()
            total_count = count_result[0] if count_result else 0
            
            # Main query with pagination
            main_query = text(f"""
            SELECT * FROM transactions
            {where_sql}
            ORDER BY date(date) DESC, id DESC
            LIMIT :limit OFFSET :offset
            """)
            
            # Add pagination parameters
            params["limit"] = limit
            params["offset"] = offset
            
            result = session.execute(main_query, params).fetchall()
            
            # Convert to domain entities
            transactions = []
            for row in result:
                transactions.append(self._create_transaction_from_row(row))
            
            return transactions, total_count
            
        finally:
            session.close()

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
    
    # LEGACY METHODS - Keep for backward compatibility
    def find_by_month(self, month_str: str) -> List[Transaction]:
        """Find transactions for a specific month. LEGACY METHOD."""
        transactions, _ = self.find_with_filters(month_str=month_str, limit=10000)
        return transactions

    def find_by_category(self, category: str) -> List[Transaction]:
        """Find transactions for a specific category. LEGACY METHOD."""
        transactions, _ = self.find_with_filters(categories=[category], limit=10000)
        return transactions

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
        """Find transactions within a date range. LEGACY METHOD."""
        transactions, _ = self.find_with_filters(
            start_date=start_date, 
            end_date=end_date, 
            limit=10000
        )
        return transactions

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

    def find_all_transactions(self, limit: int = 10000) -> List[Transaction]:
        """Find all transactions, with optional limit. LEGACY METHOD."""
        transactions, _ = self.find_with_filters(limit=limit)
        return transactions