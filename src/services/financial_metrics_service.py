# src/services/financial_metrics_service.py

from typing import Dict, Optional, List
from decimal import Decimal
from datetime import date, datetime, timedelta
from collections import defaultdict

from src.repositories.bank_balance_repository import BankBalanceRepository
from src.repositories.portfolio_repository import PortfolioRepository
from src.repositories.monthly_summary_repository import MonthlySummaryRepository


class FinancialMetricsService:
    """Service for calculating advanced financial metrics like runway, net worth, etc."""
    
    def __init__(
        self,
        bank_repo: BankBalanceRepository,
        portfolio_repo: PortfolioRepository,
        monthly_summary_repo: MonthlySummaryRepository
    ):
        self.bank_repo = bank_repo
        self.portfolio_repo = portfolio_repo
        self.monthly_summary_repo = monthly_summary_repo
    
    def calculate_financial_runway(self) -> Dict:
        """Calculate how many months you can survive with current liquid assets"""
        
        # Get latest bank balances (liquid assets)
        checking_balance = self.bank_repo.get_latest_balance("Wells Fargo Checking")
        savings_balance = self.bank_repo.get_latest_balance("Wells Fargo Savings")
        
        # Get Wealthfront Cash (also liquid)
        wealthfront_cash_account = self.portfolio_repo.get_account_by_name("Wealthfront Cash")
        wealthfront_cash_balance = Decimal('0')
        
        if wealthfront_cash_account:
            latest_balances = self.portfolio_repo.get_latest_balances()
            if wealthfront_cash_account.id in latest_balances:
                wealthfront_cash_balance = latest_balances[wealthfront_cash_account.id].balance_amount
        
        # Calculate total liquid assets
        total_liquid = Decimal('0')
        if checking_balance:
            total_liquid += checking_balance.ending_balance
        if savings_balance:
            total_liquid += savings_balance.ending_balance
        total_liquid += wealthfront_cash_balance
        
        # Estimate monthly expenses (average spending from recent months)
        # Use find_all() and get the most recent summaries
        all_summaries = self.monthly_summary_repo.find_all()
        if all_summaries and len(all_summaries) >= 6:
            # find_all() returns summaries ordered by year DESC, month DESC
            recent_summaries = all_summaries[:6]  # Get the 6 most recent
            monthly_expenses = sum(s.total_minus_invest for s in recent_summaries) / len(recent_summaries)
        elif all_summaries:
            # If we have less than 6 months, use what we have
            monthly_expenses = sum(s.total_minus_invest for s in all_summaries) / len(all_summaries)
        else:
            monthly_expenses = Decimal('5000')  # Default estimate
        
        # Calculate runway
        runway_months = total_liquid / monthly_expenses if monthly_expenses > 0 else 0
        
        return {
            "total_liquid_assets": float(total_liquid),
            "checking_balance": float(checking_balance.ending_balance) if checking_balance else 0,
            "savings_balance": float(savings_balance.ending_balance) if savings_balance else 0,
            "wealthfront_cash": float(wealthfront_cash_balance),
            "monthly_expenses": float(monthly_expenses),
            "runway_months": float(runway_months),
            "runway_status": self._get_runway_status(float(runway_months))
        }
    
    def calculate_net_worth(self) -> Dict:
        """Calculate total net worth (liquid + investments)"""
        
        # Get liquid assets
        runway_data = self.calculate_financial_runway()
        liquid_assets = runway_data["total_liquid_assets"]
        
        # Get investment assets (exclude Wealthfront Cash since it's liquid)
        wealthfront_cash_account = self.portfolio_repo.get_account_by_name("Wealthfront Cash")
        wealthfront_cash_id = wealthfront_cash_account.id if wealthfront_cash_account else None
        
        latest_balances = self.portfolio_repo.get_latest_balances()
        investment_assets = sum(
            float(balance.balance_amount) 
            for account_id, balance in latest_balances.items()
            if account_id != wealthfront_cash_id
        )
        
        total_net_worth = liquid_assets + investment_assets
        liquidity_ratio = liquid_assets / total_net_worth if total_net_worth > 0 else 0
        
        return {
            "total_net_worth": total_net_worth,
            "liquid_assets": liquid_assets,
            "investment_assets": investment_assets,
            "liquidity_ratio": liquidity_ratio,
            "liquidity_status": self._get_liquidity_status(liquidity_ratio)
        }
    
    def _get_runway_status(self, runway_months: float) -> str:
        """Get runway status based on months of coverage"""
        if runway_months >= 12:
            return "Excellent"
        elif runway_months >= 6:
            return "Good"
        elif runway_months >= 3:
            return "Fair"
        else:
            return "Needs Attention"
    
    def _get_liquidity_status(self, liquidity_ratio: float) -> str:
        """Get liquidity status based on liquid vs total assets"""
        if liquidity_ratio >= 0.3:
            return "High Liquidity"
        elif liquidity_ratio >= 0.15:
            return "Good Liquidity"
        elif liquidity_ratio >= 0.05:
            return "Low Liquidity"
        else:
            return "Very Low Liquidity"

    def get_historical_net_worth(self, period: str = "2y") -> List[Dict]:
        """
        Get historical net worth data combining real bank balances and portfolio values.
        Returns monthly data points with actual bank balance data (not fabricated).

        Args:
            period: Time period ("6m", "1y", "2y", "all")

        Returns:
            List of monthly data points with real values
        """
        end_date = date.today()

        # Determine start date based on period
        if period == "6m":
            start_date = end_date - timedelta(days=180)
        elif period == "1y":
            start_date = end_date - timedelta(days=365)
        elif period == "2y":
            start_date = end_date - timedelta(days=730)
        else:  # "all"
            start_date = date(2020, 1, 1)

        # Get all bank balances and organize by month
        all_bank_balances = self.bank_repo.get_all_balances()
        bank_by_month = {}
        for balance in all_bank_balances:
            if balance.statement_date >= start_date:
                month_key = balance.statement_date.strftime('%Y-%m')
                if month_key not in bank_by_month:
                    bank_by_month[month_key] = {}
                bank_by_month[month_key][balance.account_name] = balance.ending_balance

        # Get all portfolio accounts
        accounts = self.portfolio_repo.get_all_accounts()
        wealthfront_cash_account = self.portfolio_repo.get_account_by_name("Wealthfront Cash")
        wealthfront_cash_id = wealthfront_cash_account.id if wealthfront_cash_account else None

        # Build monthly data points
        monthly_data = []
        current_date = start_date.replace(day=1)

        while current_date <= end_date:
            month_end = self._get_month_end_date(current_date)
            month_key = current_date.strftime('%Y-%m')
            month_display = current_date.strftime('%b %Y')

            # Get bank balances for this month (or latest available)
            bank_total = Decimal('0')
            if month_key in bank_by_month:
                # Use exact month data if available
                for account_name, balance in bank_by_month[month_key].items():
                    bank_total += balance
            else:
                # Find the latest bank balance before this month
                latest_bank_total = Decimal('0')
                for mk in sorted(bank_by_month.keys()):
                    if mk <= month_key:
                        latest_bank_total = sum(bank_by_month[mk].values(), Decimal('0'))
                bank_total = latest_bank_total

            # Get portfolio balances for this month
            portfolio_total = Decimal('0')
            wealthfront_cash = Decimal('0')
            investment_assets = Decimal('0')

            for account in accounts:
                account_balances = self.portfolio_repo.get_balances_for_account(
                    account.id,
                    start_date=date(2020, 1, 1),
                    end_date=month_end
                )

                if account_balances:
                    latest_balance = max(account_balances, key=lambda b: b.balance_date)
                    balance_value = latest_balance.balance_amount
                    portfolio_total += balance_value

                    if account.id == wealthfront_cash_id:
                        wealthfront_cash = balance_value
                    else:
                        investment_assets += balance_value

            # Calculate totals
            liquid_assets = bank_total + wealthfront_cash
            net_worth = bank_total + portfolio_total

            monthly_data.append({
                'month': month_display,
                'date': current_date.strftime('%Y-%m-%d'),
                'net_worth': float(net_worth),
                'liquid_assets': float(liquid_assets),
                'investment_assets': float(investment_assets),
                'bank_balance': float(bank_total),
                'wealthfront_cash': float(wealthfront_cash)
            })

            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)

        return monthly_data

    def _get_month_end_date(self, month_start: date) -> date:
        """Get the last day of the month for a given month start date"""
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        return next_month - timedelta(days=1)