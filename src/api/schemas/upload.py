# src/api/schemas/upload.py

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import date
from decimal import Decimal

class TransactionPreview(BaseModel):
    """Transaction that needs review"""
    temp_id: str = Field(..., description="Temporary ID for this transaction")
    date: date
    description: str
    amount: Decimal
    category: str
    source: str
    suggested_categories: List[str] = Field(default_factory=list, description="AI suggested categories")
    
    class Config:
        json_schema_extra = {
            "example": {
                "temp_id": "123e4567-e89b-12d3-a456-426614174000",
                "date": "2023-06-15",
                "description": "COSTCO WHOLESALE",
                "amount": 150.00,
                "category": "Misc",
                "source": "chase",
                "suggested_categories": ["Groceries", "Shopping"]
            }
        }

class FilePreviewResponse(BaseModel):
    """Response after file upload preview"""
    session_id: str
    total_transactions: int
    misc_transactions: List[TransactionPreview]
    requires_review: bool
    files_processed: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "total_transactions": 50,
                "misc_transactions": [
                    {
                        "temp_id": "123e4567-e89b-12d3-a456-426614174000",
                        "date": "2023-06-15",
                        "description": "COSTCO WHOLESALE",
                        "amount": 150.00,
                        "category": "Misc",
                        "source": "chase",
                        "suggested_categories": ["Groceries", "Shopping"]
                    }
                ],
                "requires_review": True,
                "files_processed": 2
            }
        }

class CategoryUpdate(BaseModel):
    """Update category for a transaction"""
    temp_id: str
    new_category: str
    
class UploadConfirmation(BaseModel):
    """Confirmation with reviewed categories"""
    session_id: str
    category_updates: List[CategoryUpdate] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "category_updates": [
                    {
                        "temp_id": "123e4567-e89b-12d3-a456-426614174000",
                        "new_category": "Groceries"
                    }
                ]
            }
        }