// src/pages/Dashboard.tsx - Cleaned up without sorting bandaids
import React from 'react';
import { useFinancialOverview, usePortfolioTrends, useMonthlySummariesChronological, useMonthlySummariesRecent } from '../hooks/useApiData';
import { Calendar, TrendingUp, Target, PiggyBank } from 'lucide-react';
import MetricCard from '../components/cards/MetricCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import NetWorthChart from '../components/dashboard/NetWorthChart';
import FinancialPatternChart from '../components/dashboard/FinancialPatternChart';
import CategoryInsights from '../components/dashboard/CategoryInsights';
import InvestmentInsights from '../components/dashboard/InvestmentInsights';
import DrillDownCard from '../components/dashboard/DrillDownCard';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatRunwayMonths(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
  }
  return `${months.toFixed(1)} months`;
}

// Net Worth Chart - Portfolio data + bank balances, properly ordered from API
function processRealNetWorthData(portfolioTrends: any, overview: any) {
  if (!portfolioTrends?.monthly_values) return [];
  
  // Get current liquid assets breakdown
  const currentTotalLiquid = overview.financial_health.net_worth.liquid_assets;
  
  // Calculate current bank balances (liquid - Wealthfront Cash)
  const estimatedBankBalances = currentTotalLiquid - (portfolioTrends.monthly_values[0]?.wealthfront_cash || 0);
  
  // Portfolio API returns newest first, reverse for chronological order
  const chronologicalData = portfolioTrends.monthly_values.slice().reverse();
  
  return chronologicalData.map((month: any, index: number) => {
    const portfolioValue = month.total_value;
    const wealthfrontCash = month.wealthfront_cash || 0;
    
    // Estimate bank balances for historical months
    const timeProgress = (index + 1) / chronologicalData.length;
    const estimatedHistoricalBankBalance = estimatedBankBalances * (0.3 + (timeProgress * 0.7));
    
    // Total liquid = Wealthfront Cash + Bank Balances
    const totalLiquid = wealthfrontCash + estimatedHistoricalBankBalance;
    
    // Investment assets = Portfolio value - Wealthfront Cash
    const investmentAssets = portfolioValue - wealthfrontCash;
    
    // Total net worth = Portfolio + Bank Balances
    const totalNetWorth = portfolioValue + estimatedHistoricalBankBalance;
    
    return {
      month: month.month_display,
      net_worth: totalNetWorth,
      liquid_assets: totalLiquid,
      investment_assets: investmentAssets
    };
  });
}

// Financial Pattern Chart - Now gets properly sorted data from API
function processRealPatternData(monthlySummaries: any[]) {
  if (!monthlySummaries || monthlySummaries.length === 0) return [];
  
  // Data is already in chronological order from API (asc sort)
  // Take the last 24 months for chart display
  const last24Months = monthlySummaries.slice(-24);
  
  return last24Months.map((summary: any) => {
    const income = Math.abs(parseFloat(summary.category_totals['Pay'] || '0'));
    const spending = parseFloat(summary.total_minus_invest || '0');
    const investment = parseFloat(summary.investment_total || '0');
    
    // Available Cash = Income - Spending (what you have before investing)
    const availableCash = income - spending;
    
    return {
      name: summary.month.slice(0, 3), // "Jan", "Feb", etc.
      fullName: summary.month_year,
      spending: Math.round(spending),
      investment: Math.round(Math.abs(investment)),
      income: Math.round(income),
      availableCash: Math.round(availableCash),
      month: summary.month,
      year: summary.year
    };
  });
}

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading, isError, error } = useFinancialOverview();
  const { data: portfolioTrends, isLoading: portfolioLoading } = usePortfolioTrends("2y");
  // Use chronological hook for chart data (oldest first)
  const { data: monthlySummariesChronological, isLoading: summariesChronologicalLoading } = useMonthlySummariesChronological();
  // Use recent hook for CategoryInsights (newest first)
  const { data: monthlySummariesRecent, isLoading: summariesRecentLoading } = useMonthlySummariesRecent();

  const summariesLoading = summariesChronologicalLoading || summariesRecentLoading;

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-400">{error?.message || 'Failed to load financial overview'}</p>
        </div>
      </div>
    );
  }

  if (overviewLoading || portfolioLoading || summariesLoading || !overview) {
    return (
      <div className="h-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Financial Health Check</h1>
          <div className="h-4 w-64 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <LoadingSkeleton variant="metric" className="h-32" />
            <LoadingSkeleton variant="metric" className="h-32" />
            <LoadingSkeleton variant="metric" className="h-32" />
          </div>
          <div className="grid grid-cols-12 gap-6">
            <LoadingSkeleton variant="metric" className="col-span-8 h-64" />
            <LoadingSkeleton variant="list" className="col-span-4 h-64" />
          </div>
        </div>
      </div>
    );
  }

  // Process chart data - no more frontend sorting needed!
  const netWorthData = portfolioTrends ? processRealNetWorthData(portfolioTrends, overview) : [];
  const patternData = monthlySummariesChronological?.summaries ? 
    processRealPatternData(monthlySummariesChronological.summaries) : [];

  // Calculate growth metrics using current total net worth
  const currentNetWorth = overview.financial_health.net_worth.total_net_worth;
  const oldestNetWorth = netWorthData[0]?.net_worth || currentNetWorth;
  const totalGrowth = currentNetWorth - oldestNetWorth;
  const growthPercent = oldestNetWorth > 0 ? (totalGrowth / oldestNetWorth) * 100 : 0;

  // Calculate current available cash (Income - Spending)
  const currentAvailableCash = overview.cash_flow_analysis.monthly_income - overview.cash_flow_analysis.monthly_spending;

  return (
    <div className="h-full flex flex-col space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financial Health Check</h1>
          <p className="text-gray-400">
            {overview.date_range.end_month} • {overview.date_range.total_months} months analyzed • Net Worth: {formatCurrency(currentNetWorth)}
            {totalGrowth !== 0 && ` (${totalGrowth > 0 ? '+' : ''}${formatCurrency(totalGrowth)})`}
          </p>
        </div>
      </div>

      {/* Financial Progress - 3 Key Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <MetricCard
          title="Net Worth Growth"
          value={formatCurrency(currentNetWorth)}
          subtitle={`Liquid: ${formatCurrency(overview.financial_health.net_worth.liquid_assets)} • Invested: ${formatCurrency(overview.financial_health.net_worth.investment_assets)}`}
          variant="hero"
          trend={{
            value: totalGrowth !== 0 ? `${totalGrowth > 0 ? '+' : ''}${growthPercent.toFixed(1)}% growth` : 'No change',
            direction: totalGrowth > 0 ? 'up' : totalGrowth < 0 ? 'down' : 'neutral'
          }}
        />
        
        <MetricCard
          title="Emergency Fund"
          value={formatRunwayMonths(overview.financial_health.runway.runway_months)}
          subtitle={`${formatCurrency(overview.financial_health.runway.total_liquid_assets)} available • Target: 6mo`}
          variant={overview.financial_health.runway.runway_months >= 6 ? 'default' : 
                   overview.financial_health.runway.runway_months >= 4 ? 'accent' : 'warning'}
          trend={{
            value: overview.financial_health.runway.runway_months >= 6 ? 'Healthy' : 
                   overview.financial_health.runway.runway_months >= 3 ? 'Stable' : 'Building',
            direction: overview.financial_health.runway.runway_months >= 4 ? 'up' : 'neutral'
          }}
        />
        
        <MetricCard
          title="Investment Momentum"
          value={`${formatCurrency(overview.cash_flow_analysis.monthly_investments)}/month`}
          subtitle={`${formatPercentage(overview.cash_flow_analysis.investment_rate)} of income • ${overview.cash_flow_analysis.investment_rate > 30 ? 'Aggressive' : 'Moderate'} strategy`}
          variant="accent"
          trend={{
            value: overview.cash_flow_analysis.investment_rate > 30 ? 'Exceptional rate' : 'Strong rate',
            direction: 'up'
          }}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <NetWorthChart 
            data={netWorthData} 
            currentNetWorth={currentNetWorth}
          />
        </div>
        <div className="col-span-4">
          <InvestmentInsights overview={overview} />
        </div>
      </div>

      {/* Financial Pattern Chart - 24 months with Available Cash */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <FinancialPatternChart 
            monthlyData={patternData}
            currentAvailableCash={currentAvailableCash}
          />
        </div>
      </div>

      {/* Analysis Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <CategoryInsights 
            overview={overview} 
            monthlySummaries={monthlySummariesRecent?.summaries || []}
            selectedCategories={['Food', 'Travel', 'Shopping', 'Groceries', 'Recreation', 'Venmo']}
          />
        </div>
      </div>

      {/* Drill Down Cards */}
      <div className="grid grid-cols-4 gap-6">
        <DrillDownCard
          title="Monthly Analysis"
          description="Detailed spending breakdowns"
          to="/monthly"
          icon={Calendar}
          color="blue"
          metrics={{
            primary: formatCurrency(overview.cash_flow_analysis.monthly_spending),
            secondary: "Average monthly spending (57mo)",
            trend: {
              value: overview.spending_intelligence.spending_patterns.three_month_trend > 0 ? 
                     `+${overview.spending_intelligence.spending_patterns.three_month_trend.toFixed(1)}%` :
                     `${overview.spending_intelligence.spending_patterns.three_month_trend.toFixed(1)}%`,
              direction: overview.spending_intelligence.spending_patterns.three_month_trend > 0 ? 'up' : 
                        overview.spending_intelligence.spending_patterns.three_month_trend < 0 ? 'down' : 'neutral'
            }
          }}
        />
        
        <DrillDownCard
          title="Investment Portfolio"
          description="Portfolio performance & growth"
          to="/investments"
          icon={PiggyBank}
          color="green"
          metrics={{
            primary: formatCurrency(overview.financial_health.net_worth.investment_assets),
            secondary: "Current total portfolio value",
            trend: {
              value: `${formatPercentage(overview.cash_flow_analysis.investment_rate)} rate`,
              direction: 'up'
            }
          }}
        />
        
        <DrillDownCard
          title="Budget Review"
          description="Budget vs actual analysis"
          to="/budget"
          icon={Target}
          color="purple"
          metrics={{
            primary: formatPercentage(overview.budget_health.adherence_score),
            secondary: "Overall budget adherence",
            trend: {
              value: overview.budget_health.adherence_score > 80 ? 'Strong adherence' : 
                     overview.budget_health.adherence_score > 60 ? 'Minor issues' : 'Needs attention',
              direction: overview.budget_health.adherence_score > 80 ? 'up' : 
                        overview.budget_health.adherence_score > 60 ? 'neutral' : 'down'
            }
          }}
        />
        
        <DrillDownCard
          title="Year Trends"
          description="Year-over-year comparisons"
          to="/year-analysis"
          icon={TrendingUp}
          color="orange"
          metrics={{
            primary: formatCurrency(overview.financial_summary.monthly_financial_growth),
            secondary: "Average monthly growth rate",
            trend: {
              value: totalGrowth !== 0 ? `${totalGrowth > 0 ? '+' : ''}${growthPercent.toFixed(1)}% total growth` : 'Stable',
              direction: totalGrowth > 0 ? 'up' : totalGrowth < 0 ? 'down' : 'neutral'
            }
          }}
        />
      </div>
    </div>
  );
}