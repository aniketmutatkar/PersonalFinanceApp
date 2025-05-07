# src/api/routers/transactions.py

import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from typing import List, Optional
from datetime import date
import pandas as pd

from src.api.dependencies import get_transaction_repository, get_import_service, get_reporting_service
from src.api.schemas.transaction import TransactionResponse, TransactionCreate, FileUploadResponse
from src.api.utils.pagination import PaginationParams, PagedResponse
from src.api.utils.error_handling import APIError
from src.api.utils.response import ApiResponse
from src.services.import_service import ImportService
from src.services.reporting_service import ReportingService
from src.repositories.transaction_repository import TransactionRepository  # Add this import
from src.models.models import Transaction
from decimal import Decimal

router = APIRouter()

@router.get("/", response_model=PagedResponse[TransactionResponse])
async def get_transactions(
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    month: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    reporting_service: ReportingService = Depends(get_reporting_service)
):
    """
    Get transactions with optional filters and pagination
    """
    try:
        # Add debug logging
        print(f"Getting transactions with filters: category={category}, start_date={start_date}, end_date={end_date}, month={month}")
        
        transactions_df = reporting_service.get_transactions_report(
            category=category,
            start_date=start_date,
            end_date=end_date,
            month_str=month
        )
        
        # Add more debug logging
        if transactions_df is None:
            print("Reporting service returned None")
        elif transactions_df.empty:
            print("Reporting service returned empty DataFrame")
        else:
            print(f"Reporting service returned {len(transactions_df)} transactions")
            print(f"Columns: {transactions_df.columns.tolist()}")
            print(f"First few rows: {transactions_df.head().to_dict('records')}")
        
        if transactions_df is None or transactions_df.empty:
            return PagedResponse.create([], 0, pagination)
        
        # Get total count
        total_count = len(transactions_df)
        
        # Apply pagination
        paginated_df = transactions_df.iloc[pagination.offset:pagination.offset + pagination.page_size]
        
        # Convert to response models
        transactions = []
        for _, row in paginated_df.iterrows():
            # Ensure dates are properly converted to date objects
            tx_date = row['date']
            if isinstance(tx_date, str):
                tx_date = pd.to_datetime(tx_date).date()
                
            transaction = TransactionResponse(
                id=row.get('id'),
                date=tx_date,
                description=row['description'],
                amount=Decimal(str(row['amount'])),
                category=row['category'],
                source=row['source'],
                transaction_hash=row.get('transaction_hash', ''),
                month_str=row.get('month_str', tx_date.strftime('%Y-%m'))
            )
            transactions.append(transaction)
        
        return PagedResponse.create(transactions, total_count, pagination)
    except Exception as e:
        raise APIError(status_code=500, detail=str(e))

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    transaction_repo: TransactionRepository = Depends(get_transaction_repository)
):
    """
    Get a specific transaction by ID
    """
    try:
        transaction = transaction_repo.find_by_id(transaction_id)
        
        if not transaction:
            raise APIError(
                status_code=404, 
                detail=f"Transaction with ID {transaction_id} not found",
                error_code="TRANSACTION_NOT_FOUND"
            )
        
        return TransactionResponse(
            id=transaction.id,
            date=transaction.date,
            description=transaction.description,
            amount=transaction.amount,
            category=transaction.category,
            source=transaction.source,
            transaction_hash=transaction.transaction_hash,
            month_str=transaction.month_str
        )
    except APIError:
        raise
    except Exception as e:
        raise APIError(status_code=500, detail=str(e))

@router.post("/upload", response_model=ApiResponse[FileUploadResponse])
async def upload_file(
    file: UploadFile = File(...),
    import_service: ImportService = Depends(get_import_service)
):
    """
    Upload and process a transaction file
    """
    try:
        # Create a temporary file to store the upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            # Write the uploaded file content
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Process the file with original filename
            df = import_service.process_bank_file(temp_file_path, original_filename=file.filename)
            
            if df is None or df.empty:
                response_data = FileUploadResponse(
                    message="No new transactions found",
                    transactions_count=0,
                    categories=[]
                )
                
                return ApiResponse.success(
                    data=response_data,
                    message="File processed but no new transactions found",
                    meta={"filename": file.filename}
                )
            
            # Return the response
            response_data = FileUploadResponse(
                message="File processed successfully",
                transactions_count=len(df),
                categories=df["Category"].unique().tolist() if "Category" in df.columns else []
            )
            
            return ApiResponse.success(
                data=response_data,
                message="File uploaded and processed successfully",
                meta={"filename": file.filename, "content_type": file.content_type}
            )
        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path)
    except Exception as e:
        raise APIError(status_code=500, detail=str(e))

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    transaction_repo: TransactionRepository = Depends(get_transaction_repository)
):
    """
    Create a new transaction manually
    """
    try:
        # Create transaction hash
        tx_hash = Transaction.create_hash(
            transaction.date,
            transaction.description,
            transaction.amount,
            transaction.source
        )
        
        # Create domain model
        tx = Transaction(
            date=transaction.date,
            description=transaction.description,
            amount=transaction.amount,
            category=transaction.category,
            source=transaction.source,
            transaction_hash=tx_hash
        )
        
        # Save to repository
        saved_tx = transaction_repo.save(tx)
        
        # Return response
        return TransactionResponse(
            id=saved_tx.id,
            date=saved_tx.date,
            description=saved_tx.description,
            amount=saved_tx.amount,
            category=saved_tx.category,
            source=saved_tx.source,
            transaction_hash=saved_tx.transaction_hash,
            month_str=saved_tx.month_str
        )
    except ValueError as e:
        # Handle duplicate transaction error
        if "already exists" in str(e):
            raise APIError(
                status_code=409,
                detail="Transaction already exists",
                error_code="DUPLICATE_TRANSACTION"
            )
        raise APIError(status_code=400, detail=str(e))
    except Exception as e:
        raise APIError(status_code=500, detail=str(e))