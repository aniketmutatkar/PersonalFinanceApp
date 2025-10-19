import React from 'react';
import { InvestmentOverviewData } from '../../types/api';
import MetricCard from '../cards/MetricCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';

interface InvestmentOverviewProps {
  data: InvestmentOverviewData | undefined;
  isLoading: boolean;
}

export default function InvestmentOverview({ data, isLoading }: InvestmentOverviewProps) {
  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Determine investment rate trend
  const getInvestmentRateTrend = (rate: number) => {
    if (rate >= 20) return { direction: 'up' as const, value: 'Excellent' };
    if (rate >= 15) return { direction: 'up' as const, value: 'Very Good' };
    if (rate >= 10) return { direction: 'neutral' as const, value: 'Good' };
    if (rate >= 5) return { direction: 'neutral' as const, value: 'Fair' };
    return { direction: 'down' as const, value: 'Low' };
  };

  // Determine consistency trend
  const getConsistencyTrend = (score: number) => {
    if (score >= 80) return { direction: 'up' as const, value: 'Very Consistent' };
    if (score >= 60) return { direction: 'up' as const, value: 'Consistent' };
    if (score >= 40) return { direction: 'neutral' as const, value: 'Somewhat Regular' };
    return { direction: 'down' as const, value: 'Irregular' };
  };

  if (isLoading) {
    return (
      <>
        <LoadingSkeleton variant="metric" />
        <LoadingSkeleton variant="metric" />
        <LoadingSkeleton variant="metric" />
        <LoadingSkeleton variant="metric" />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <div className="card-standard col-span-full">
          <p className="text-gray-400 text-center">No investment data available</p>
        </div>
      </>
    );
  }

  // Display three separate metrics: deposits, withdrawals, and net invested
  return (
    <>
      {/* Total Deposits */}
      <MetricCard
        title="Total Deposits"
        value={formatCurrency(data.total_deposits)}
        subtitle={`Across ${data.active_accounts} account${data.active_accounts !== 1 ? 's' : ''}`}
        variant="hero"
      />

      {/* Total Withdrawals */}
      <MetricCard
        title="Total Withdrawals"
        value={formatCurrency(data.total_withdrawals)}
        subtitle={`Money taken out`}
        variant="default"
        trend={{
          direction: data.total_withdrawals > 0 ? 'down' : 'neutral',
          value: data.total_withdrawals > 0 ? 'Withdrawals made' : 'No withdrawals',
          isPositive: data.total_withdrawals === 0
        }}
      />

      {/* Net Invested */}
      <MetricCard
        title="Net Invested"
        value={formatCurrency(data.net_invested)}
        subtitle="Deposits minus withdrawals"
        variant="accent"
        trend={{
          direction: data.net_invested > 0 ? 'up' : data.net_invested < 0 ? 'down' : 'neutral',
          value: data.net_invested >= 0 ? 'Positive flow' : 'Negative flow',
          isPositive: data.net_invested > 0
        }}
      />

      {/* Investment Rate */}
      <MetricCard
        title="Investment Rate"
        value={formatPercentage(data.investment_rate)}
        subtitle="% of income invested"
        variant="default"
        trend={getInvestmentRateTrend(data.investment_rate)}
      />

      {/* Monthly Average (based on deposits) */}
      <MetricCard
        title="Monthly Avg Deposits"
        value={formatCurrency(data.monthly_average)}
        subtitle={`Over ${data.period_covered.total_months} months`}
        variant="default"
        trend={{
          direction: data.monthly_average > 500 ? 'up' : data.monthly_average > 200 ? 'neutral' : 'down',
          value: data.best_month.month,
          isPositive: data.monthly_average > 300
        }}
      />

      {/* Consistency Score */}
      <MetricCard
        title="Consistency Score"
        value={`${data.consistency_score.toFixed(0)}/100`}
        subtitle="Investment regularity"
        variant="default"
        trend={getConsistencyTrend(data.consistency_score)}
      />
    </>
  );
}