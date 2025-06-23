"""
Core domain models for the Finance Tracker application.
Updated to standardize date formats for consistent hashing.
"""

from dataclasses import dataclass, field
from datetime import date as Date, datetime
from decimal import Decimal
from typing import Optional, Dict, List
import hashlib
import pandas as pd


@dataclass
class Transaction:
    """Represents a financial transaction with timestamp-based duplicate detection"""
    date: Date
    description: str
    amount: Decimal
    category: str
    source: str  # e.g., 'chase', 'wells', 'citi'
    transaction_hash: str
    id: Optional[int] = None
    month_str: Optional[str] = None
    
    # UPDATED: Timestamp-based duplicate detection fields
    import_timestamp: Optional[datetime] = None  # CHANGED: When this batch was imported (exact time)
    rank_within_batch: Optional[int] = None  # 1,2,3 for same base_hash
    import_batch_id: Optional[str] = None  # UUID per upload session
    base_hash: Optional[str] = None  # Core transaction signature
    
    def __post_init__(self):
        """Initialize month string and base hash if not provided"""
        if self.month_str is None and isinstance(self.date, Date):
            self.month_str = self.date.strftime("%Y-%m")
        
        # Generate base_hash if not provided
        if self.base_hash is None:
            self.base_hash = self.create_base_hash(
                self.date, self.description, self.amount, self.source
            )
    
    @classmethod
    def create_base_hash(cls, date_str, description, amount, source):
        """
        Create base hash for duplicate detection (without rank/import info).
        Always standardizes dates to MM/dd/yyyy format regardless of input.
        """
        try:
            # Standardize the date to MM/dd/yyyy format
            if isinstance(date_str, str):
                # Parse the date string using pandas (handles multiple formats)
                parsed_date = pd.to_datetime(date_str)
                standardized_date = parsed_date.strftime('%m/%d/%Y')
            else:
                # If it's already a date object, convert to MM/dd/yyyy
                standardized_date = date_str.strftime('%m/%d/%Y')
        except Exception as e:
            # If parsing fails, use the original string (fallback)
            print(f"Warning: Could not parse date '{date_str}', using as-is. Error: {e}")
            standardized_date = str(date_str)
        
        # Create a string with key transaction data using standardized date
        hash_string = f"{standardized_date}|{description}|{amount}|{source}"
        
        # Create a hash
        return hashlib.md5(hash_string.encode()).hexdigest()[:12]  # Shortened for readability
    
    @classmethod
    def create_hash(cls, date_str, description, amount, source, rank=None, import_batch_id=None):
        """
        Create full transaction hash including rank and batch info for uniqueness.
        This replaces the old create_hash method entirely.
        """
        # Start with base hash
        base_hash = cls.create_base_hash(date_str, description, amount, source)
        
        # Add rank and batch info if provided
        if rank is not None and import_batch_id is not None:
            full_hash_string = f"{base_hash}_rank{rank}_batch{import_batch_id}"
            return hashlib.md5(full_hash_string.encode()).hexdigest()[:16]
        else:
            # For backwards compatibility or manual transactions
            return base_hash
    
    def generate_full_hash(self):
        """Generate the full transaction hash using instance data"""
        if self.rank_within_batch is not None and self.import_batch_id is not None:
            self.transaction_hash = self.create_hash(
                self.date, 
                self.description, 
                self.amount, 
                self.source,
                self.rank_within_batch,
                self.import_batch_id
            )
        else:
            # Fallback to base hash for manual transactions
            self.transaction_hash = self.base_hash
        
        return self.transaction_hash

@dataclass
class Category:
    """Represents a transaction category"""
    name: str
    keywords: List[str] = field(default_factory=list)
    budget: Optional[Decimal] = None
    
    def matches(self, description: str) -> bool:
        """Check if a transaction description matches this category"""
        description = description.lower()
        return any(keyword.lower() in description for keyword in self.keywords)
    
    @property
    def is_investment(self) -> bool:
        """Check if this is an investment category"""
        return self.name in ["Acorns", "Wealthfront", "Robinhood", "Schwab"]
    
    @property
    def is_income(self) -> bool:
        """Check if this is an income category"""
        return self.name == "Pay"
    
    @property
    def is_payment(self) -> bool:
        """Check if this is a payment category"""
        return self.name == "Payment"


@dataclass
class MonthlySummary:
    """Represents a monthly summary of finances"""
    month: str
    year: int
    month_year: str
    category_totals: Dict[str, Decimal] = field(default_factory=dict)
    investment_total: Decimal = Decimal('0')
    total: Decimal = Decimal('0')
    total_minus_invest: Decimal = Decimal('0')
    id: Optional[int] = None
    
    def calculate_totals(self, categories: Dict[str, Category]):
        """Calculate summary totals based on categories"""
        # Get investment categories
        investment_categories = [name for name, cat in categories.items() if cat.is_investment]
        
        # Calculate investment total
        self.investment_total = sum(
            self.category_totals.get(cat, Decimal('0')) 
            for cat in investment_categories
        )
        
        # Calculate total (excluding Pay and Payment)
        self.total = sum(
            self.category_totals.get(cat, Decimal('0'))
            for cat in self.category_totals.keys()
            if cat not in ["Pay", "Payment"]
        )
        
        # Calculate total minus investments
        self.total_minus_invest = self.total - self.investment_total