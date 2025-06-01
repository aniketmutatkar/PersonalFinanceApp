import React from 'react';
import { useFinancialOverview, useSpendingPatterns, useYearComparison } from '../hooks/useApi';
import { MonthlyTrendChart, CategoryBreakdownChart } from '../components/charts';
import MetricCard from '../components/ui/MetricCard';
import QuickInvestigationActions from '../components/ui/QuickInvestigationActions';
import { useChartData } from '../components/charts';
import { ChartDataPoint } from '../types';

export const Dashboard: React.FC = () => {
  // Get real data from your API
  const { data: overview, loading: overviewLoading, error: overviewError } = useFinancialOverview();
  const { data: patterns, loading: patternsLoading } = useSpendingPatterns();
  const { data: yearComparison, loading: yearLoading } = useYearComparison();
  
  // Chart data transformation utilities
  const { transformFinancialData, aggregateByCategory } = useChartData();

  // Transform API data for charts
  const getCategoryChartData = (): ChartDataPoint[] => {
    if (!overview?.top_categories) return [];
    
    return overview.top_categories.map(category => ({
      x: category.category,
      y: category.total,
      category: category.category,
      metadata: {
        originalData: category,
        timestamp: Date.now()
      }
    }));
  };

  const getMonthlyTrendData = (): ChartDataPoint[] => {
    if (!yearComparison?.years) return [];
    
    // Get the most recent year's data
    const currentYear = Math.max(...Object.keys(yearComparison.years).map(Number));
    const yearData = yearComparison.years[currentYear.toString()];
    
    if (!yearData?.categories) return [];
    
    // Create monthly trend data (simplified - you'd get this from monthly summaries in reality)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => ({
      x: month,
      y: yearData.average_monthly_spending || 0 + (Math.random() - 0.5) * 200, // Simulated monthly variation
      category: 'spending',
      metadata: {
        month: `${currentYear}-${(index + 1).toString().padStart(2, '0')}`,
        year: currentYear
      }
    }));
  };

  // Loading state
  if (overviewLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (overviewError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Dashboard Error</h3>
          <p className="text-red-700">Failed to load financial data: {overviewError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!overview) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Financial Data</h3>
          <p className="text-gray-600">Upload some transaction data to get started with analysis.</p>
        </div>
      </div>
    );
  }

  const categoryData = getCategoryChartData();
  const trendData = getMonthlyTrendData();

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">
            Overview of {overview.date_range.total_months} months • 
            {overview.date_range.start_month} to {overview.date_range.end_month}
          </p>
        </div>
        
        {/* Pattern alerts */}
        {patterns && patterns.patterns.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              ⚠️ {patterns.patterns.length} pattern{patterns.patterns.length !== 1 ? 's' : ''} detected
            </span>
          </div>
        )}
      </div>

      {/* Financial Health Overview - Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Net Worth Change"
          value={`$${overview.financial_summary.net_worth_change.toLocaleString()}`}
          trend={{
            direction: overview.financial_summary.net_worth_change > 0 ? 'up' : 'down',
            value: `${Math.abs(overview.financial_summary.net_worth_change / overview.financial_summary.total_income * 100).toFixed(1)}%`,
            isPositive: overview.financial_summary.net_worth_change > 0
          }}
          investigationType="trend"
          investigationScope={{
            dateRange: {
              start: overview.date_range.start_month,
              end: overview.date_range.end_month
            }
          }}
          investigationTitle="Net Worth Trend Analysis"
          variant="default"
          icon={<span className="text-2xl">💰</span>}
        />

        <MetricCard
          title="Savings Rate"
          value={`${overview.financial_summary.overall_savings_rate}%`}
          trend={{
            direction: overview.financial_summary.overall_savings_rate > 20 ? 'up' : 'down',
            value: `vs 20% target`,
            isPositive: overview.financial_summary.overall_savings_rate > 20
          }}
          investigationType="pattern"
          investigationScope={{
            patternType: 'savings_rate',
            dateRange: {
              start: overview.date_range.start_month,
              end: overview.date_range.end_month
            }
          }}
          investigationTitle="Savings Rate Analysis"
          variant={overview.financial_summary.overall_savings_rate > 20 ? 'success' : 'warning'}
          icon={<span className="text-2xl">📈</span>}
        />

        <MetricCard
          title="Top Expense"
          value={overview.top_categories[0]?.category || 'N/A'}
          subtitle={overview.top_categories[0] ? `$${overview.top_categories[0].total.toLocaleString()}` : ''}
          investigationType="category"
          investigationScope={{
            category: overview.top_categories[0]?.category,
            dateRange: {
              start: overview.date_range.start_month,
              end: overview.date_range.end_month
            }
          }}
          investigationTitle={`Investigate ${overview.top_categories[0]?.category || 'Top Category'}`}
          variant="info"
          icon={<span className="text-2xl">🏷️</span>}
        />

        <MetricCard
          title="Monthly Average"
          value={`$${(overview.financial_summary.total_spending / overview.date_range.total_months).toLocaleString()}`}
          investigationType="monthly"
          investigationScope={{
            dateRange: {
              start: overview.date_range.start_month,
              end: overview.date_range.end_month
            }
          }}
          investigationTitle="Monthly Spending Analysis"
          variant="default"
          icon={<span className="text-2xl">📅</span>}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend Chart */}
        <MonthlyTrendChart
          title="Monthly Spending Trend"
          subtitle="Click any point to investigate that month"
          data={trendData}
          loading={yearLoading}
          enableInvestigation={true}
          height={400}
          chartProps={{
            colorScheme: 'expense',
            variant: 'area',
            smooth: true,
            showReferenceLine: true,
            referenceValue: overview.financial_summary.total_spending / overview.date_range.total_months,
            referenceLabel: 'Average'
          }}
        />

        {/* Category Breakdown Chart */}
        <CategoryBreakdownChart
          title="Top Spending Categories"
          subtitle="Click any slice to investigate that category"
          data={categoryData}
          loading={overviewLoading}
          enableInvestigation={true}
          height={400}
          chartProps={{
            variant: 'donut',
            showPercentages: true,
            maxSlices: 6,
            showLegend: true
          }}
        />
      </div>

      {/* Quick Investigation Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Investigations</h2>
        <QuickInvestigationActions
          variant="grid"
          showDescriptions={true}
          contextualActions={true}
        />
      </div>

      {/* Detected Patterns Summary */}
      {patterns && patterns.patterns.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-4">🔍 Detected Patterns</h2>
          <div className="space-y-3">
            {patterns.patterns.slice(0, 3).map((pattern, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-yellow-900 capitalize">
                      {pattern.type.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">{pattern.message}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    pattern.severity === 'warning' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {pattern.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};