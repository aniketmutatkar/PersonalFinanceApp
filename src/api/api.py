"""
Placeholder for future API implementation using FastAPI.
This will serve as the connector to the React frontend.
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import List, Dict, Optional
from datetime import date
import os

# When implementing the API, we would import these
# from src.repositories.transaction_repository import TransactionRepository
# from src.repositories.monthly_summary_repository import MonthlySummaryRepository
# from src.services.import_service import ImportService
# from src.services.reporting_service import ReportingService
# from src.config.config_manager import ConfigManager


# This is just a placeholder - to be implemented in Phase 3
app = FastAPI(title="Finance Tracker API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """API root endpoint"""
    return {"message": "Finance Tracker API"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Example endpoints to be implemented:

@app.get("/transactions")
async def get_transactions(
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    month: Optional[str] = None
):
    """
    Get transactions with optional filters.
    
    This would use the TransactionRepository to fetch transactions.
    """
    return {"message": "Not implemented yet"}


@app.get("/monthly-summaries")
async def get_monthly_summaries(year: Optional[int] = None):
    """
    Get monthly summaries with optional year filter.
    
    This would use the MonthlySummaryRepository to fetch summaries.
    """
    return {"message": "Not implemented yet"}


@app.post("/upload-file")
async def upload_transaction_file(file: UploadFile = File(...)):
    """
    Upload and process a transaction file.
    
    This would use the ImportService to process the file.
    """
    return {"message": "Not implemented yet"}


@app.get("/categories")
async def get_categories():
    """
    Get all available categories.
    
    This would use the ConfigManager to fetch categories.
    """
    return {"message": "Not implemented yet"}


# When implementing the API for real, we would add:
# 1. Dependency injection for services and repositories
# 2. Proper error handling
# 3. Request/response models using Pydantic
# 4. Authentication if needed
# 5. Additional endpoints for all functionality