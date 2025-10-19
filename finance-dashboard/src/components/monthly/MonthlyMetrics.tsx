// src/components/monthly/MonthlyMetrics.tsx - FIXED: No internal grid, returns individual cards
import React from 'react';
import MetricCard from '../cards/MetricCard';
import { MonthlySummary } from '../../types/api';

interface MonthlyMetricsProps {
  summary: MonthlySummary;
  previousSummary?: MonthlySummary | null; // Allow null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateTrend(current: number, previous: number, isSpending: boolean = false): { direction: 'up' | 'down' | 'neutral', value: string, isPositive: boolean } {
  if (!previous || previous === 0 || !current || isNaN(current) || isNaN(previous)) {
    return { direction: 'neutral', value: 'No previous data', isPositive: true };
  }
  
  const percentChange = ((current - previous) / Math.abs(previous)) * 100;
  
  if (!isFinite(percentChange) || isNaN(percentChange)) {
    return { direction: 'neutral', value: 'No previous data', isPositive: true };
  }
  
  const direction = percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'neutral';
  
  // FIXED: For spending, down is good. For investments and net savings, up is good
  let isPositive;
  if (isSpending) {
    isPositive = percentChange <= 0; // For spending, down/same is good
  } else {
    isPositive = percentChange >= 0; // For investments/savings, up/same is good
  }
  
  return {
    direction,
    value: `${Math.abs(percentChange).toFixed(1)}%`,
    isPositive
  };
}

function getPreviousMonthName(currentMonthYear: string): string {
  const [monthName, year] = currentMonthYear.split(' ');
  const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
  const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthNames[prevMonth];
}

export default function MonthlyMetrics({ summary, previousSummary }: MonthlyMetricsProps) {
  // Use new backend fields with fallbacks
  const totalSpending = summary.total_minus_invest;
  const totalInvestments = summary.investment_total;
  const investmentDeposits = summary.investment_deposits || totalInvestments;
  const investmentWithdrawals = summary.investment_withdrawals || 0;
  const totalIncome = summary.income || summary.category_totals.Pay || 0;
  const netIncome = summary.net_income || totalIncome;

  // NEW: Use both net calculations from backend
  const netOverall = summary.net_overall || (netIncome - totalSpending - totalInvestments);
  const netWithoutInvestments = summary.net_without_investments || (netIncome - totalSpending);
  const burnRate = totalSpending / 30; // Daily burn rate

  // Previous month metrics for comparison
  const prevSpending = previousSummary?.total_minus_invest || 0;
  const prevInvestments = previousSummary?.investment_total || 0;
  const prevNetOverall = previousSummary?.net_overall || 0;
  const prevNetWithoutInvestments = previousSummary?.net_without_investments || 0;

  // Calculate trends with better error handling
  const spendingTrend = calculateTrend(totalSpending, prevSpending, true); // Spending: down is good
  const investmentTrend = calculateTrend(totalInvestments, prevInvestments, false); // Investment: up is good
  const netOverallTrend = calculateTrend(netOverall, prevNetOverall, false); // Net: up is good
  const netWithoutInvestTrend = calculateTrend(netWithoutInvestments, prevNetWithoutInvestments, false); // Net: up is good

  const prevMonthName = previousSummary ? getPreviousMonthName(summary.month_year) : 'Previous';

  // UPDATED: Show both net values
  return (
    <>
      {/* Hero Metric - Net Overall (true cash flow) */}
      <MetricCard
        title="Net Overall"
        value={formatCurrency(netOverall)}
        subtitle={investmentWithdrawals > 0 ? 'Income + withdrawals - spending' : 'Income - all spending'}
        variant="hero"
        indicator={netOverall > 500 ? 'success' : netOverall > 0 ? 'info' : 'warning'}
        trend={netOverallTrend.value !== 'No previous data' ? {
          value: `${netOverallTrend.value} vs ${prevMonthName}`,
          direction: netOverallTrend.direction,
          isPositive: netOverallTrend.isPositive
        } : undefined}
      />

      {/* NEW: Net w/o Investments */}
      <MetricCard
        title="Net w/o Investments"
        value={formatCurrency(netWithoutInvestments)}
        subtitle="Available before investing"
        variant={netWithoutInvestments > 0 ? 'success' : 'warning'}
        indicator={netWithoutInvestments > 500 ? 'success' : netWithoutInvestments > 0 ? 'info' : 'warning'}
        trend={netWithoutInvestTrend.value !== 'No previous data' ? {
          value: `${netWithoutInvestTrend.value} vs ${prevMonthName}`,
          direction: netWithoutInvestTrend.direction,
          isPositive: netWithoutInvestTrend.isPositive
        } : undefined}
      />

      {/* Supporting Metrics */}
      <MetricCard
        title="Total Spending"
        value={formatCurrency(totalSpending)}
        subtitle={`vs ${prevMonthName}: ${spendingTrend.isPositive ? 'decreased' : 'increased'}`}
        variant={spendingTrend.isPositive ? 'success' : 'warning'}
        indicator={spendingTrend.isPositive ? 'success' : 'warning'}
        trend={{
          value: `${spendingTrend.value} vs ${prevMonthName}`,
          direction: spendingTrend.direction,
          isPositive: spendingTrend.isPositive
        }}
      />

      <MetricCard
        title="Investments"
        value={formatCurrency(totalInvestments)}
        subtitle={
          investmentWithdrawals > 0
            ? `Deposits: ${formatCurrency(investmentDeposits)} | Withdrawals: ${formatCurrency(investmentWithdrawals)}`
            : investmentDeposits > 0 ? "Building wealth" : "No investments"
        }
        variant="info"
        indicator={totalInvestments > 0 ? 'success' : 'warning'}
        trend={investmentTrend.value !== 'No previous data' && investmentTrend.value !== 'No data' ? {
          value: `${investmentTrend.value} vs ${prevMonthName}`,
          direction: investmentTrend.direction,
          isPositive: totalInvestments > prevInvestments
        } : undefined}
      />
    </>
  );
}