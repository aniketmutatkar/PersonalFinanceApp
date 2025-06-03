// src/components/monthly/MonthlyMetrics.tsx
import React from 'react';
import MetricCard from '../cards/MetricCard';
import { MonthlySummary } from '../../types/api';

interface MonthlyMetricsProps {
  summary: MonthlySummary;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MonthlyMetrics({ summary }: MonthlyMetricsProps) {
  // Calculate key metrics
  const totalSpending = summary.total_minus_invest;
  const totalInvestments = summary.investment_total;
  const totalIncome = Math.abs(summary.category_totals.Pay || 0);
  const netSavings = totalIncome - totalSpending;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return (
    <div className="grid grid-cols-5 gap-8">
      <MetricCard
        title="Total Spending"
        value={formatCurrency(totalSpending)}
        subtitle="Excluding investments"
        variant="hero"
        className="col-span-2"
      />
      
      <MetricCard
        title="Investments"
        value={formatCurrency(totalInvestments)}
        subtitle="Total invested"
        variant="accent"
      />
      
      <MetricCard
        title="Income"
        value={formatCurrency(totalIncome)}
        subtitle="Monthly income"
        variant="default"
      />
      
      <MetricCard
        title="Savings Rate"
        value={`${savingsRate.toFixed(1)}%`}
        subtitle={savingsRate > 20 ? "Excellent" : savingsRate > 10 ? "Good" : "Needs Work"}
        variant={savingsRate > 20 ? "default" : savingsRate > 10 ? "default" : "warning"}
      />
    </div>
  );
}