# src/api/routers/statistics.py

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional, Any
from decimal import Decimal
import statistics
from datetime import datetime

from src.api.dependencies import (
    get_monthly_summary_repository, 
    get_transaction_repository,
    get_config_manager
)
from src.repositories.monthly_summary_repository import MonthlySummaryRepository
from src.repositories.transaction_repository import TransactionRepository
from src.config.config_manager import ConfigManager

router = APIRouter()

@router.get("/overview")
async def get_comprehensive_financial_overview(
    monthly_summary_repo: MonthlySummaryRepository = Depends(get_monthly_summary_repository),
    transaction_repo: TransactionRepository = Depends(get_transaction_repository),
    config_manager: ConfigManager = Depends(get_config_manager)
):
    """
    Get comprehensive financial overview with actionable insights
    """
    try:
        # Get all monthly summaries
        summaries = monthly_summary_repo.find_all()
        
        if not summaries:
            return {
                "error": "No monthly summary data available",
                "data_available": False
            }
        
        # Investment and expense categories
        investment_categories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab']
        exclude_categories = ['Pay', 'Payment'] + investment_categories
        
        # Basic data range info
        date_range = {
            "start_month": f"{summaries[-1].month} {summaries[-1].year}",
            "end_month": f"{summaries[0].month} {summaries[0].year}",
            "total_months": len(summaries)
        }
        
        # Calculate core financial metrics
        total_income = sum(abs(float(s.category_totals.get('Pay', 0))) for s in summaries)
        total_spending = sum(float(s.total_minus_invest) for s in summaries)
        total_investments = sum(
            sum(abs(float(s.category_totals.get(cat, 0))) for cat in investment_categories)
            for s in summaries
        )
        
        # Financial growth (net worth change)
        financial_growth = total_income - total_spending
        monthly_financial_growth = financial_growth / len(summaries) if summaries else 0
        
        # Calculate cash flow (income - all spending including investments)
        monthly_income = total_income / len(summaries)
        monthly_spending = total_spending / len(summaries)
        monthly_investments = total_investments / len(summaries)
        monthly_cash_flow = monthly_income - monthly_spending
        
        # Calculate investment rate (investments as % of total savings)
        investment_rate = (monthly_investments / monthly_income * 100) if monthly_income > 0 else 0
        
        # Savings rate calculation
        overall_savings_rate = ((total_income - total_spending) / total_income * 100) if total_income > 0 else 0
        
        # Top expense categories analysis
        category_totals = {}
        for summary in summaries:
            for category, amount in summary.category_totals.items():
                if category not in exclude_categories:
                    if category not in category_totals:
                        category_totals[category] = 0
                    category_totals[category] += float(amount)
        
        # Get top 5 categories by total spending
        top_categories = sorted(
            [(cat, total) for cat, total in category_totals.items()],
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Calculate spending patterns
        spending_patterns = await _analyze_spending_patterns(summaries, investment_categories)
        
        # Budget adherence calculation
        budget_adherence = await _calculate_budget_adherence(
            summaries, config_manager, monthly_summary_repo
        )
        
        # Alert flags
        alert_flags = await _generate_alert_flags(summaries, category_totals, config_manager)
        
        # Year-over-year analysis
        yearly_analysis = _calculate_yearly_trends(summaries, investment_categories)
        
        # Spending extremes
        spending_amounts = [float(s.total_minus_invest) for s in summaries]
        highest_month = max(summaries, key=lambda s: float(s.total_minus_invest))
        lowest_month = min(summaries, key=lambda s: float(s.total_minus_invest))
        
        return {
            "data_available": True,
            "date_range": date_range,
            
            # Core metrics
            "financial_summary": {
                "total_income": round(total_income, 2),
                "total_spending": round(total_spending, 2),
                "total_investments": round(total_investments, 2),
                "financial_growth": round(financial_growth, 2),
                "monthly_financial_growth": round(monthly_financial_growth, 2),
                "overall_savings_rate": round(overall_savings_rate, 1)
            },
            
            "cash_flow_analysis": {
                "monthly_income": round(monthly_income, 2),
                "monthly_spending": round(monthly_spending, 2),  # Expenses only, no investments
                "monthly_investments": round(monthly_investments, 2),
                "monthly_cash_flow": round(monthly_cash_flow, 2),  # Income - expenses (positive should be normal)
                "investment_rate": round(investment_rate, 1)  # Now shows % of income invested
            },
            
            # Spending intelligence
            "spending_intelligence": {
                "top_categories": [
                    {"category": cat, "total_amount": round(total, 2), "monthly_average": round(total / len(summaries), 2)}
                    for cat, total in top_categories
                ],
                "spending_patterns": spending_patterns,
                "discretionary_ratio": spending_patterns.get("discretionary_ratio", 0),
                "fixed_expenses": spending_patterns.get("fixed_expenses", 0)
            },
            
            # Budget and warnings
            "budget_health": {
                "adherence_score": budget_adherence.get("score", 0),
                "categories_on_track": budget_adherence.get("on_track", 0),
                "total_categories": budget_adherence.get("total", 0),
                "alert_flags": alert_flags
            },
            
            # Year-over-year trends
            "yearly_trends": yearly_analysis,
            
            # Spending extremes
            "spending_extremes": {
                "highest_month": {
                    "month_year": highest_month.month_year,
                    "amount": float(highest_month.total_minus_invest)
                },
                "lowest_month": {
                    "month_year": lowest_month.month_year,
                    "amount": float(lowest_month.total_minus_invest)
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating comprehensive overview: {str(e)}")


async def _analyze_spending_patterns(summaries, investment_categories):
    """Analyze spending patterns and calculate discretionary vs fixed expenses"""
    
    # Define typically fixed categories
    fixed_categories = ['Rent', 'Insurance', 'Utilities']
    
    # Calculate averages
    fixed_total = 0
    discretionary_total = 0
    
    for summary in summaries:
        for category, amount in summary.category_totals.items():
            if category in ['Pay', 'Payment'] + investment_categories:
                continue
                
            amount_val = float(amount)
            if category in fixed_categories:
                fixed_total += amount_val
            else:
                discretionary_total += amount_val
    
    monthly_fixed = fixed_total / len(summaries)
    monthly_discretionary = discretionary_total / len(summaries)
    total_monthly = monthly_fixed + monthly_discretionary
    
    # Calculate 3-month trend (simplified - using recent vs older averages)
    recent_months = summaries[:3] if len(summaries) >= 6 else summaries[:len(summaries)//2]
    older_months = summaries[3:6] if len(summaries) >= 6 else summaries[len(summaries)//2:]
    
    recent_avg = sum(float(s.total_minus_invest) for s in recent_months) / len(recent_months) if recent_months else 0
    older_avg = sum(float(s.total_minus_invest) for s in older_months) / len(older_months) if older_months else recent_avg
    
    trend_percentage = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
    
    return {
        "fixed_expenses": round(monthly_fixed, 2),
        "discretionary_expenses": round(monthly_discretionary, 2),
        "discretionary_ratio": round((monthly_discretionary / total_monthly * 100), 1) if total_monthly > 0 else 0,
        "three_month_trend": round(trend_percentage, 1)
    }


async def _calculate_budget_adherence(summaries, config_manager, monthly_summary_repo):
    """Calculate budget adherence score"""
    try:
        budgets = config_manager.get_budgets()
        
        if not budgets:
            return {"score": 0, "on_track": 0, "total": 0}
        
        # Use most recent month for adherence calculation
        recent_summary = summaries[0]
        
        on_track = 0
        total_categories = 0
        
        for category, budget_amount in budgets.items():
            if budget_amount <= 0:
                continue
                
            actual_amount = float(recent_summary.category_totals.get(category, 0))
            total_categories += 1
            
            if actual_amount <= budget_amount:
                on_track += 1
        
        adherence_score = (on_track / total_categories * 100) if total_categories > 0 else 0
        
        return {
            "score": round(adherence_score, 1),
            "on_track": on_track,
            "total": total_categories
        }
        
    except Exception:
        return {"score": 0, "on_track": 0, "total": 0}


async def _generate_alert_flags(summaries, category_totals, config_manager):
    """Generate alert flags for concerning patterns"""
    flags = []
    
    try:
        budgets = config_manager.get_budgets()
        recent_summary = summaries[0]
        
        # Check budget overruns
        for category, budget_amount in budgets.items():
            if budget_amount <= 0:
                continue
                
            actual_amount = float(recent_summary.category_totals.get(category, 0))
            if actual_amount > budget_amount * 1.1:  # 10% over budget
                overage = ((actual_amount - budget_amount) / budget_amount * 100)
                flags.append({
                    "type": "budget_overage",
                    "message": f"{category} spending up {overage:.0f}% vs budget",
                    "severity": "warning"
                })
        
        # Check subscription costs
        subscription_categories = ['Subscriptions', 'Netflix', 'Spotify', 'Apple']
        subscription_total = sum(
            float(recent_summary.category_totals.get(cat, 0)) 
            for cat in subscription_categories
        )
        
        if subscription_total > 75:  # Arbitrary threshold
            flags.append({
                "type": "subscription_creep",
                "message": f"Subscription costs: ${subscription_total:.0f}/month",
                "severity": "info"
            })
        
        # Check consecutive months over spending target
        if len(summaries) >= 3:
            recent_spending = [float(s.total_minus_invest) for s in summaries[:3]]
            avg_spending = sum(float(s.total_minus_invest) for s in summaries) / len(summaries)
            
            if all(spending > avg_spending * 1.1 for spending in recent_spending):
                flags.append({
                    "type": "spending_pattern",
                    "message": "3 months above spending target",
                    "severity": "warning"
                })
        
    except Exception:
        # If there's any error, return empty flags
        pass
    
    return flags[:3]  # Limit to 3 most important flags


def _calculate_yearly_trends(summaries, investment_categories):
    """Calculate year-over-year trends"""
    yearly_data = {}
    
    for summary in summaries:
        year = summary.year
        if year not in yearly_data:
            yearly_data[year] = {
                "income": 0,
                "spending": 0,
                "investments": 0,
                "months": 0
            }
        
        yearly_data[year]["income"] += abs(float(summary.category_totals.get('Pay', 0)))
        yearly_data[year]["spending"] += float(summary.total_minus_invest)
        yearly_data[year]["investments"] += sum(
            abs(float(summary.category_totals.get(cat, 0))) 
            for cat in investment_categories
        )
        yearly_data[year]["months"] += 1
    
    # Calculate monthly averages
    for year_data in yearly_data.values():
        if year_data["months"] > 0:
            year_data["monthly_income"] = year_data["income"] / year_data["months"]
            year_data["monthly_spending"] = year_data["spending"] / year_data["months"]
            year_data["monthly_investments"] = year_data["investments"] / year_data["months"]
    
    return yearly_data


# Keep the existing endpoints
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