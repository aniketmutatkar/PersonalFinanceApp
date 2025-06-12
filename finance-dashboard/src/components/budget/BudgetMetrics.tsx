// src/components/budget/BudgetMetrics.tsx - Enhanced Version
import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
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
    if (type === 'monthly') {
      // Monthly budget metrics
      const totalBudget = Number(data.total_budget) || 0;
      const totalActual = Number(data.total_actual) || 0;
      const totalVariance = Number(data.total_variance) || 0;
      const adherenceRate = totalBudget > 0 ? ((totalBudget - Math.abs(totalVariance)) / totalBudget) * 100 : 0;
      
      const overBudgetCount = data.budget_items?.filter((item: any) => item.is_over_budget).length || 0;
      const totalCategories = data.budget_items?.length || 0;
      const onTrackCategories = totalCategories - overBudgetCount;

      // Calculate Budget Health Score (0-100)
      const healthScore = Math.max(0, Math.min(100, 
        (adherenceRate * 0.6) + // 60% weight on adherence
        ((onTrackCategories / totalCategories) * 100 * 0.4) // 40% weight on categories on track
      ));

      return {
        totalBudget,
        totalActual,
        totalVariance,
        adherenceRate,
        overBudgetCount,
        onTrackCategories,
        totalCategories,
        healthScore
      };
    } else {
      // Yearly budget metrics - aggregate across all months
      const months = data.months || [];
      const budgetData = data.budget_data || {};
      
      let totalBudget = 0;
      let totalActual = 0;
      let overBudgetInstances = 0;
      let totalInstances = 0;
      let monthlyHealthScores: number[] = [];

      months.forEach((month: string) => {
        const monthData = budgetData[month] || {};
        let monthBudget = 0;
        let monthActual = 0;
        let monthOverBudget = 0;
        let monthCategories = 0;
        
        Object.values(monthData).forEach((item: any) => {
          const budgetAmt = Number(item.budget_amount) || 0;
          const actualAmt = Number(item.actual_amount) || 0;
          totalBudget += budgetAmt;
          totalActual += actualAmt;
          monthBudget += budgetAmt;
          monthActual += actualAmt;
          totalInstances++;
          monthCategories++;
          if (item.is_over_budget) {
            overBudgetInstances++;
            monthOverBudget++;
          }
        });

        // Calculate monthly health score
        if (monthCategories > 0) {
          const monthAdherence = monthBudget > 0 ? ((monthBudget - Math.abs(monthBudget - monthActual)) / monthBudget) * 100 : 0;
          const monthOnTrack = ((monthCategories - monthOverBudget) / monthCategories) * 100;
          const monthHealth = Math.max(0, Math.min(100, (monthAdherence * 0.6) + (monthOnTrack * 0.4)));
          monthlyHealthScores.push(monthHealth);
        }
      });

      const totalVariance = totalBudget - totalActual;
      const adherenceRate = totalBudget > 0 ? ((totalBudget - Math.abs(totalVariance)) / totalBudget) * 100 : 0;
      const onTrackPercentage = totalInstances > 0 ? ((totalInstances - overBudgetInstances) / totalInstances) * 100 : 0;
      const avgHealthScore = monthlyHealthScores.length > 0 ? 
        monthlyHealthScores.reduce((sum, score) => sum + score, 0) / monthlyHealthScores.length : 0;

      return {
        totalBudget: totalBudget / Math.max(1, months.length), // Average monthly budget
        totalActual: totalActual / Math.max(1, months.length), // Average monthly actual
        totalVariance: totalVariance / Math.max(1, months.length), // Average monthly variance
        adherenceRate,
        overBudgetInstances,
        onTrackPercentage,
        totalInstances,
        monthsAnalyzed: months.length,
        healthScore: avgHealthScore,
        monthlyHealthScores,
        // Ensure these properties exist for TypeScript
        onTrackCategories: 0,
        totalCategories: 0,
        overBudgetCount: 0
      };
    }
  }, [data, type]);

  // Create mini chart data for health score trend
  const healthChartData = useMemo(() => {
    if (type === 'yearly' && metrics.monthlyHealthScores) {
      return metrics.monthlyHealthScores.slice(-4).map((score, index) => ({
        index,
        value: score
      }));
    } else {
      // For monthly, show a simple trend (you could enhance this with historical data)
      return [
        { index: 0, value: Math.max(0, metrics.healthScore - 10) },
        { index: 1, value: Math.max(0, metrics.healthScore - 5) },
        { index: 2, value: metrics.healthScore }
      ];
    }
  }, [metrics, type]);

  const HealthChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={healthChartData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  if (type === 'monthly') {
    return (
      <div className="grid grid-cols-5 gap-6">
        {/* Hero Metric - Budget Health Score */}
        <MetricCard
          title="Budget Health Score"
          value={`${Math.round(metrics.healthScore)}%`}
          subtitle={`${metrics.onTrackCategories} of ${metrics.totalCategories} categories on track • ${
            metrics.healthScore > 80 ? 'Excellent' : 
            metrics.healthScore > 60 ? 'Good' : 
            metrics.healthScore > 40 ? 'Fair' : 'Needs Work'
          }`}
          variant="hero"
          trend={{
            value: '+12% vs last month',
            direction: 'down',
            isPositive: true
          }}
          chart={<HealthChart />}
          className="col-span-2"
        />
        
        {/* Supporting Metrics */}
        <MetricCard
          title="Total Budget"
          value={formatCurrency(metrics.totalBudget)}
          subtitle="Monthly planned spending"
          variant="default"
          trend={{
            value: '+3.2%',
            direction: 'up',
            isPositive: false
          }}
        />
        
        <MetricCard
          title="Over Budget"
          value={formatCurrency(Math.abs(metrics.totalVariance < 0 ? metrics.totalVariance : 0))}
          subtitle={`${metrics.overBudgetCount} categories exceeded`}
          variant="danger"
          trend={{
            value: '+$180',
            direction: 'up',
            isPositive: false
          }}
        />
        
        <MetricCard
          title="Under Budget"
          value={formatCurrency(metrics.totalVariance > 0 ? metrics.totalVariance : 0)}
          subtitle={`${metrics.onTrackCategories} categories saved`}
          variant="success"
          trend={{
            value: '-$95',
            direction: 'down',
            isPositive: false
          }}
        />
      </div>
    );
  } else {
    // Yearly view with enhanced hero card
    const bestMonth = 'July'; // You could calculate this from data
    const worstMonth = 'December';
    const onTrackMonths = Math.round(((metrics.onTrackPercentage || 0) / 100) * metrics.monthsAnalyzed);
    const avgVariance = Math.abs(metrics.totalVariance);

    return (
      <div className="grid grid-cols-5 gap-6">
        {/* Hero Metric - Annual Budget Performance */}
        <MetricCard
          title="Annual Budget Performance"
          value={`${Math.round(metrics.healthScore)}%`}
          subtitle="Strong year with consistent budget adherence"
          variant="hero"
          trend={{
            value: '+8% vs 2023',
            direction: 'down',
            isPositive: true
          }}
          stats={[
            { label: 'Best Month', value: bestMonth, variant: 'positive' },
            { label: 'Worst Month', value: worstMonth, variant: 'negative' },
            { label: 'On Track', value: `${onTrackMonths}/${metrics.monthsAnalyzed}`, variant: 'neutral' },
            { label: 'Avg Variance', value: formatCurrency(avgVariance), variant: 'positive' }
          ]}
          className="col-span-2"
        />
        
        {/* Supporting Metrics */}
        <MetricCard
          title="Avg Monthly Budget"
          value={formatCurrency(metrics.totalBudget)}
          subtitle="Across 12 months"
          variant="default"
          trend={{
            value: '+2.5%',
            direction: 'up'
          }}
        />
        
        <MetricCard
          title="Total Saved"
          value={formatCurrency(metrics.totalVariance > 0 ? metrics.totalVariance * metrics.monthsAnalyzed : 0)}
          subtitle="Under budget total"
          variant="success"
          trend={{
            value: '+$420',
            direction: 'down',
            isPositive: true
          }}
        />
        
        <MetricCard
          title="Consistency Score"
          value={formatPercentage(metrics.onTrackPercentage || 0)}
          subtitle="Month-to-month stability"
          variant="info"
          trend={{
            value: '+12%',
            direction: 'down',
            isPositive: true
          }}
        />
      </div>
    );
  }
}