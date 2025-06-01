# src/api/routers/statistics.py

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional, Any
from decimal import Decimal
import statistics
from datetime import datetime

from src.api.dependencies import get_monthly_summary_repository, get_transaction_repository
from src.repositories.monthly_summary_repository import MonthlySummaryRepository
from src.repositories.transaction_repository import TransactionRepository

router = APIRouter()

@router.get("/overview")
async def get_financial_overview(
    monthly_summary_repo: MonthlySummaryRepository = Depends(get_monthly_summary_repository),
    transaction_repo: TransactionRepository = Depends(get_transaction_repository)
):
    """
    Get comprehensive financial statistics and insights from all historical data
    """
    try:
        # Get all monthly summaries
        summaries = monthly_summary_repo.find_all()
        
        if not summaries:
            return {
                "error": "No monthly summary data available",
                "data_available": False
            }
        
        # Investment categories
        investment_categories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab']
        exclude_categories = ['Pay', 'Payment'] + investment_categories
        
        # Basic data range info
        date_range = {
            "start_month": f"{summaries[-1].month} {summaries[-1].year}",
            "end_month": f"{summaries[0].month} {summaries[0].year}",
            "total_months": len(summaries)
        }
        
        # Find highest and lowest spending months
        highest_month = max(summaries, key=lambda s: float(s.total_minus_invest))
        lowest_month = min(summaries, key=lambda s: float(s.total_minus_invest))
        
        # Calculate category statistics
        category_data = {}
        for summary in summaries:
            for category, amount in summary.category_totals.items():
                if category not in exclude_categories:
                    if category not in category_data:
                        category_data[category] = []
                    category_data[category].append(float(amount))
        
        # Calculate category statistics
        category_statistics = {}
        for category, amounts in category_data.items():
            if amounts:
                total = sum(amounts)
                average = statistics.mean(amounts)
                volatility = statistics.stdev(amounts) if len(amounts) > 1 else 0
                months_active = len([a for a in amounts if a > 0])
                
                category_statistics[category] = {
                    "total": round(total, 2),
                    "average": round(average, 2),
                    "volatility": round(volatility, 2),
                    "months_active": months_active,
                    "consistency_score": round((months_active / len(amounts)) * 100, 1) if amounts else 0
                }
        
        # Calculate yearly totals and growth
        yearly_totals = {}
        yearly_investments = {}
        yearly_income = {}
        
        for summary in summaries:
            year = summary.year
            if year not in yearly_totals:
                yearly_totals[year] = {
                    "total_spending": 0,
                    "total_investments": 0,
                    "total_income": 0,
                    "months": 0,
                    "categories": {}
                }
            
            # Spending (excluding investments)
            yearly_totals[year]["total_spending"] += float(summary.total_minus_invest)
            
            # Investments
            investment_total = sum(
                float(summary.category_totals.get(cat, 0)) 
                for cat in investment_categories
            )
            yearly_totals[year]["total_investments"] += abs(investment_total)
            
            # Income
            yearly_totals[year]["total_income"] += abs(float(summary.category_totals.get('Pay', 0)))
            
            yearly_totals[year]["months"] += 1
            
            # Category totals by year
            for category, amount in summary.category_totals.items():
                if category not in exclude_categories:
                    if category not in yearly_totals[year]["categories"]:
                        yearly_totals[year]["categories"][category] = 0
                    yearly_totals[year]["categories"][category] += float(amount)
        
        # Calculate year-over-year growth
        years = sorted(yearly_totals.keys())
        growth_trends = {}
        
        if len(years) > 1:
            for i in range(1, len(years)):
                current_year = years[i]
                previous_year = years[i-1]
                
                current_spending = yearly_totals[current_year]["total_spending"]
                previous_spending = yearly_totals[previous_year]["total_spending"]
                
                if previous_spending > 0:
                    growth_rate = ((current_spending - previous_spending) / previous_spending) * 100
                    growth_trends[f"{previous_year}_to_{current_year}"] = {
                        "spending_growth": round(growth_rate, 1),
                        "previous_year_spending": round(previous_spending, 2),
                        "current_year_spending": round(current_spending, 2)
                    }
        
        # Most and least volatile categories
        volatility_rankings = sorted(
            [(cat, stats["volatility"]) for cat, stats in category_statistics.items()],
            key=lambda x: x[1],
            reverse=True
        )
        
        most_volatile = volatility_rankings[0] if volatility_rankings else ("N/A", 0)
        least_volatile = volatility_rankings[-1] if volatility_rankings else ("N/A", 0)
        
        # Top spending categories (all time)
        top_categories = sorted(
            [(cat, stats["total"]) for cat, stats in category_statistics.items()],
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Calculate net worth change (simplified)
        total_income = sum(yearly["total_income"] for yearly in yearly_totals.values())
        total_spending = sum(yearly["total_spending"] for yearly in yearly_totals.values())
        total_investments = sum(yearly["total_investments"] for yearly in yearly_totals.values())
        
        net_worth_change = total_income - total_spending + total_investments
        
        return {
            "data_available": True,
            "date_range": date_range,
            "spending_extremes": {
                "highest_month": {
                    "month_year": highest_month.month_year,
                    "amount": float(highest_month.total_minus_invest)
                },
                "lowest_month": {
                    "month_year": lowest_month.month_year,
                    "amount": float(lowest_month.total_minus_invest)
                }
            },
            "category_statistics": category_statistics,
            "yearly_totals": yearly_totals,
            "growth_trends": growth_trends,
            "volatility_rankings": {
                "most_volatile": {
                    "category": most_volatile[0],
                    "volatility": most_volatile[1]
                },
                "least_volatile": {
                    "category": least_volatile[0],
                    "volatility": least_volatile[1]
                }
            },
            "top_categories": [
                {"category": cat, "total": total} for cat, total in top_categories
            ],
            "financial_summary": {
                "total_income": round(total_income, 2),
                "total_spending": round(total_spending, 2),
                "total_investments": round(total_investments, 2),
                "net_worth_change": round(net_worth_change, 2),
                "overall_savings_rate": round(((total_income - total_spending) / total_income * 100), 1) if total_income > 0 else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating financial overview: {str(e)}")

@router.get("/year-comparison")
async def get_year_comparison(
    monthly_summary_repo: MonthlySummaryRepository = Depends(get_monthly_summary_repository)
):
    """
    Get spending data organized by year for comparison charts
    """
    try:
        summaries = monthly_summary_repo.find_all()
        
        if not summaries:
            return {"error": "No data available", "years": {}}
        
        investment_categories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab']
        exclude_categories = ['Pay', 'Payment']
        
        year_data = {}
        
        for summary in summaries:
            year = str(summary.year)
            if year not in year_data:
                year_data[year] = {
                    "categories": {},
                    "investments": 0,
                    "income": 0,
                    "total_spending": 0,
                    "months_count": 0
                }
            
            year_data[year]["months_count"] += 1
            year_data[year]["income"] += abs(float(summary.category_totals.get('Pay', 0)))
            year_data[year]["total_spending"] += float(summary.total_minus_invest)
            
            # Category breakdowns
            for category, amount in summary.category_totals.items():
                if category in investment_categories:
                    year_data[year]["investments"] += abs(float(amount))
                elif category not in exclude_categories:
                    if category not in year_data[year]["categories"]:
                        year_data[year]["categories"][category] = 0
                    year_data[year]["categories"][category] += float(amount)
        
        # Calculate yearly averages
        for year in year_data:
            months = year_data[year]["months_count"]
            if months > 0:
                year_data[year]["average_monthly_spending"] = round(year_data[year]["total_spending"] / months, 2)
                year_data[year]["average_monthly_income"] = round(year_data[year]["income"] / months, 2)
                year_data[year]["average_monthly_investments"] = round(year_data[year]["investments"] / months, 2)
        
        return {
            "years": year_data,
            "available_years": sorted([int(year) for year in year_data.keys()]),
            "comparison_ready": len(year_data) > 1
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating year comparison: {str(e)}")

@router.get("/patterns")
async def get_spending_patterns(
    monthly_summary_repo: MonthlySummaryRepository = Depends(get_monthly_summary_repository),
    transaction_repo: TransactionRepository = Depends(get_transaction_repository)
):
    """
    Detect spending patterns and recurring transactions
    """
    try:
        summaries = monthly_summary_repo.find_all()
        
        if not summaries:
            return {"patterns": [], "recurring_expenses": []}
        
        patterns = []
        
        # Pattern 1: Subscription creep (increasing subscription spending)
        subscription_categories = ['Subscriptions', 'Netflix', 'Spotify', 'Apple']
        subscription_totals = []
        
        for summary in summaries:
            month_subscriptions = sum(
                float(summary.category_totals.get(cat, 0)) 
                for cat in subscription_categories 
                if cat in summary.category_totals
            )
            subscription_totals.append({
                "month_year": summary.month_year,
                "total": month_subscriptions
            })
        
        # Check for subscription creep (last 6 months vs previous 6 months)
        if len(subscription_totals) >= 12:
            recent_avg = statistics.mean([s["total"] for s in subscription_totals[:6]])
            older_avg = statistics.mean([s["total"] for s in subscription_totals[6:12]])
            
            if recent_avg > older_avg * 1.2:  # 20% increase
                patterns.append({
                    "type": "subscription_creep",
                    "severity": "warning",
                    "message": f"Subscription spending increased {((recent_avg - older_avg) / older_avg * 100):.1f}% in recent months",
                    "data": {
                        "recent_average": round(recent_avg, 2),
                        "previous_average": round(older_avg, 2)
                    }
                })
        
        # Pattern 2: Seasonal spending spikes
        monthly_averages = {}
        for summary in summaries:
            month = summary.month
            if month not in monthly_averages:
                monthly_averages[month] = []
            monthly_averages[month].append(float(summary.total_minus_invest))
        
        # Find months that are consistently higher than average
        overall_avg = statistics.mean([float(s.total_minus_invest) for s in summaries])
        seasonal_spikes = []
        
        for month, amounts in monthly_averages.items():
            if len(amounts) >= 2:
                month_avg = statistics.mean(amounts)
                if month_avg > overall_avg * 1.3:  # 30% above average
                    seasonal_spikes.append({
                        "month": month,
                        "average": round(month_avg, 2),
                        "spike_percentage": round(((month_avg - overall_avg) / overall_avg * 100), 1)
                    })
        
        if seasonal_spikes:
            patterns.append({
                "type": "seasonal_spikes",
                "severity": "info",
                "message": f"Consistent spending spikes detected in {len(seasonal_spikes)} months",
                "data": {"spikes": seasonal_spikes}
            })
        
        # Pattern 3: Investment consistency
        investment_categories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab']
        investment_amounts = []
        
        for summary in summaries:
            month_investments = sum(
                abs(float(summary.category_totals.get(cat, 0))) 
                for cat in investment_categories
            )
            investment_amounts.append(month_investments)
        
        if investment_amounts and len(investment_amounts) >= 6:
            investment_consistency = statistics.stdev(investment_amounts) / statistics.mean(investment_amounts) if statistics.mean(investment_amounts) > 0 else 0
            
            if investment_consistency < 0.2:  # Low variability = consistent
                patterns.append({
                    "type": "consistent_investing",
                    "severity": "positive",
                    "message": f"Consistent investment pattern detected (CV: {investment_consistency:.2f})",
                    "data": {
                        "average_monthly": round(statistics.mean(investment_amounts), 2),
                        "consistency_score": round((1 - investment_consistency) * 100, 1)
                    }
                })
        
        return {
            "patterns": patterns,
            "pattern_count": len(patterns),
            "analysis_period": {
                "start": f"{summaries[-1].month} {summaries[-1].year}",
                "end": f"{summaries[0].month} {summaries[0].year}",
                "months_analyzed": len(summaries)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting patterns: {str(e)}")