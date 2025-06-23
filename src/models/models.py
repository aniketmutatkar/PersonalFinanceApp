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
import uuid


@dataclass
class Transaction:
    """Represents a financial transaction"""
    # Keep ALL existing fields exactly as they are:
    date: Date
    description: str
    amount: Decimal
    category: str
    source: str
    transaction_hash: str
    id: Optional[int] = None
    month_str: Optional[str] = None
    
    # ADD these new fields:
    base_hash: str = field(init=False)  # Will be auto-generated
    rank_within_batch: int = field(default=1)
    import_date: Date = field(default_factory=lambda: datetime.now().date())
    import_batch_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    
    def __post_init__(self):
        """Initialize computed fields"""
        # Keep existing logic:
        if self.month_str is None and isinstance(self.date, Date):
            self.month_str = self.date.strftime("%Y-%m")
        
        # ADD: Generate base_hash automatically
        self.base_hash = self._create_base_hash()
        
        # If transaction_hash is empty, generate it (for new transactions)
        if not self.transaction_hash:
            self.transaction_hash = self._create_full_hash()
    
    def _create_base_hash(self) -> str:
        """Create base hash for duplicate detection: date + description + amount + source"""
        try:
            standardized_date = self.date.strftime('%m/%d/%Y')
            normalized_desc = str(self.description).strip().upper()
            normalized_amount = str(self.amount)
            normalized_source = str(self.source).strip().lower()
            
            base_data = f"{standardized_date}|{normalized_desc}|{normalized_amount}|{normalized_source}"
            return hashlib.sha256(base_data.encode()).hexdigest()[:16]
        except Exception:
            # Fallback
            fallback_data = f"{self.date}|{self.description}|{self.amount}|{self.source}"
            return hashlib.sha256(fallback_data.encode()).hexdigest()[:16]
    
    def _create_full_hash(self) -> str:
        """Create full hash for database storage: base_hash + rank + batch_id"""
        full_data = f"{self.base_hash}_rank{self.rank_within_batch}_batch{self.import_batch_id}"
        return hashlib.sha256(full_data.encode()).hexdigest()[:16]
    
    def update_ranking(self, rank: int, batch_id: str):
        """Update rank and batch ID, then regenerate full hash"""
        self.rank_within_batch = rank
        self.import_batch_id = batch_id
        self.transaction_hash = self._create_full_hash()


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