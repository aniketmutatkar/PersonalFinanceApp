// src/components/budget/BudgetMetrics.tsx
import React, { useMemo } from 'react';
import MetricCard from '../cards/MetricCard';

interface BudgetMetricsProps {
  data: any;
  type: 'yearly' | 'monthly';
  year?: number;
  monthYear?: string;
}

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

export default function BudgetMetrics({ data, type, year, monthYear }: BudgetMetricsProps) {
  const metrics = useMemo(() => {
    console.log('BudgetMetrics data:', data); // Debug log
    console.log('BudgetMetrics type:', type); // Debug log
    
    if (type === 'monthly') {
      // Monthly budget metrics
      const totalBudget = Number(data.total_budget) || 0;
      const totalActual = Number(data.total_actual) || 0;
      const totalVariance = Number(data.total_variance) || 0;
      const adherenceRate = totalBudget > 0 ? ((totalBudget - Math.abs(totalVariance)) / totalBudget) * 100 : 0;
      
      console.log('Monthly metrics:', { totalBudget, totalActual, totalVariance, adherenceRate }); // Debug
      
      const overBudgetCount = data.budget_items?.filter((item: any) => item.is_over_budget).length || 0;
      const totalCategories = data.budget_items?.length || 0;
      const onTrackCategories = totalCategories - overBudgetCount;

      return {
        totalBudget,
        totalActual,
        totalVariance,
        adherenceRate,
        overBudgetCount,
        onTrackCategories,
        totalCategories
      };
    } else {
      // Yearly budget metrics - aggregate across all months
      const months = data.months || [];
      const budgetData = data.budget_data || {};
      
      let totalBudget = 0;
      let totalActual = 0;
      let overBudgetInstances = 0;
      let totalInstances = 0;

      months.forEach((month: string) => {
        const monthData = budgetData[month] || {};
        Object.values(monthData).forEach((item: any) => {
          const budgetAmt = Number(item.budget_amount) || 0;
          const actualAmt = Number(item.actual_amount) || 0;
          totalBudget += budgetAmt;
          totalActual += actualAmt;
          totalInstances++;
          if (item.is_over_budget) {
            overBudgetInstances++;
          }
        });
      });

      const totalVariance = totalBudget - totalActual;
      const adherenceRate = totalBudget > 0 ? ((totalBudget - Math.abs(totalVariance)) / totalBudget) * 100 : 0;
      const onTrackPercentage = totalInstances > 0 ? ((totalInstances - overBudgetInstances) / totalInstances) * 100 : 0;

      return {
        totalBudget: totalBudget / months.length, // Average monthly budget
        totalActual: totalActual / months.length, // Average monthly actual
        totalVariance: totalVariance / months.length, // Average monthly variance
        adherenceRate,
        overBudgetInstances,
        onTrackPercentage,
        totalInstances,
        monthsAnalyzed: months.length
      };
    }
  }, [data, type]);

  if (type === 'monthly') {
    return (
      <div className="grid grid-cols-5 gap-8">
        <MetricCard
          title="Monthly Budget"
          value={formatCurrency(metrics.totalBudget)}
          subtitle="Total planned spending"
          variant="default"
        />
        
        <MetricCard
          title="Actual Spending"
          value={formatCurrency(metrics.totalActual)}
          subtitle="Total actual spending"
          variant={metrics.totalVariance < 0 ? "warning" : "default"}
        />
        
        <MetricCard
          title="Variance"
          value={formatCurrency(Math.abs(metrics.totalVariance))}
          subtitle={metrics.totalVariance >= 0 ? "Under budget" : "Over budget"}
          variant={metrics.totalVariance >= 0 ? "default" : "warning"}
        />
        
        <MetricCard
          title="Budget Adherence"
          value={formatPercentage(metrics.adherenceRate)}
          subtitle={metrics.adherenceRate > 80 ? "Excellent" : metrics.adherenceRate > 60 ? "Good" : "Needs Work"}
          variant={metrics.adherenceRate > 80 ? "default" : metrics.adherenceRate > 60 ? "accent" : "warning"}
        />
        
        <MetricCard
          title="Categories On Track"
          value={`${metrics.onTrackCategories}/${metrics.totalCategories}`}
          subtitle={`${metrics.overBudgetCount} over budget`}
          variant={metrics.overBudgetCount === 0 ? "default" : "warning"}
        />
      </div>
    );
  } else {
    return (
      <div className="grid grid-cols-5 gap-8">
        <MetricCard
          title="Avg Monthly Budget"
          value={formatCurrency(metrics.totalBudget)}
          subtitle={`Across ${metrics.monthsAnalyzed} months`}
          variant="default"
        />
        
        <MetricCard
          title="Avg Monthly Spending"
          value={formatCurrency(metrics.totalActual)}
          subtitle="Average actual spending"
          variant={metrics.totalVariance < 0 ? "warning" : "default"}
        />
        
        <MetricCard
          title="Avg Variance"
          value={formatCurrency(Math.abs(metrics.totalVariance))}
          subtitle={metrics.totalVariance >= 0 ? "Under budget avg" : "Over budget avg"}
          variant={metrics.totalVariance >= 0 ? "default" : "warning"}
        />
        
        <MetricCard
          title="Overall Adherence"
          value={formatPercentage(metrics.adherenceRate)}
          subtitle={`${year} performance`}
          variant={metrics.adherenceRate > 80 ? "default" : metrics.adherenceRate > 60 ? "accent" : "warning"}
        />
        
        <MetricCard
          title="On-Track Rate"
          value={formatPercentage(metrics.onTrackPercentage || 0)}
          subtitle={`${metrics.overBudgetInstances} over-budget instances`}
          variant={(metrics.onTrackPercentage || 0) > 80 ? "default" : "warning"}
        />
      </div>
    );
  }
}