// src/pages/Dashboard.tsx - FIXED VERSION with REAL DATA
import React from 'react';
import { useFinancialOverview, usePortfolioTrends, useMonthlySummaries } from '../hooks/useApiData';
import { Calendar, TrendingUp, Target, PiggyBank } from 'lucide-react';
import MetricCard from '../components/cards/MetricCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import NetWorthChart from '../components/dashboard/NetWorthChart';
import FinancialPatternChart from '../components/dashboard/FinancialPatternChart';
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
  return `${months.toFixed(1)}m`;
}

// REAL DATA: Process actual portfolio trends for net worth chart
function processRealNetWorthData(portfolioTrends: any) {
  if (!portfolioTrends?.monthly_values) return [];
  
  return portfolioTrends.monthly_values.map((month: any) => ({
    month: month.month_display,
    net_worth: month.total_value,
    liquid_assets: month.wealthfront_cash || 0,
    investment_assets: month.total_value - (month.wealthfront_cash || 0)
  }));
}

// REAL DATA: Process actual monthly summaries for pattern chart
function processRealPatternData(monthlySummaries: any[]) {
  if (!monthlySummaries) return [];
  
  // Use the ACTUAL monthly data instead of generating fake data
  return monthlySummaries.slice(-12).map((summary: any) => {
    const income = Math.abs(parseFloat(summary.category_totals['Pay'] || '0'));
    const spending = parseFloat(summary.total_minus_invest || '0');
    const investment = parseFloat(summary.investment_total || '0');
    
    // CORRECT: Surplus = Income - Spending - Investments (what's left over)
    const surplus = income - spending - Math.abs(investment);
    
    return {
      name: summary.month.slice(0, 3), // "Jan", "Feb", etc.
      spending: Math.round(spending),
      investment: Math.round(Math.abs(investment)),
      surplus: Math.round(surplus),
      income: Math.round(income)
    };
  });
}

// REAL DATA: Enhanced category insights using real variance
function CategoryInsights({ overview, monthlySummaries }: { overview: any, monthlySummaries: any[] }) {
  const categories = overview.spending_intelligence.top_categories.slice(0, 5);
  
  // Calculate REAL variance from last 6 months vs 6 months before that
  const categoriesWithRealVariance = categories.map((cat: any) => {
    if (!monthlySummaries || monthlySummaries.length < 12) {
      return { ...cat, variance: 0, direction: 'neutral' };
    }
    
    // Last 6 months average
    const recent6Months = monthlySummaries.slice(0, 6);
    const recentAvg = recent6Months.reduce((sum, summary) => 
      sum + Math.abs(parseFloat(summary.category_totals[cat.category] || '0')), 0) / 6;
    
    // Previous 6 months average  
    const previous6Months = monthlySummaries.slice(6, 12);
    const previousAvg = previous6Months.reduce((sum, summary) => 
      sum + Math.abs(parseFloat(summary.category_totals[cat.category] || '0')), 0) / 6;
    
    const variance = recentAvg - previousAvg;
    const direction = variance > 50 ? 'up' : variance < -50 ? 'down' : 'neutral';
    
    return {
      ...cat,
      variance: variance,
      direction
    };
  });

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 h-full">
      <h3 className="text-white font-semibold mb-4 text-lg">Category Analysis</h3>
      <div className="text-xs text-gray-400 mb-4">Last 6 months vs previous 6 months</div>
      
      <div className="space-y-3">
        {categoriesWithRealVariance.map((cat: any, index: number) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-gray-300 text-sm font-medium">{cat.category}</span>
            <div className="flex items-center space-x-3">
              <span className="text-white font-medium">
                {formatCurrency(cat.monthly_average)}
              </span>
              <span className={`text-xs font-medium ${
                cat.direction === 'up' ? 'text-red-400' :
                cat.direction === 'down' ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {cat.direction === 'up' && `+${Math.abs(cat.variance).toFixed(0)}`}
                {cat.direction === 'down' && `-${Math.abs(cat.variance).toFixed(0)}`}
                {cat.direction === 'neutral' && '~avg'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">Spending pattern</div>
        <div className="text-sm text-gray-300 mt-1">
          {overview.spending_intelligence.discretionary_ratio.toFixed(0)}% discretionary spending
        </div>
      </div>
    </div>
  );
}

// Enhanced Investment Insights with real explanations
function InvestmentInsights({ overview }: { overview: any }) {
  const investmentRate = overview.cash_flow_analysis.investment_rate;
  const monthlyInvestment = overview.cash_flow_analysis.monthly_investments;
  const totalInvested = overview.financial_health.net_worth.investment_assets;
  const totalNetWorth = overview.financial_health.net_worth.total_net_worth;
  
  const investmentRatio = (totalInvested / totalNetWorth) * 100;
  
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 h-full">
      <h3 className="text-white font-semibold mb-4 text-lg">Investment Analysis</h3>
      
      <div className="space-y-4">
        {/* Investment Rate */}
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-400 font-medium">Investment Rate</span>
            <span className="text-2xl font-bold text-blue-400">
              {formatPercentage(investmentRate)}
            </span>
          </div>
          <div className="text-sm text-gray-300">
            {formatCurrency(monthlyInvestment)}/month of {formatCurrency(overview.cash_flow_analysis.monthly_income)} income
          </div>
          <div className="text-xs text-blue-300 mt-1">
            {investmentRate > 40 ? 'Exceptionally aggressive' :
             investmentRate > 30 ? 'Very aggressive' :
             investmentRate > 20 ? 'Aggressive' :
             investmentRate > 15 ? 'Moderate' : 'Conservative'} investment strategy
          </div>
        </div>

        {/* Investment Ratio */}
        <div className="bg-green-900/20 rounded-lg p-4 border border-green-800/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-400 font-medium">Investment Ratio</span>
            <span className="text-xl font-bold text-green-400">
              {formatPercentage(investmentRatio)}
            </span>
          </div>
          <div className="text-xs text-gray-300">
            {formatCurrency(totalInvested)} invested of {formatCurrency(totalNetWorth)} total net worth
          </div>
          <div className="text-xs text-green-300 mt-1">
            Shows how much of your wealth is in investments vs liquid cash
          </div>
        </div>
      </div>
    </div>
  );
}

// Current Month Summary using real data
function CurrentMonthSummary({ overview }: { overview: any }) {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const income = overview.cash_flow_analysis.monthly_income;
  const spending = overview.cash_flow_analysis.monthly_spending;
  const investments = overview.cash_flow_analysis.monthly_investments;
  const surplus = overview.cash_flow_analysis.monthly_cash_flow;
  
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 h-full">
      <h3 className="text-white font-semibold mb-4 text-lg">Current Month</h3>
      
      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-400">{currentMonth}</div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(income)}
          </div>
          <div className="text-sm text-gray-300">total income</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Spent</div>
            <div className="text-red-400 font-medium text-lg">
              {formatCurrency(spending)}
            </div>
            <div className="text-xs text-gray-500">
              {formatPercentage((spending / income) * 100)} of income
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Invested</div>
            <div className="text-blue-400 font-medium text-lg">
              {formatCurrency(investments)}
            </div>
            <div className="text-xs text-gray-500">
              {formatPercentage((investments / income) * 100)} of income
            </div>
          </div>
        </div>

        {/* Real Surplus Calculation */}
        <div className={`rounded-lg p-4 border ${
          surplus >= 0 ? 'bg-green-900/20 border-green-800/30' : 'bg-orange-900/20 border-orange-800/30'
        }`}>
          <div className="text-xs text-gray-400 mb-1">
            Net Surplus = Income - Spending - Investments
          </div>
          <div className={`text-xl font-bold ${surplus >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
            {formatCurrency(surplus)}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {surplus >= 0 ? 
              'Money left over after all expenses and investments' : 
              'Investing more than available cash flow'
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading, isError, error } = useFinancialOverview();
  const { data: portfolioTrends, isLoading: portfolioLoading } = usePortfolioTrends();
  const { data: monthlySummariesResponse, isLoading: summariesLoading } = useMonthlySummaries();

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

  // REAL DATA: Process actual API data instead of generating fake data
  const netWorthData = portfolioTrends ? processRealNetWorthData(portfolioTrends) : [];
  const patternData = monthlySummariesResponse?.summaries ? 
    processRealPatternData(monthlySummariesResponse.summaries) : [];

  // Calculate real growth metrics from actual data
  const currentNetWorth = overview.financial_health.net_worth.total_net_worth;
  const oldestNetWorth = netWorthData[0]?.net_worth || currentNetWorth;
  const totalGrowth = currentNetWorth - oldestNetWorth;
  const growthPercent = oldestNetWorth > 0 ? (totalGrowth / oldestNetWorth) * 100 : 0;

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

      {/* Main Charts Row - USING REAL DATA */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <NetWorthChart 
            data={netWorthData} 
            currentNetWorth={currentNetWorth}
          />
        </div>

        <div className="col-span-5">
          <CurrentMonthSummary overview={overview} />
        </div>
      </div>

      {/* Financial Pattern Chart - USING REAL DATA */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <FinancialPatternChart 
            monthlyData={patternData}
            currentSurplus={overview.cash_flow_analysis.monthly_cash_flow}
          />
        </div>
      </div>

      {/* Analysis Row - USING REAL DATA */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <InvestmentInsights overview={overview} />
        </div>

        <div className="col-span-8">
          <CategoryInsights 
            overview={overview} 
            monthlySummaries={monthlySummariesResponse?.summaries || []}
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
            secondary: "Current month spending",
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
            secondary: "Total invested assets",
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
            secondary: `${overview.budget_health.categories_on_track}/${overview.budget_health.total_categories} categories on track`,
            trend: {
              value: overview.budget_health.adherence_score > 80 ? 'On track' : 
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
            secondary: "Monthly growth rate",
            trend: {
              value: totalGrowth !== 0 ? `${totalGrowth > 0 ? '+' : ''}${growthPercent.toFixed(1)}% growth` : 'Stable',
              direction: totalGrowth > 0 ? 'up' : totalGrowth < 0 ? 'down' : 'neutral'
            }
          }}
        />
      </div>
    </div>
  );
}