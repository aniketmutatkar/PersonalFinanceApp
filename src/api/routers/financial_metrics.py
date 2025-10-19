# src/api/routers/financial_metrics.py

from fastapi import APIRouter, Depends, Query
from typing import Dict, List

from src.api.dependencies import get_financial_metrics_service
from src.services.financial_metrics_service import FinancialMetricsService

router = APIRouter()

@router.get("/runway")
async def get_financial_runway(
    metrics_service: FinancialMetricsService = Depends(get_financial_metrics_service)
) -> Dict:
    """Get financial runway metrics (months of expenses covered by liquid assets)"""
    return metrics_service.calculate_financial_runway()

@router.get("/net-worth")
async def get_net_worth(
    metrics_service: FinancialMetricsService = Depends(get_financial_metrics_service)
) -> Dict:
    """Get net worth breakdown (liquid + investment assets)"""
    return metrics_service.calculate_net_worth()

@router.get("/overview")
async def get_financial_metrics_overview(
    metrics_service: FinancialMetricsService = Depends(get_financial_metrics_service)
) -> Dict:
    """Get comprehensive financial metrics overview"""
    runway = metrics_service.calculate_financial_runway()
    net_worth = metrics_service.calculate_net_worth()

    return {
        "runway": runway,
        "net_worth": net_worth,
        "summary": {
            "total_net_worth": net_worth["total_net_worth"],
            "liquid_assets": net_worth["liquid_assets"],
            "runway_months": runway["runway_months"],
            "runway_status": runway["runway_status"],
            "liquidity_status": net_worth["liquidity_status"]
        }
    }

@router.get("/net-worth/history")
async def get_historical_net_worth(
    period: str = Query(default="2y", regex="^(6m|1y|2y|all)$"),
    metrics_service: FinancialMetricsService = Depends(get_financial_metrics_service)
) -> List[Dict]:
    """
    Get historical net worth data with REAL bank balances (not fabricated).

    Returns monthly data points combining:
    - Real bank balance data from bank_balances table
    - Real portfolio values from portfolio_balances table
    - Wealthfront Cash (counted as liquid)
    - Investment assets (portfolio excluding Wealthfront Cash)

    Args:
        period: Time period ("6m", "1y", "2y", "all")

    Returns:
        List of monthly data points with real values
    """
    return metrics_service.get_historical_net_worth(period=period)