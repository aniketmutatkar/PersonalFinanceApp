// src/pages/Dashboard.tsx
import React from 'react';
import { useFinancialOverview } from '../hooks/useApiData';
import MetricCard from '../components/cards/MetricCard';
import InsightCard from '../components/cards/InsightCard';
import AlertCard from '../components/cards/AlertCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

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

export default function Dashboard() {
  const { data: overview, isLoading, isError, error } = useFinancialOverview();

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

  if (isLoading || !overview) {
    return (
      <div className="h-full">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Financial Dashboard</h1>
          <div className="h-4 w-64 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-8 h-full">
          <LoadingSkeleton variant="metric" className="col-span-8 h-48" />
          <LoadingSkeleton variant="metric" className="col-span-4 h-48" />
          <LoadingSkeleton variant="list" lines={5} className="col-span-6 h-64" />
          <LoadingSkeleton variant="list" lines={4} className="col-span-6 h-64" />
        </div>
      </div>
    );
  }

  // Prepare data for components
  const topCategories = overview.spending_intelligence.top_categories.slice(0, 5).map(cat => ({
    name: cat.category,
    amount: cat.total_amount,
    trend: `${formatCurrency(cat.monthly_average)}/mo`
  }));

  const spendingPatterns = [
    {
      label: '3-month trend',
      value: `${overview.spending_intelligence.spending_patterns.three_month_trend > 0 ? '+' : ''}${overview.spending_intelligence.spending_patterns.three_month_trend.toFixed(1)}%`,
      direction: overview.spending_intelligence.spending_patterns.three_month_trend > 0 ? 'up' as const : 
                 overview.spending_intelligence.spending_patterns.three_month_trend < 0 ? 'down' as const : 'neutral' as const
    },
    {
      label: 'Discretionary ratio',
      value: `${overview.spending_intelligence.discretionary_ratio.toFixed(0)}%`,
      direction: 'neutral' as const
    },
    {
      label: 'Fixed expenses',
      value: formatCurrency(overview.spending_intelligence.fixed_expenses),
      direction: 'neutral' as const
    },
    {
      label: 'Variable expenses',
      value: formatCurrency(overview.spending_intelligence.spending_patterns.discretionary_expenses),
      direction: 'neutral' as const
    }
  ];

  // Helper function to get runway status color
  const getRunwayVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'default';
      case 'good': return 'default';
      case 'fair': return 'accent';
      case 'poor': return 'warning';
      default: return 'default';
    }
  };

  // Helper function to get stability status color
  const getStabilityVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'hero';
      case 'good': return 'default';
      case 'fair': return 'accent';
      case 'needs attention': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Financial Overview</h1>
        <p className="text-sm text-gray-400">
          {overview.date_range.start_month} — {overview.date_range.end_month} • {overview.date_range.total_months} months analyzed
        </p>
      </div>

      {/* Dashboard Grid - fills remaining height */}
      <div className="flex-1 grid grid-cols-12 gap-8">
        
        {/* Top Row: Financial Health Hero Section */}
        <div className="col-span-12 grid grid-cols-5 gap-8">
          
          {/* Net Worth - Main Hero Card */}
          <MetricCard
            title="Total Net Worth"
            value={formatCurrency(overview.financial_health.net_worth.total_net_worth)}
            subtitle={`${formatCurrency(overview.financial_health.net_worth.liquid_assets)} liquid • ${formatCurrency(overview.financial_health.net_worth.investment_assets)} invested`}
            variant="hero"
            className="col-span-2"
            trend={{
              value: overview.financial_health.net_worth.liquidity_status,
              direction: 'up'
            }}
          />
          
          {/* Financial Runway */}
          <MetricCard
            title="Emergency Fund Runway"
            value={`${overview.financial_health.runway.runway_months.toFixed(1)} months`}
            subtitle={`${formatCurrency(overview.financial_health.runway.total_liquid_assets)} available`}
            variant={getRunwayVariant(overview.financial_health.runway.runway_status)}
            trend={{
              value: overview.financial_health.runway.runway_status,
              direction: overview.financial_health.runway.runway_months >= 6 ? 'up' : 
                        overview.financial_health.runway.runway_months >= 3 ? 'neutral' : 'down'
            }}
          />
          
          {/* Financial Stability Score */}
          <MetricCard
            title="Financial Stability"
            value={`${overview.financial_health.stability_assessment.overall_score}/100`}
            subtitle={overview.financial_health.stability_assessment.status}
            variant={getStabilityVariant(overview.financial_health.stability_assessment.status)}
            trend={{
              value: `${formatPercentage(overview.financial_summary.overall_savings_rate)} savings rate`,
              direction: overview.financial_summary.overall_savings_rate > 15 ? 'up' : 'neutral'
            }}
          />
          
          {/* Liquidity Ratio */}
          <MetricCard
            title="Liquidity Ratio"
            value={formatPercentage(overview.financial_health.net_worth.liquidity_ratio * 100)}
            subtitle="Liquid vs Total Assets"
            variant="default"
            trend={{
              value: overview.financial_health.net_worth.liquidity_status,
              direction: overview.financial_health.net_worth.liquidity_ratio > 0.15 ? 'up' : 'neutral'
            }}
          />
        </div>

        {/* Second Row: Cash Flow & Investment Metrics */}
        <div className="col-span-8 grid grid-cols-3 gap-8">
          <MetricCard
            title="Monthly Cash Flow"
            value={formatCurrency(overview.cash_flow_analysis.monthly_cash_flow)}
            subtitle="Net position change"
            variant="default"
            trend={{
              value: `${formatCurrency(overview.financial_summary.monthly_financial_growth)}/mo growth`,
              direction: overview.cash_flow_analysis.monthly_cash_flow > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Investment Rate"
            value={formatPercentage(overview.cash_flow_analysis.investment_rate)}
            subtitle="of income invested"
            variant="accent"
            trend={{
              value: `${formatCurrency(overview.cash_flow_analysis.monthly_investments)}/mo`,
              direction: overview.cash_flow_analysis.investment_rate > 15 ? 'up' : 'neutral'
            }}
          />
          
          <MetricCard
            title="Savings Rate"
            value={formatPercentage(overview.financial_summary.overall_savings_rate)}
            subtitle={overview.financial_summary.overall_savings_rate > 20 ? "Excellent" : 
                     overview.financial_summary.overall_savings_rate > 15 ? "Good" : "Needs Improvement"}
            variant={overview.financial_summary.overall_savings_rate > 15 ? "default" : "warning"}
          />
        </div>

        {/* Financial Insights & Alerts */}
        <div className="col-span-4 grid grid-cols-1 gap-8">
          <AlertCard
            title="Financial Insights"
            alerts={overview.financial_health.key_insights.map(insight => ({
              type: insight.type,
              message: insight.message,
              severity: insight.type as 'info' | 'warning' | 'error'
            }))}
          />
          
          <MetricCard
            title="Budget Adherence"
            value={formatPercentage(overview.budget_health.adherence_score)}
            subtitle={`${overview.budget_health.categories_on_track} of ${overview.budget_health.total_categories} categories on track`}
            variant={overview.budget_health.adherence_score > 80 ? "default" : "warning"}
          />
        </div>

        {/* Third Row: Spending Intelligence */}
        <div className="col-span-8 grid grid-cols-2 gap-8">
          <InsightCard
            title="Top Expense Categories"
            type="categories"
            data={topCategories}
          />

          <InsightCard
            title="Spending Patterns"
            type="patterns"
            data={spendingPatterns}
          />
        </div>

        {/* Spending Extremes & Additional Alerts */}
        <div className="col-span-4 grid grid-cols-1 gap-8">
          <MetricCard
            title="Highest Spending Month"
            value={formatCurrency(overview.spending_extremes.highest_month.amount)}
            subtitle={overview.spending_extremes.highest_month.month_year}
            variant="default"
          />
          
          <MetricCard
            title="Lowest Spending Month"
            value={formatCurrency(overview.spending_extremes.lowest_month.amount)}
            subtitle={overview.spending_extremes.lowest_month.month_year}
            variant="default"
          />
        </div>
      </div>
    </div>
  );
}