# src/repositories/transaction_repository.py

from typing import List, Dict, Set, Tuple, Optional
from datetime import date, datetime
import pandas as pd
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from src.models.models import Transaction
from database import get_db_session, TransactionModel


class TransactionRepository:
    """Repository for transaction database operations"""
    
    def _create_transaction_from_row(self, row):
        """
        Helper method to create Transaction domain entity from database row.
        Now handles timestamp-based duplicate detection fields.
        """
        # Parse date from database - should be in YYYY-MM-DD format
        tx_date = row.date
        if isinstance(tx_date, str):
            # Parse ISO date string
            from datetime import datetime
            tx_date = datetime.fromisoformat(tx_date).date()
        
        # Parse import_timestamp if present
        import_timestamp = None
        if hasattr(row, 'import_timestamp') and row.import_timestamp:
            if isinstance(row.import_timestamp, str):
                import_timestamp = datetime.fromisoformat(row.import_timestamp)
            else:
                import_timestamp = row.import_timestamp
        
        return Transaction(
            id=row.id,
            date=tx_date,
            description=row.description,
            amount=Decimal(str(row.amount)),
            category=row.category,
            source=row.source,
            transaction_hash=row.transaction_hash,
            month_str=row.month,
            # UPDATED FIELDS
            import_timestamp=import_timestamp,  # CHANGED from import_date
            rank_within_batch=getattr(row, 'rank_within_batch', None),
            import_batch_id=getattr(row, 'import_batch_id', None),
            base_hash=getattr(row, 'base_hash', None)
        )
    
    def find_with_filters(
        self,
        categories: Optional[List[str]] = None,
        description: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        month_str: Optional[str] = None,
        sort_field: Optional[str] = None,
        sort_direction: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> Tuple[List[Transaction], int, Decimal, Decimal]:  # CHANGED: Added Decimal, Decimal for total_sum, avg_amount
        """
        Find transactions with advanced filtering support.
        
        Returns:
            Tuple of (transactions, total_count, total_sum, average_amount)
        """
        session = get_db_session()
        
        try:
            # Build WHERE clauses dynamically (same as before)
            where_clauses = []
            params = {}
            
            # Category filter (OR logic)
            if categories and len(categories) > 0:
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
                where_clauses.append("date BETWEEN :start_date AND :end_date")
                params["start_date"] = start_date.isoformat()
                params["end_date"] = end_date.isoformat()
            elif start_date:
                where_clauses.append("date >= :start_date")
                params["start_date"] = start_date.isoformat()
            elif end_date:
                where_clauses.append("date <= :end_date")
                params["end_date"] = end_date.isoformat()
            
            # Build the WHERE clause
            where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
            
            aggregate_query = text(f"""
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(amount), 0) as total_sum,
                COALESCE(AVG(amount), 0) as avg_amount
            FROM transactions
            {where_sql}
            """)
            
            aggregate_result = session.execute(aggregate_query, params).fetchone()
            total_count = aggregate_result[0] if aggregate_result else 0
            total_sum = Decimal(str(aggregate_result[1])) if aggregate_result and aggregate_result[1] else Decimal('0')
            avg_amount = Decimal(str(aggregate_result[2])) if aggregate_result and aggregate_result[2] else Decimal('0')
            
            # Build sort clause
            valid_sort_fields = ['date', 'description', 'category', 'amount', 'source']
            valid_directions = ['asc', 'desc']

            if sort_field not in valid_sort_fields:
                sort_field = 'date'
            if sort_direction not in valid_directions:
                sort_direction = 'desc'

            if sort_field == 'date':
                order_clause = f"ORDER BY date {sort_direction.upper()}, id DESC"
            else:
                order_clause = f"ORDER BY {sort_field} {sort_direction.upper()}, date DESC, id DESC"

            # Main query with pagination
            main_query = text(f"""
            SELECT * FROM transactions
            {where_sql}
            {order_clause}
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
            
            return transactions, total_count, total_sum, avg_amount
            
        finally:
            session.close()

    def save(self, transaction: Transaction) -> Transaction:
        """
        Save a single transaction (for manual entry).
        """
        session = get_db_session()
        
        try:
            # For manual transactions, use base_hash as full hash
            if not transaction.transaction_hash:
                transaction.transaction_hash = transaction.base_hash or Transaction.create_base_hash(
                    transaction.date, transaction.description, transaction.amount, transaction.source
                )
            
            transaction_model = TransactionModel(
                date=transaction.date,
                description=transaction.description,
                amount=float(transaction.amount),
                category=transaction.category,
                source=transaction.source,
                month=transaction.month_str,
                transaction_hash=transaction.transaction_hash,
                # NEW FIELDS - None for manual transactions
                import_date=transaction.import_date,
                rank_within_batch=transaction.rank_within_batch,
                import_batch_id=transaction.import_batch_id,
                base_hash=transaction.base_hash
            )
            
            session.add(transaction_model)
            session.flush()
            
            transaction.id = transaction_model.id
            session.commit()
            
            return transaction
            
        except IntegrityError:
            session.rollback()
            raise ValueError(f"Transaction with hash {transaction.transaction_hash} already exists")
        finally:
            session.close()

    def save_many(self, transactions: List[Transaction], import_batch_id: str, import_timestamp: datetime) -> Tuple[int, Dict[str, Set[str]], List[str]]:
        """
        Save multiple transactions with timestamp-based duplicate detection.
        """
        print(f"🔍 save_many called")
        print(f"🔍   transactions: {len(transactions) if transactions else 'None'}")
        print(f"🔍   import_batch_id: {import_batch_id}")
        print(f"🔍   import_timestamp: {import_timestamp} (type: {type(import_timestamp)})")
        
        if not transactions:
            print("🔍 No transactions provided - returning early")
            return 0, {}, []
        
        # Show first few transactions
        for i, tx in enumerate(transactions[:3]):
            print(f"🔍 Transaction {i+1}: {tx.description[:30]}")
            print(f"🔍   base_hash: {tx.base_hash}")
            print(f"🔍   import_timestamp: {tx.import_timestamp}")
            print(f"🔍   import_batch_id: {tx.import_batch_id}")
        
        # Step 1: Assign ranks within this batch
        print("🔍 Calling assign_ranks_within_batch...")
        self.assign_ranks_within_batch(transactions, import_batch_id, import_timestamp)
        
        session = get_db_session()
        records_added = 0
        affected_data = {}
        duplicate_hashes = []
        
        try:
            print(f"🔍 Starting duplicate check and save for {len(transactions)} transactions...")
            
            # Step 2: Check each transaction for duplicates before saving
            for i, transaction in enumerate(transactions):
                print(f"🔍 Processing transaction {i+1}/{len(transactions)}: {transaction.description[:30]}")
                print(f"🔍   rank: {transaction.rank_within_batch}, hash: {transaction.transaction_hash}")
                
                is_dup = self.is_duplicate(transaction)
                print(f"🔍   is_duplicate: {is_dup}")
                
                if not is_dup:
                    print("🔍   Saving transaction...")
                    # Not a duplicate - save it
                    transaction_model = TransactionModel(
                        date=transaction.date,
                        description=transaction.description,
                        amount=float(transaction.amount),
                        category=transaction.category,
                        source=transaction.source,
                        month=transaction.month_str,
                        transaction_hash=transaction.transaction_hash,
                        import_timestamp=transaction.import_timestamp,
                        rank_within_batch=transaction.rank_within_batch,
                        import_batch_id=transaction.import_batch_id,
                        base_hash=transaction.base_hash
                    )
                    
                    try:
                        session.add(transaction_model)
                        session.commit()
                        records_added += 1
                        print(f"🔍   ✅ Saved with ID: {transaction_model.id}")
                        
                        # Update domain entity with generated ID
                        transaction.id = transaction_model.id
                        
                        # Track which month and category were affected
                        month = transaction.month_str
                        category = transaction.category
                        
                        if month not in affected_data:
                            affected_data[month] = set()
                        affected_data[month].add(category)
                        
                    except IntegrityError as e:
                        print(f"🔍   ❌ IntegrityError saving transaction: {str(e)}")
                        session.rollback()
                        duplicate_hashes.append(transaction.base_hash)
                    except Exception as e:
                        print(f"🔍   ❌ Error saving transaction: {str(e)}")
                        session.rollback()
                        raise e
                else:
                    print("🔍   ❌ Marked as duplicate")
                    # Mark as duplicate
                    duplicate_hashes.append(transaction.base_hash)
                    
        except Exception as e:
            print(f"🔍 ❌ Error in save_many: {str(e)}")
            session.rollback()
            import traceback
            traceback.print_exc()
            raise e
        finally:
            session.close()

        print(f"🔍 save_many complete: {records_added} saved, {len(duplicate_hashes)} duplicates")
        print(f"🔍 affected_data: {affected_data}")
        return records_added, affected_data, duplicate_hashes

    def update(self, transaction_id: int, updates: Dict[str, any]) -> Tuple[Transaction, Set[str]]:
        """
        Update a transaction by ID with new hash logic.
        """
        session = get_db_session()
        
        try:
            existing_tx = self.find_by_id(transaction_id)
            if not existing_tx:
                raise ValueError(f"Transaction with ID {transaction_id} not found")
            
            affected_months = set()
            affected_months.add(existing_tx.month_str)
            
            updated_data = {
                'date': updates.get('date', existing_tx.date),
                'description': updates.get('description', existing_tx.description),
                'amount': updates.get('amount', existing_tx.amount),
                'category': updates.get('category', existing_tx.category),
                'source': updates.get('source', existing_tx.source),
            }
            
            new_date = updated_data['date']
            if isinstance(new_date, str):
                new_date = pd.to_datetime(new_date).date()
            
            new_month_str = new_date.strftime('%Y-%m')
            if new_month_str != existing_tx.month_str:
                affected_months.add(new_month_str)
            
            # Generate new base hash and transaction hash
            new_base_hash = Transaction.create_base_hash(
                updated_data['date'],
                updated_data['description'], 
                updated_data['amount'],
                updated_data['source']
            )
            
            # For updated transactions, use base_hash as transaction_hash (manual-style)
            new_hash = new_base_hash
            
            # Check for duplicate hash (excluding the current transaction)
            duplicate_check_query = text("""
            SELECT id FROM transactions 
            WHERE transaction_hash = :hash AND id != :current_id
            """)
            
            duplicate_result = session.execute(duplicate_check_query, {
                "hash": new_hash,
                "current_id": transaction_id
            }).fetchone()
            
            if duplicate_result:
                raise ValueError("Updated transaction would create a duplicate")
            
            # Update the transaction in database
            update_query = text("""
            UPDATE transactions 
            SET date = :date,
                description = :description,
                amount = :amount,
                category = :category,
                source = :source,
                month = :month_str,
                transaction_hash = :hash,
                base_hash = :base_hash
            WHERE id = :id
            """)
            
            session.execute(update_query, {
                "date": new_date.isoformat(),
                "description": updated_data['description'],
                "amount": float(updated_data['amount']),
                "category": updated_data['category'],
                "source": updated_data['source'],
                "month_str": new_month_str,
                "hash": new_hash,
                "base_hash": new_base_hash,
                "id": transaction_id
            })
            
            session.commit()
            
            # Create updated domain entity
            updated_transaction = Transaction(
                id=transaction_id,
                date=new_date,
                description=updated_data['description'],
                amount=updated_data['amount'],
                category=updated_data['category'],
                source=updated_data['source'],
                transaction_hash=new_hash,
                month_str=new_month_str,
                base_hash=new_base_hash
            )
            
            return updated_transaction, affected_months
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
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
    
    def find_by_base_hash_and_rank(self, base_hash: str, rank: int) -> Optional[Transaction]:
        """
        Find existing transaction with same base_hash and rank from any import timestamp.
        Used for duplicate detection.
        """
        session = get_db_session()
        
        try:
            query = text("""
            SELECT * FROM transactions
            WHERE base_hash = :base_hash AND rank_within_batch = :rank
            """)
            
            result = session.execute(query, {
                "base_hash": base_hash,
                "rank": rank
            }).fetchone()
            
            if not result:
                return None
            
            return self._create_transaction_from_row(result)
        finally:
            session.close()

    def assign_ranks_within_batch(self, transactions: List[Transaction], import_batch_id: str, import_timestamp: datetime):
        """
        Assign ranks to transactions within the same batch based on base_hash groups.
        """
        from collections import defaultdict
        
        print(f"🔍 assign_ranks_within_batch called with {len(transactions)} transactions")
        
        # Group transactions by base_hash
        base_hash_groups = defaultdict(list)
        
        for transaction in transactions:
            # Ensure base_hash is set
            if not transaction.base_hash:
                transaction.base_hash = Transaction.create_base_hash(
                    transaction.date, transaction.description, transaction.amount, transaction.source
                )
                print(f"🔍 Generated base_hash: {transaction.base_hash} for {transaction.description[:30]}")
            
            base_hash_groups[transaction.base_hash].append(transaction)
        
        print(f"🔍 Created {len(base_hash_groups)} base_hash groups:")
        for base_hash, tx_group in base_hash_groups.items():
            print(f"🔍   {base_hash}: {len(tx_group)} transactions")
        
        # Assign ranks within each group
        for base_hash, tx_group in base_hash_groups.items():
            print(f"🔍 Assigning ranks for base_hash {base_hash}:")
            for rank, transaction in enumerate(tx_group, 1):
                transaction.rank_within_batch = rank
                transaction.import_batch_id = import_batch_id
                transaction.import_timestamp = import_timestamp
                # Generate full hash with rank and batch info
                transaction.generate_full_hash()
                print(f"🔍   Rank {rank}: {transaction.description[:30]} -> hash: {transaction.transaction_hash}")

    def is_duplicate(self, transaction: Transaction) -> bool:
        """
        Check if transaction is a duplicate using timestamp-based detection.
        UPDATED: Uses import_timestamp for more precise duplicate detection.
        Returns True if this transaction appears to be a re-upload.
        """
        print(f"🔍 Checking duplicate for: base_hash={transaction.base_hash}, rank={transaction.rank_within_batch}")
        
        if not transaction.base_hash or not transaction.rank_within_batch:
            print(f"🔍 Missing data - base_hash: {transaction.base_hash}, rank: {transaction.rank_within_batch}")
            return False
        
        existing = self.find_by_base_hash_and_rank(
            transaction.base_hash, 
            transaction.rank_within_batch
        )
        
        if existing:
            print(f"🔍 Found existing: import_timestamp={existing.import_timestamp} vs new={transaction.import_timestamp}")
            
            # UPDATED LOGIC: Different timestamps = different uploads = duplicate
            if existing.import_timestamp != transaction.import_timestamp:
                print(f"🔍 DUPLICATE DETECTED! (different upload timestamps)")
                return True
            else:
                print(f"🔍 Same timestamp - part of same upload batch")
                return False
        else:
            print(f"🔍 No existing transaction found")
        
        return False