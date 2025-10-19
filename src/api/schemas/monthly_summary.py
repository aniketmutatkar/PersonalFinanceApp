# src/api/schemas/monthly_summary.py

from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from decimal import Decimal

class MonthlySummaryBase(BaseModel):
    month: str
    year: int
    month_year: str
    
class MonthlySummaryResponse(MonthlySummaryBase):
    id: Optional[int] = None
    category_totals: Dict[str, Decimal]
    investment_total: Decimal
    total: Decimal
    total_minus_invest: Decimal

    # New fields for detailed financial tracking
    investment_deposits: Decimal = Field(default=0, description="Money deposited into investments")
    investment_withdrawals: Decimal = Field(default=0, description="Money withdrawn from investments")
    income: Decimal = Field(default=0, description="Income from Pay category")
    net_income: Decimal = Field(default=0, description="Income + investment withdrawals")
    net_overall: Decimal = Field(default=0, description="Net income - all spending")
    net_without_investments: Decimal = Field(default=0, description="Net income - non-investment spending")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "month": "January",
                "year": 2023,
                "month_year": "January 2023",
                "category_totals": {
                    "Groceries": 350.42,
                    "Dining": 275.18,
                    "Rent": 1500.00,
                    "Utilities": 120.75
                },
                "investment_total": 500.00,
                "total": 2746.35,
                "total_minus_invest": 2246.35,
                "investment_deposits": 500.00,
                "investment_withdrawals": 0.00,
                "income": 5000.00,
                "net_income": 5000.00,
                "net_overall": 2253.65,
                "net_without_investments": 2753.65
            }
        }

class MonthlySummaryListResponse(BaseModel):
    summaries: List[MonthlySummaryResponse]
    total: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "summaries": [
                    {
                        "id": 1,
                        "month": "January",
                        "year": 2023,
                        "month_year": "January 2023",
                        "category_totals": {
                            "Groceries": 350.42,
                            "Dining": 275.18,
                            "Rent": 1500.00,
                            "Utilities": 120.75
                        },
                        "investment_total": 500.00,
                        "total": 2746.35,
                        "total_minus_invest": 2246.35,
                        "investment_deposits": 500.00,
                        "investment_withdrawals": 0.00,
                        "income": 5000.00,
                        "net_income": 5000.00,
                        "net_overall": 2253.65,
                        "net_without_investments": 2753.65
                    }
                ],
                "total": 1
            }
        }