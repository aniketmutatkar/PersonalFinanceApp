# src/api/routers/portfolio.py

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict
from datetime import date
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, validator
from typing import Optional, Dict, Union
from src.models.portfolio_models import PortfolioBalance, DataSource

from src.api.dependencies import get_portfolio_service, get_portfolio_repository
from src.services.portfolio_service import PortfolioService
from src.repositories.portfolio_repository import PortfolioRepository

router = APIRouter()

# Response Models
from pydantic import BaseModel
from typing import Union

class AccountPerformanceResponse(BaseModel):
    account_id: int
    account_name: str
    institution: str
    account_type: str
    start_balance: float
    end_balance: float
    net_deposits: float
    actual_growth: float
    growth_percentage: float
    annualized_return: float
    period_months: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "account_id": 1,
                "account_name": "401(k) Plan",
                "institution": "ADP",
                "account_type": "401k",
                "start_balance": 200.01,
                "end_balance": 15000.00,
                "net_deposits": 12000.00,
                "actual_growth": 2800.00,
                "growth_percentage": 23.33,
                "annualized_return": 8.5,
                "period_months": 48
            }
        }

class InstitutionSummaryResponse(BaseModel):
    institution: str
    total_balance: float
    total_growth: float
    growth_percentage: float
    account_count: int
    account_names: List[str]

class AccountTypeSummaryResponse(BaseModel):
    account_type: str
    total_balance: float
    total_growth: float
    growth_percentage: float
    account_count: int
    account_names: List[str]

class PortfolioOverviewResponse(BaseModel):
    total_portfolio_value: float
    total_deposits: float
    total_growth: float
    growth_percentage: float
    accounts: List[AccountPerformanceResponse]
    by_institution: List[InstitutionSummaryResponse]
    by_account_type: List[AccountTypeSummaryResponse]
    as_of_date: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_portfolio_value": 95000.00,
                "total_deposits": 80000.00,
                "total_growth": 15000.00,
                "growth_percentage": 18.75,
                "accounts": [],
                "by_institution": [],
                "by_account_type": [],
                "as_of_date": "2024-06-06"
            }
        }

class PortfolioTrendsResponse(BaseModel):
    monthly_values: List[Dict]
    growth_attribution: Dict[str, float]
    best_month: Optional[Dict]
    worst_month: Optional[Dict]
    
    class Config:
        json_schema_extra = {
            "example": {
                "monthly_values": [
                    {
                        "date": "2024-01-01",
                        "month_display": "Jan 2024",
                        "total_value": 90000.00,
                        "wealthfront_investment": 25000.00,
                        "schwab_brokerage": 30000.00
                    }
                ],
                "growth_attribution": {},
                "best_month": {
                    "month_display": "May 2024",
                    "total_value": 95000.00
                },
                "worst_month": {
                    "month_display": "Jan 2024", 
                    "total_value": 85000.00
                }
            }
        }

class AccountListResponse(BaseModel):
    accounts: List[Dict]
    total_accounts: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "accounts": [
                    {
                        "id": 1,
                        "account_name": "Wealthfront Investment",
                        "institution": "Wealthfront",
                        "account_type": "brokerage",
                        "is_active": True
                    }
                ],
                "total_accounts": 7
            }
        }

class ManualBalanceRequest(BaseModel):
    account_id: int
    balance_date: str  # YYYY-MM-DD format
    balance_amount: float
    notes: Optional[str] = None
    
    @validator('balance_amount')
    def validate_amount(cls, v):
        if v < 0:
            raise ValueError('Balance amount cannot be negative')
        return v
    
    @validator('balance_date')
    def validate_date(cls, v):
        try:
            balance_date = datetime.strptime(v, '%Y-%m-%d').date()
            if balance_date > date.today():
                raise ValueError('Balance date cannot be in the future')
            return v
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')

class BalanceConflictResponse(BaseModel):
    has_conflict: bool
    existing_balance: Optional[Dict] = None
    conflict_type: Optional[str] = None  # "csv_import", "manual", "pdf_statement"
    message: Optional[str] = None

class ManualBalanceSuccessResponse(BaseModel):
    success: bool
    balance: Dict
    message: str


@router.get("/overview", response_model=PortfolioOverviewResponse)
async def get_portfolio_overview(
    as_of_date: Optional[date] = Query(None, description="Portfolio value as of date (YYYY-MM-DD)"),
    portfolio_service: PortfolioService = Depends(get_portfolio_service)
):
    """
    Get complete portfolio overview with real performance metrics
    
    Returns current portfolio value, growth, and performance by account, institution, and type.
    """
    try:
        overview = portfolio_service.get_portfolio_overview(as_of_date)
        
        # Convert to response format
        return PortfolioOverviewResponse(
            total_portfolio_value=float(overview.total_portfolio_value),
            total_deposits=float(overview.total_deposits),
            total_growth=float(overview.total_growth),
            growth_percentage=float(overview.growth_percentage),
            accounts=[
                AccountPerformanceResponse(
                    account_id=acc.account_id,
                    account_name=acc.account_name,
                    institution=acc.institution,
                    account_type=acc.account_type.value,
                    start_balance=float(acc.start_balance),
                    end_balance=float(acc.end_balance),
                    net_deposits=float(acc.net_deposits),
                    actual_growth=float(acc.actual_growth),
                    growth_percentage=float(acc.growth_percentage),
                    annualized_return=float(acc.annualized_return),
                    period_months=acc.period_months
                ) for acc in overview.accounts
            ],
            by_institution=[
                InstitutionSummaryResponse(
                    institution=inst.institution,
                    total_balance=float(inst.total_balance),
                    total_growth=float(inst.total_growth),
                    growth_percentage=float(inst.growth_percentage),
                    account_count=inst.account_count,
                    account_names=inst.account_names
                ) for inst in overview.by_institution
            ],
            by_account_type=[
                AccountTypeSummaryResponse(
                    account_type=acc_type.account_type.value,
                    total_balance=float(acc_type.total_balance),
                    total_growth=float(acc_type.total_growth),
                    growth_percentage=float(acc_type.growth_percentage),
                    account_count=acc_type.account_count,
                    account_names=acc_type.account_names
                ) for acc_type in overview.by_account_type
            ],
            as_of_date=overview.as_of_date.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating portfolio overview: {str(e)}")


@router.get("/performance/{account_id}", response_model=AccountPerformanceResponse)
async def get_account_performance(
    account_id: int,
    period: str = Query("1y", description="Time period: 1y, 2y, 5y, all"),
    portfolio_service: PortfolioService = Depends(get_portfolio_service)
):
    """
    Get detailed performance metrics for a specific account
    
    Returns ROI, growth attribution, and performance over the specified period.
    """
    try:
        # Calculate date range
        end_date = date.today()
        if period == "1y":
            start_date = date(end_date.year - 1, end_date.month, end_date.day)
        elif period == "2y":
            start_date = date(end_date.year - 2, end_date.month, end_date.day)
        elif period == "5y":
            start_date = date(end_date.year - 5, end_date.month, end_date.day)
        else:  # "all"
            start_date = date(2020, 1, 1)
        
        performance = portfolio_service.calculate_account_performance(
            account_id, start_date, end_date
        )
        
        if not performance:
            raise HTTPException(
                status_code=404, 
                detail=f"No performance data found for account {account_id}"
            )
        
        return AccountPerformanceResponse(
            account_id=performance.account_id,
            account_name=performance.account_name,
            institution=performance.institution,
            account_type=performance.account_type.value,
            start_balance=float(performance.start_balance),
            end_balance=float(performance.end_balance),
            net_deposits=float(performance.net_deposits),
            actual_growth=float(performance.actual_growth),
            growth_percentage=float(performance.growth_percentage),
            annualized_return=float(performance.annualized_return),
            period_months=performance.period_months
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating account performance: {str(e)}")


@router.get("/trends", response_model=PortfolioTrendsResponse)
async def get_portfolio_trends(
    period: str = Query("1y", description="Time period: 1y, 2y, 5y, all"),
    portfolio_service: PortfolioService = Depends(get_portfolio_service)
):
    """
    Get portfolio value trends over time
    
    Returns monthly portfolio values and growth attribution data for charting.
    """
    try:
        trends = portfolio_service.get_portfolio_trends(period)
        
        return PortfolioTrendsResponse(
            monthly_values=trends.monthly_values,
            growth_attribution={k: float(v) for k, v in trends.growth_attribution.items()},
            best_month=trends.best_month,
            worst_month=trends.worst_month
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating portfolio trends: {str(e)}")


@router.get("/accounts", response_model=AccountListResponse)
async def get_all_accounts(
    active_only: bool = Query(True, description="Return only active accounts"),
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository)
):
    """
    Get list of all investment accounts
    
    Returns account details including name, institution, and type.
    """
    try:
        accounts = portfolio_repo.get_all_accounts(active_only=active_only)
        
        account_data = []
        for account in accounts:
            account_data.append({
                "id": account.id,
                "account_name": account.account_name,
                "institution": account.institution,
                "account_type": account.account_type.value,
                "is_active": account.is_active
            })
        
        return AccountListResponse(
            accounts=account_data,
            total_accounts=len(account_data)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving accounts: {str(e)}")


@router.get("/institutions")
async def get_institution_breakdown(
    portfolio_service: PortfolioService = Depends(get_portfolio_service)
):
    """
    Get performance breakdown by institution
    
    Returns aggregated performance data grouped by financial institution.
    """
    try:
        overview = portfolio_service.get_portfolio_overview()
        
        return {
            "institutions": [
                {
                    "institution": inst.institution,
                    "total_balance": float(inst.total_balance),
                    "total_growth": float(inst.total_growth),
                    "growth_percentage": float(inst.growth_percentage),
                    "account_count": inst.account_count,
                    "account_names": inst.account_names
                } for inst in overview.by_institution
            ],
            "total_institutions": len(overview.by_institution)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating institution breakdown: {str(e)}")
    
@router.post("/balances")
async def add_manual_balance(
    balance_request: ManualBalanceRequest,
    force_override: bool = Query(False, description="Force override existing balance"),
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository)
):
    """
    Add manual balance entry with duplicate detection and conflict resolution
    """
    try:
        # Convert string date to date object
        balance_date = datetime.strptime(balance_request.balance_date, '%Y-%m-%d').date()
        
        # Check if account exists
        account = portfolio_repo.get_account_by_id(balance_request.account_id)
        if not account:
            raise HTTPException(status_code=404, detail=f"Account {balance_request.account_id} not found")
        
        # Check for existing balance
        existing = portfolio_repo.check_balance_exists(balance_request.account_id, balance_date)
        
        if existing and not force_override:
            # Return conflict information for frontend to handle
            return BalanceConflictResponse(
                has_conflict=True,
                existing_balance={
                    "id": existing.id,
                    "balance_amount": float(existing.balance_amount),
                    "data_source": existing.data_source.value,
                    "notes": existing.notes,
                    "created_at": existing.created_at.isoformat() if existing.created_at else None
                },
                conflict_type=existing.data_source.value,
                message=f"Balance already exists for {account.account_name} on {balance_date}. "
                       f"Existing balance: ${existing.balance_amount:,.2f} ({existing.data_source.value})"
            )
        
        # Create new balance
        new_balance = PortfolioBalance(
            account_id=balance_request.account_id,
            balance_date=balance_date,
            balance_amount=Decimal(str(balance_request.balance_amount)),
            data_source=DataSource.MANUAL,
            notes=balance_request.notes
        )
        
        # Save balance (will update if exists due to repository logic)
        saved_balance = portfolio_repo.save_balance(new_balance)
        
        return ManualBalanceSuccessResponse(
            success=True,
            balance={
                "id": saved_balance.id,
                "account_id": saved_balance.account_id,
                "balance_date": saved_balance.balance_date.isoformat(),
                "balance_amount": float(saved_balance.balance_amount),
                "data_source": saved_balance.data_source.value,
                "notes": saved_balance.notes,
                "account_name": account.account_name
            },
            message=f"Successfully {'updated' if existing else 'added'} balance for {account.account_name}"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding manual balance: {str(e)}")