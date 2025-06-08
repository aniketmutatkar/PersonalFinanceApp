# src/repositories/portfolio_repository.py

from typing import List, Dict, Set, Tuple, Optional
from datetime import date
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from src.models.portfolio_models import (
    InvestmentAccount, PortfolioBalance, StatementUpload, 
    AccountType, DataSource
)
from database import (
    get_db_session, InvestmentAccountModel, 
    PortfolioBalanceModel, StatementUploadModel
)


class PortfolioRepository:
    """Repository for portfolio database operations"""
    
    def get_account_by_name(self, account_name: str) -> Optional[InvestmentAccount]:
        """Find an investment account by name"""
        session = get_db_session()
        
        try:
            account_model = session.query(InvestmentAccountModel).filter(
                InvestmentAccountModel.account_name == account_name
            ).first()
            
            if not account_model:
                return None
            
            return self._map_account_to_domain(account_model)
        finally:
            session.close()
    
    def get_account_by_id(self, account_id: int) -> Optional[InvestmentAccount]:
        """Find an investment account by ID"""
        session = get_db_session()
        
        try:
            account_model = session.query(InvestmentAccountModel).filter(
                InvestmentAccountModel.id == account_id
            ).first()
            
            if not account_model:
                return None
            
            return self._map_account_to_domain(account_model)
        finally:
            session.close()
    
    def get_all_accounts(self, active_only: bool = True) -> List[InvestmentAccount]:
        """Get all investment accounts"""
        session = get_db_session()
        
        try:
            query = session.query(InvestmentAccountModel)
            if active_only:
                query = query.filter(InvestmentAccountModel.is_active == True)
            
            account_models = query.all()
            
            return [self._map_account_to_domain(model) for model in account_models]
        finally:
            session.close()
    
    def get_balances_for_account(
        self, 
        account_id: int, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> List[PortfolioBalance]:
        """Get balance history for a specific account"""
        session = get_db_session()
        
        try:
            query = session.query(PortfolioBalanceModel).filter(
                PortfolioBalanceModel.account_id == account_id
            )
            
            if start_date:
                query = query.filter(PortfolioBalanceModel.balance_date >= start_date)
            if end_date:
                query = query.filter(PortfolioBalanceModel.balance_date <= end_date)
            
            query = query.order_by(PortfolioBalanceModel.balance_date)
            balance_models = query.all()
            
            return [self._map_balance_to_domain(model) for model in balance_models]
        finally:
            session.close()
    
    def get_latest_balances(self) -> Dict[int, PortfolioBalance]:
        """Get the latest balance for each account"""
        session = get_db_session()
        
        try:
            # Get latest balance date for each account
            latest_balances_query = text("""
            SELECT account_id, MAX(balance_date) as latest_date
            FROM portfolio_balances 
            GROUP BY account_id
            """)
            
            latest_dates = session.execute(latest_balances_query).fetchall()
            
            result = {}
            for account_id, latest_date in latest_dates:
                balance_model = session.query(PortfolioBalanceModel).filter(
                    PortfolioBalanceModel.account_id == account_id,
                    PortfolioBalanceModel.balance_date == latest_date
                ).first()
                
                if balance_model:
                    result[account_id] = self._map_balance_to_domain(balance_model)
            
            return result
        finally:
            session.close()
    
    def save_balance(self, balance: PortfolioBalance) -> PortfolioBalance:
        """Save a portfolio balance (insert or update)"""
        session = get_db_session()
        
        try:
            # Check if balance already exists for this account and date
            existing = session.query(PortfolioBalanceModel).filter(
                PortfolioBalanceModel.account_id == balance.account_id,
                PortfolioBalanceModel.balance_date == balance.balance_date
            ).first()
            
            if existing:
                # Update existing balance
                existing.balance_amount = float(balance.balance_amount)
                existing.data_source = balance.data_source.value
                existing.confidence_score = float(balance.confidence_score)
                existing.notes = balance.notes
                
                session.commit()
                balance.id = existing.id
            else:
                # Insert new balance
                balance_model = PortfolioBalanceModel(
                    account_id=balance.account_id,
                    balance_date=balance.balance_date,
                    balance_amount=float(balance.balance_amount),
                    data_source=balance.data_source.value,
                    confidence_score=float(balance.confidence_score),
                    notes=balance.notes
                )
                
                session.add(balance_model)
                session.commit()
                balance.id = balance_model.id
            
            return balance
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def bulk_insert_balances(self, balances: List[PortfolioBalance]) -> int:
        """Bulk insert portfolio balances, skipping duplicates"""
        if not balances:
            return 0
        
        session = get_db_session()
        records_inserted = 0
        
        try:
            for balance in balances:
                try:
                    # Check if balance already exists
                    existing = session.query(PortfolioBalanceModel).filter(
                        PortfolioBalanceModel.account_id == balance.account_id,
                        PortfolioBalanceModel.balance_date == balance.balance_date
                    ).first()
                    
                    if not existing:
                        balance_model = PortfolioBalanceModel(
                            account_id=balance.account_id,
                            balance_date=balance.balance_date,
                            balance_amount=float(balance.balance_amount),
                            data_source=balance.data_source.value,
                            confidence_score=float(balance.confidence_score),
                            notes=balance.notes
                        )
                        
                        session.add(balance_model)
                        session.commit()
                        records_inserted += 1
                        
                except IntegrityError:
                    # Skip duplicates
                    session.rollback()
                    continue
            
            return records_inserted
            
        finally:
            session.close()
    
    def check_balance_exists(self, account_id: int, balance_date: date) -> Optional[PortfolioBalance]:
        """Check if a balance exists for the given account and date"""
        session = get_db_session()
        
        try:
            balance_model = session.query(PortfolioBalanceModel).filter(
                PortfolioBalanceModel.account_id == account_id,
                PortfolioBalanceModel.balance_date == balance_date
            ).first()
            
            if not balance_model:
                return None
            
            return self._map_balance_to_domain(balance_model)
        finally:
            session.close()
    
    def delete_balance(self, balance_id: int) -> bool:
        """Delete a balance record (except CSV imports)"""
        session = get_db_session()
        
        try:
            balance = session.query(PortfolioBalanceModel).filter(
                PortfolioBalanceModel.id == balance_id
            ).first()
            
            if not balance:
                return False
            
            # Don't allow deletion of CSV imports
            if balance.data_source == DataSource.CSV_IMPORT.value:
                raise ValueError("Cannot delete CSV import data")
            
            session.delete(balance)
            session.commit()
            return True
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_balance_date_range(self) -> Tuple[Optional[date], Optional[date]]:
        """Get the earliest and latest balance dates across all accounts"""
        session = get_db_session()
        
        try:
            result = session.query(
                text("MIN(balance_date) as min_date, MAX(balance_date) as max_date")
            ).from_statement(
                text("SELECT MIN(balance_date) as min_date, MAX(balance_date) as max_date FROM portfolio_balances")
            ).first()
            
            return result.min_date, result.max_date
        finally:
            session.close()
    
    def _map_account_to_domain(self, model: InvestmentAccountModel) -> InvestmentAccount:
        """Map database model to domain entity"""
        return InvestmentAccount(
            id=model.id,
            account_name=model.account_name,
            institution=model.institution,
            account_type=AccountType(model.account_type),
            is_active=model.is_active,
            created_at=model.created_at.date() if model.created_at else None
        )
    
    def _map_balance_to_domain(self, model: PortfolioBalanceModel) -> PortfolioBalance:
        """Map database model to domain entity"""
        return PortfolioBalance(
            id=model.id,
            account_id=model.account_id,
            balance_date=model.balance_date,
            balance_amount=Decimal(str(model.balance_amount)),
            data_source=DataSource(model.data_source),
            confidence_score=Decimal(str(model.confidence_score)),
            notes=model.notes,
            created_at=model.created_at.date() if model.created_at else None
        )
    
    def save_statement_upload(self, statement: StatementUpload) -> StatementUpload:
        """Save statement upload record to database"""
        session = get_db_session()
        
        try:
            statement_model = StatementUploadModel(
                account_id=statement.account_id,
                statement_date=statement.statement_date,
                original_filename=statement.original_filename,
                file_path=statement.file_path,
                relevant_page_number=statement.relevant_page_number,
                page_pdf_path=statement.page_pdf_path,
                total_pages=statement.total_pages,
                raw_extracted_text=statement.raw_extracted_text[:5000] if statement.raw_extracted_text else None,  # Limit size
                extracted_balance=float(statement.extracted_balance) if statement.extracted_balance else None,
                confidence_score=float(statement.confidence_score),
                requires_review=statement.requires_review,
                reviewed_by_user=statement.reviewed_by_user,
                processing_status=statement.processing_status,
                processing_error=statement.processing_error,
                processed_timestamp=statement.processed_timestamp
            )
            
            session.add(statement_model)
            session.flush()  # Get the ID
            session.commit()
            
            # Update domain object with generated ID
            statement.id = statement_model.id
            statement.upload_timestamp = statement_model.upload_timestamp.date() if statement_model.upload_timestamp else None
            
            return statement
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_statement_upload(self, statement_id: int) -> Optional[StatementUpload]:
        """Get statement upload by ID"""
        session = get_db_session()
        
        try:
            model = session.query(StatementUploadModel).filter(
                StatementUploadModel.id == statement_id
            ).first()
            
            if not model:
                return None
            
            return StatementUpload(
                id=model.id,
                account_id=model.account_id,
                statement_date=model.statement_date,
                original_filename=model.original_filename,
                file_path=model.file_path,
                relevant_page_number=model.relevant_page_number or 1,
                page_pdf_path=model.page_pdf_path,
                total_pages=model.total_pages or 1,
                raw_extracted_text=model.raw_extracted_text,
                extracted_balance=Decimal(str(model.extracted_balance)) if model.extracted_balance else None,
                confidence_score=Decimal(str(model.confidence_score)) if model.confidence_score else Decimal('0'),
                requires_review=model.requires_review or False,
                reviewed_by_user=model.reviewed_by_user or False,
                processing_status=model.processing_status or 'pending',
                processing_error=model.processing_error,
                upload_timestamp=model.upload_timestamp.date() if model.upload_timestamp else None,
                processed_timestamp=model.processed_timestamp.date() if model.processed_timestamp else None
            )
        finally:
            session.close()
    
    def mark_statement_reviewed(self, statement_id: int, reviewed_by_user: bool = True):
        """Mark statement as reviewed"""
        session = get_db_session()
        
        try:
            statement = session.query(StatementUploadModel).filter(
                StatementUploadModel.id == statement_id
            ).first()
            
            if statement:
                statement.reviewed_by_user = reviewed_by_user
                statement.processing_status = 'saved' if reviewed_by_user else 'processed'
                session.commit()
                
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def mark_statement_processed(self, statement_id: int):
        """Mark statement as processed (after quick save)"""
        session = get_db_session()
        
        try:
            statement = session.query(StatementUploadModel).filter(
                StatementUploadModel.id == statement_id
            ).first()
            
            if statement:
                statement.processing_status = 'saved'
                session.commit()
                
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def check_filename_duplicate(self, filename: str) -> Optional[StatementUpload]:
        """Check if a file with the same name was already uploaded"""
        session = get_db_session()
        
        try:
            existing = session.query(StatementUploadModel).filter(
                StatementUploadModel.original_filename == filename
            ).first()
            
            if not existing:
                return None
            
            return StatementUpload(
                id=existing.id,
                original_filename=existing.original_filename,
                upload_timestamp=existing.upload_timestamp.date() if existing.upload_timestamp else None,
                processing_status=existing.processing_status or 'pending',
                account_id=existing.account_id
            )
        finally:
            session.close()