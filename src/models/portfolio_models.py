"""
Portfolio domain models for the Finance Tracker application.
"""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Optional, Dict, List
from enum import Enum


class AccountType(Enum):
    """Investment account types"""
    BROKERAGE = "brokerage"
    ROTH_IRA = "roth_ira"
    FOUR_O_ONE_K = "401k"
    CASH = "cash"


class DataSource(Enum):
    """Data source types for balance entries"""
    CSV_IMPORT = "csv_import"
    MANUAL = "manual"
    PDF_STATEMENT = "pdf_statement"


@dataclass
class InvestmentAccount:
    """Represents an investment account"""
    account_name: str
    institution: str
    account_type: AccountType
    is_active: bool = True
    id: Optional[int] = None
    created_at: Optional[date] = None
    
    def __post_init__(self):
        """Convert string account_type to enum if needed"""
        if isinstance(self.account_type, str):
            self.account_type = AccountType(self.account_type)


@dataclass
class PortfolioBalance:
    """Represents a portfolio balance entry"""
    account_id: int
    balance_date: date
    balance_amount: Decimal
    data_source: DataSource
    confidence_score: Decimal = Decimal('1.0')
    notes: Optional[str] = None
    id: Optional[int] = None
    created_at: Optional[date] = None
    
    def __post_init__(self):
        """Convert string data_source to enum if needed"""
        if isinstance(self.data_source, str):
            self.data_source = DataSource(self.data_source)
        
        # Ensure balance_amount is Decimal
        if not isinstance(self.balance_amount, Decimal):
            self.balance_amount = Decimal(str(self.balance_amount))
        
        # Ensure confidence_score is Decimal
        if not isinstance(self.confidence_score, Decimal):
            self.confidence_score = Decimal(str(self.confidence_score))


@dataclass
class AccountPerformance:
    """Performance metrics for an investment account"""
    account_id: int
    account_name: str
    institution: str
    account_type: AccountType
    start_balance: Decimal
    end_balance: Decimal
    net_deposits: Decimal
    actual_growth: Decimal
    growth_percentage: Decimal
    annualized_return: Decimal
    period_months: int
    
    def __post_init__(self):
        """Ensure all monetary values are Decimal"""
        decimal_fields = [
            'start_balance', 'end_balance', 'net_deposits', 
            'actual_growth', 'growth_percentage', 'annualized_return'
        ]
        for field_name in decimal_fields:
            value = getattr(self, field_name)
            if not isinstance(value, Decimal):
                setattr(self, field_name, Decimal(str(value)))


@dataclass
class InstitutionSummary:
    """Summary of accounts by institution"""
    institution: str
    total_balance: Decimal
    total_growth: Decimal
    growth_percentage: Decimal
    account_count: int
    account_names: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Ensure all monetary values are Decimal"""
        decimal_fields = ['total_balance', 'total_growth', 'growth_percentage']
        for field_name in decimal_fields:
            value = getattr(self, field_name)
            if not isinstance(value, Decimal):
                setattr(self, field_name, Decimal(str(value)))


@dataclass
class AccountTypeSummary:
    """Summary of accounts by type"""
    account_type: AccountType
    total_balance: Decimal
    total_growth: Decimal
    growth_percentage: Decimal
    account_count: int
    account_names: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Ensure all monetary values are Decimal and account_type is enum"""
        if isinstance(self.account_type, str):
            self.account_type = AccountType(self.account_type)
        
        decimal_fields = ['total_balance', 'total_growth', 'growth_percentage']
        for field_name in decimal_fields:
            value = getattr(self, field_name)
            if not isinstance(value, Decimal):
                setattr(self, field_name, Decimal(str(value)))


@dataclass
class PortfolioOverview:
    """Complete portfolio overview"""
    total_portfolio_value: Decimal
    total_deposits: Decimal
    total_growth: Decimal
    growth_percentage: Decimal
    accounts: List[AccountPerformance] = field(default_factory=list)
    by_institution: List[InstitutionSummary] = field(default_factory=list)
    by_account_type: List[AccountTypeSummary] = field(default_factory=list)
    as_of_date: Optional[date] = None
    
    def __post_init__(self):
        """Ensure all monetary values are Decimal"""
        decimal_fields = ['total_portfolio_value', 'total_deposits', 'total_growth', 'growth_percentage']
        for field_name in decimal_fields:
            value = getattr(self, field_name)
            if not isinstance(value, Decimal):
                setattr(self, field_name, Decimal(str(value)))


@dataclass
class PortfolioTrends:
    """Portfolio trends over time"""
    monthly_values: List[Dict] = field(default_factory=list)
    growth_attribution: Dict[str, Decimal] = field(default_factory=dict)
    best_month: Optional[Dict] = None
    worst_month: Optional[Dict] = None
    
    def __post_init__(self):
        """Ensure growth_attribution values are Decimal"""
        for key, value in self.growth_attribution.items():
            if not isinstance(value, Decimal):
                self.growth_attribution[key] = Decimal(str(value))


@dataclass
class StatementUpload:
    """Represents an uploaded statement for OCR processing"""
    account_id: int
    statement_date: date
    original_filename: str
    file_path: Optional[str] = None
    raw_extracted_text: Optional[str] = None
    extracted_balance: Optional[Decimal] = None
    confidence_score: Decimal = Decimal('0.0')
    requires_review: bool = False
    reviewed_by_user: bool = False
    id: Optional[int] = None
    upload_timestamp: Optional[date] = None
    
    def __post_init__(self):
        """Ensure extracted_balance and confidence_score are Decimal"""
        if self.extracted_balance is not None and not isinstance(self.extracted_balance, Decimal):
            self.extracted_balance = Decimal(str(self.extracted_balance))
        
        if not isinstance(self.confidence_score, Decimal):
            self.confidence_score = Decimal(str(self.confidence_score))


# Account name mapping for transaction integration
ACCOUNT_TRANSACTION_MAPPING = {
    'Wealthfront Investment': ['Wealthfront'],
    'Schwab Brokerage': ['Schwab'],
    'Acorns': ['Acorns'],
    'Robinhood': ['Robinhood'],
    'Roth IRA': ['Schwab'],  # Subset of Schwab transactions - will be imperfect
    'Wealthfront Cash': ['Wealthfront'],  # Subset of Wealthfront transactions - will be imperfect
    '401(k) Plan': []  # No transaction mapping available
}

# Investment categories from transaction system
INVESTMENT_TRANSACTION_CATEGORIES = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab']