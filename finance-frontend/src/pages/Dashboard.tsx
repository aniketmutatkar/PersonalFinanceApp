import React, { useState, useMemo } from 'react';
import { MetricCard } from '../components/MetricCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { TransactionTable } from '../components/TransactionTable';
import { DateRangeSelector, DateRangeOption } from '../components/DateRangeSelector';
import { BudgetBreakdown } from '../components/BudgetBreakdown';
import { useMonthlySummaries, useTransactions, useBudgets } from '../hooks/useApi';

export const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRangeOption>('last3');

  // API calls
  const { data: summariesData, loading: summariesLoading, error: summariesError, refetch: refetchSummaries } = useMonthlySummaries();
  const { data: transactionsData, loading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useTransactions({ page: 1, page_size: 10 });
  const { data: budgetsData, loading: budgetsLoading, error: budgetsError, refetch: refetchBudgets } = useBudgets();

  // Get most recent month for some specific calculations
  const mostRecentMonth = useMemo(() => {
    if (!summariesData?.summaries) return null;
    
    const summaries = summariesData.summaries;
    // Get the most recent month (first in sorted array)
    return summaries[0] || null;
  }, [summariesData]);

  // Calculate date range for averages
  const getFilteredSummaries = useMemo(() => {
    if (!summariesData?.summaries) return [];
    
    const summaries = summariesData.summaries;
    const now = new Date();
    
    let filtered = [];
    switch (dateRange) {
      case 'last3':
        filtered = summaries.slice(0, 3);
        break;
      case 'last6':
        filtered = summaries.slice(0, 6);
        break;
      case 'last12':
        filtered = summaries.slice(0, 12);
        break;
      case 'ytd':
        filtered = summaries.filter(s => s.year === now.getFullYear());
        break;
      default:
        filtered = summaries.slice(0, 3);
    }
    
    // Debug logging
    console.log(`Date range: ${dateRange}, Filtered summaries:`, filtered.length);
    console.log('Filtered data:', filtered.map(s => ({
      month_year: s.month_year,
      total_minus_invest: s.total_minus_invest
    })));
    
    return filtered;
  }, [summariesData, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!summariesData?.summaries || summariesData.summaries.length === 0) {
      return {
        totalSpending: 0,
        averageSpending: 0,
        totalInvestments: 0,
        savingsRate: 0,
        topCategory: 'N/A',
        budgetStatus: 'unknown'
      };
    }

    const allSummaries = summariesData.summaries;
    const investmentCategories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab'];
    
    // DEBUG: Log all the raw data
    console.log('🔍 DASHBOARD DEBUG - Raw Data:');
    console.log('- Total summaries:', allSummaries.length);
    console.log('- All summaries:', allSummaries.map(s => ({
      month_year: s.month_year,
      year: s.year,
      total_minus_invest: s.total_minus_invest,
      category_totals: s.category_totals
    })));
    
    // Calculate Year-to-Date totals
    const currentYear = new Date().getFullYear();
    const ytdSummaries = allSummaries.filter(s => s.year === currentYear);
    
    console.log('🔍 YTD Filtering:');
    console.log('- Current year:', currentYear);
    console.log('- YTD summaries count:', ytdSummaries.length);
    console.log('- YTD months:', ytdSummaries.map(s => s.month_year));
    
    // YTD Total Spending (excluding investments)
    const spendingBreakdown = ytdSummaries.map(s => ({
      month: s.month_year,
      spending: Number(s.total_minus_invest) || 0
    }));
    
    const totalSpending = ytdSummaries.reduce((sum, s) => sum + (Number(s.total_minus_invest) || 0), 0);
    
    console.log('🔍 YTD Spending Calculation:');
    console.log('- Monthly breakdown:', spendingBreakdown);
    console.log('- Total YTD spending:', totalSpending);
    
    // YTD Total Investments
    const investmentBreakdown = ytdSummaries.map(s => {
      const monthInvestments = investmentCategories.reduce((catSum, cat) => 
        catSum + Math.abs(Number(s.category_totals[cat]) || 0), 0);
      return {
        month: s.month_year,
        investments: monthInvestments,
        breakdown: investmentCategories.map(cat => ({
          category: cat,
          amount: Number(s.category_totals[cat]) || 0
        }))
      };
    });
    
    const totalInvestments = ytdSummaries.reduce((sum, s) => {
      return sum + investmentCategories.reduce((catSum, cat) => 
        catSum + Math.abs(Number(s.category_totals[cat]) || 0), 0);
    }, 0);
    
    console.log('🔍 YTD Investment Calculation:');
    console.log('- Monthly investment breakdown:', investmentBreakdown);
    console.log('- Total YTD investments:', totalInvestments);
    
    // YTD Total Income
    const incomeBreakdown = ytdSummaries.map(s => ({
      month: s.month_year,
      income: Math.abs(Number(s.category_totals['Pay']) || 0)
    }));
    
    const totalIncome = ytdSummaries.reduce((sum, s) => sum + Math.abs(Number(s.category_totals['Pay']) || 0), 0);
    
    console.log('🔍 YTD Income Calculation:');
    console.log('- Monthly income breakdown:', incomeBreakdown);
    console.log('- Total YTD income:', totalIncome);
    
    // Overall Savings Rate: (Income - Non-Investment Expenses) / Income * 100
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0;
    
    console.log('🔍 Savings Rate Calculation:');
    console.log('- Formula: (Income - Spending) / Income * 100');
    console.log('- Calculation: (' + totalIncome + ' - ' + totalSpending + ') / ' + totalIncome + ' * 100');
    console.log('- Savings rate:', savingsRate + '%');

    // Average spending calculation (unchanged - uses date range selector)
    const averageSpending = getFilteredSummaries.length > 0 
      ? getFilteredSummaries.reduce((sum, s) => sum + (Number(s.total_minus_invest) || 0), 0) / getFilteredSummaries.length
      : 0;
    
    console.log('🔍 Average Spending Calculation:');
    console.log('- Date range:', dateRange);
    console.log('- Filtered summaries:', getFilteredSummaries.length);
    console.log('- Average spending:', averageSpending);
    
    // Handle NaN values
    const safeAverageSpending = isNaN(averageSpending) || !isFinite(averageSpending) ? 0 : averageSpending;

    // Top category across all YTD data
    const categoryTotals: Record<string, number> = {};
    const excludeCategories = ['Pay', 'Payment', ...investmentCategories];
    
    ytdSummaries.forEach(summary => {
      Object.entries(summary.category_totals || {}).forEach(([cat, amount]) => {
        if (!excludeCategories.includes(cat)) {
          categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(Number(amount) || 0);
        }
      });
    });
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    console.log('🔍 Top Category Calculation:');
    console.log('- Category totals:', categoryTotals);
    console.log('- Top category:', topCategory);

    // Budget status based on most recent month
    let budgetStatus = 'unknown';
    if (budgetsData && mostRecentMonth) {
      const totalBudget = Object.values(budgetsData).reduce((sum, budget) => sum + budget, 0);
      const recentSpending = Number(mostRecentMonth.total_minus_invest) || 0;
      const budgetUtilization = recentSpending / totalBudget;
      
      console.log('🔍 Budget Status Calculation:');
      console.log('- Most recent month:', mostRecentMonth.month_year);
      console.log('- Recent spending:', recentSpending);
      console.log('- Total budget:', totalBudget);
      console.log('- Budget utilization:', (budgetUtilization * 100) + '%');
      
      if (budgetUtilization <= 0.8) budgetStatus = 'on-track';
      else if (budgetUtilization <= 1.0) budgetStatus = 'near-limit';
      else budgetStatus = 'over-budget';
    }

    const finalMetrics = {
      totalSpending,
      averageSpending: safeAverageSpending,
      totalInvestments,
      savingsRate: isNaN(savingsRate) || !isFinite(savingsRate) ? 0 : savingsRate,
      topCategory,
      budgetStatus
    };

    console.log('🔍 FINAL METRICS:', finalMetrics);
    console.log('=====================================');

    return finalMetrics;
  }, [summariesData, getFilteredSummaries, budgetsData, mostRecentMonth, dateRange]);

  // Budget breakdown data (use most recent month for budget comparison)
  const budgetItems = useMemo(() => {
    if (!budgetsData || !mostRecentMonth) return [];

    return Object.entries(budgetsData)
      .filter(([category, budget]) => budget > 0)
      .map(([category, budget]) => {
        const actual = Math.abs(Number(mostRecentMonth.category_totals[category]) || 0);
        const percentage = budget > 0 ? (actual / budget) * 100 : 0;
        
        let status: 'under' | 'near' | 'over' = 'under';
        if (percentage >= 100) status = 'over';
        else if (percentage >= 90) status = 'near';

        return {
          category,
          budget,
          actual,
          percentage,
          status
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgetsData, mostRecentMonth]);

  // Calculate month-over-month changes
  const monthOverMonthChanges = useMemo(() => {
    if (!summariesData?.summaries || summariesData.summaries.length < 2) {
      return { spending: 0, investments: 0 };
    }

    const [current, previous] = summariesData.summaries;
    const currentSpending = Number(current.total_minus_invest) || 0;
    const previousSpending = Number(previous.total_minus_invest) || 0;
    
    const spendingChange = previousSpending > 0 
      ? ((currentSpending - previousSpending) / previousSpending) * 100
      : 0;
    
    const investmentCategories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab'];
    const currentInvestments = investmentCategories.reduce((sum, cat) => 
      sum + Math.abs(Number(current.category_totals[cat]) || 0), 0);
    const previousInvestments = investmentCategories.reduce((sum, cat) => 
      sum + Math.abs(Number(previous.category_totals[cat]) || 0), 0);
    
    const investmentChange = previousInvestments > 0
      ? ((currentInvestments - previousInvestments) / previousInvestments) * 100
      : 0;

    return {
      spending: spendingChange,
      investments: investmentChange
    };
  }, [summariesData]);

  // Loading and error states
  if (summariesLoading || transactionsLoading || budgetsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (summariesError || transactionsError || budgetsError) {
    const errorMessage = summariesError || transactionsError || budgetsError || 'Unknown error';
    return (
      <ErrorMessage 
        message={errorMessage}
        onRetry={() => {
          refetchSummaries();
          refetchTransactions();
          refetchBudgets();
        }}
      />
    );
  }

  const getBudgetStatusText = (status: string): string => {
    switch (status) {
      case 'on-track': return 'On Track';
      case 'near-limit': return 'Near Limit';
      case 'over-budget': return 'Over Budget';
      default: return 'Unknown';
    }
  };

  const getBudgetStatusColor = (status: string): 'positive' | 'negative' | 'neutral' => {
    switch (status) {
      case 'on-track': return 'positive';
      case 'over-budget': return 'negative';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="text-gray-400">
          Financial overview - Year to Date {new Date().getFullYear()}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* YTD Total Spending */}
        <MetricCard
          title="YTD Total Spending"
          value={metrics.totalSpending}
          change={monthOverMonthChanges.spending}
          changeType={monthOverMonthChanges.spending <= 0 ? 'positive' : 'negative'}
        />

        {/* Average Spending */}
        <MetricCard
          title="Average Spending"
          value={metrics.averageSpending}
          dropdown={
            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
            />
          }
        />

        {/* YTD Total Investments */}
        <MetricCard
          title="YTD Total Investments"
          value={metrics.totalInvestments}
          change={monthOverMonthChanges.investments}
          changeType={monthOverMonthChanges.investments >= 0 ? 'positive' : 'negative'}
        />

        {/* Overall Savings Rate */}
        <MetricCard
          title="YTD Savings Rate"
          value={`${metrics.savingsRate.toFixed(1)}%`}
          changeType={metrics.savingsRate >= 20 ? 'positive' : metrics.savingsRate >= 10 ? 'neutral' : 'negative'}
        />

        {/* Top Expense Category */}
        <MetricCard
          title="Top YTD Category"
          value={metrics.topCategory}
        />

        {/* Budget Status */}
        <MetricCard
          title="Budget Status"
          value={getBudgetStatusText(metrics.budgetStatus)}
          changeType={getBudgetStatusColor(metrics.budgetStatus)}
          details={budgetItems.length > 0 ? (
            <BudgetBreakdown budgetItems={budgetItems} />
          ) : undefined}
        />
      </div>

      {/* Recent Transactions */}
      <TransactionTable 
        transactions={transactionsData?.items || []}
      />
    </div>
  );
};