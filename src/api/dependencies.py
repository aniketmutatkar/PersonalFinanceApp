# src/api/dependencies.py

from fastapi import Depends
from typing import Generator

from src.repositories.transaction_repository import TransactionRepository
from src.repositories.monthly_summary_repository import MonthlySummaryRepository
from src.services.import_service import ImportService
from src.services.reporting_service import ReportingService
from src.config.config_manager import ConfigManager
from database import get_db_session

# Database session dependency
def get_db():
    """
    Get a database session and ensure it's closed after the request.
    This provides a request-scoped database session.
    """
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()

# Repository dependencies
def get_config_manager():
    """Get the configuration manager"""
    return ConfigManager()

def get_transaction_repository():
    """Get the transaction repository"""
    return TransactionRepository()

def get_monthly_summary_repository():
    """Get the monthly summary repository"""
    return MonthlySummaryRepository()

# Service dependencies
def get_import_service(
    transaction_repo: TransactionRepository = Depends(get_transaction_repository),
    monthly_summary_repo: MonthlySummaryRepository = Depends(get_monthly_summary_repository),
    config: ConfigManager = Depends(get_config_manager)
):
    """Get the import service with its dependencies"""
    return ImportService(transaction_repo, monthly_summary_repo, config)

def get_reporting_service(
    transaction_repo: TransactionRepository = Depends(get_transaction_repository),
    monthly_summary_repo: MonthlySummaryRepository = Depends(get_monthly_summary_repository)
):
    """Get the reporting service with its dependencies"""
    return ReportingService(transaction_repo, monthly_summary_repo)