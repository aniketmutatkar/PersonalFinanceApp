// Dashboard.tsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../services/api';

const Dashboard: React.FC = () => {
  const {
    data: overview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['financial-overview'],
    queryFn: () => financeApi.getFinancialOverview(),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Failed to load financial data. Please ensure your API is running on localhost:8000
        </Alert>
      </Box>
    );
  }

  if (!overview?.data_available) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">
          No financial data available
        </Alert>
      </Box>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  // Calculate monthly averages
  const monthlyIncome = Math.round(overview.financial_summary.total_income / overview.date_range.total_months);
  const monthlySpending = Math.round(overview.financial_summary.total_spending / overview.date_range.total_months);
  const monthlyInvestments = Math.round(overview.financial_summary.total_investments / overview.date_range.total_months);
  const monthlyNetWorth = Math.round(overview.financial_summary.net_worth_change / overview.date_range.total_months);

  // Get year data for comparison
  const years = Object.keys(overview.yearly_totals).sort();
  const yearComparisons = years.map(year => {
    const yearData = overview.yearly_totals[year];
    return {
      year: parseInt(year),
      spending: Math.round(yearData.total_spending / yearData.months),
      income: Math.round(yearData.total_income / yearData.months),
      investments: Math.round(yearData.total_investments / yearData.months),
    };
  });

  // Calculate year-over-year growth for most recent years
  const currentYear = yearComparisons[yearComparisons.length - 1];
  const previousYear = yearComparisons[yearComparisons.length - 2];
  
  const spendingGrowth = previousYear ? 
    ((currentYear.spending - previousYear.spending) / previousYear.spending * 100) : 0;
  const incomeGrowth = previousYear ? 
    ((currentYear.income - previousYear.income) / previousYear.income * 100) : 0;

  return (
    <Box sx={{ p: 4, height: '100vh', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary', fontSize: '5.4rem' }}>
          Financial Dashboard
        </Typography>
        <Typography variant="h4" color="text.secondary" sx={{ fontSize: '1.8rem' }}>
          {overview.date_range.start_month} — {overview.date_range.end_month} • {overview.date_range.total_months} months analyzed
        </Typography>
      </Box>

      {/* Key Metrics Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 11, mb: 13 }}>
        
        {/* Monthly Income */}
        <Card sx={{ height: '540px' }}>
          <CardContent sx={{ p: 11, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="h3" color="text.secondary" sx={{ fontWeight: 500, fontSize: '3rem' }}>
              Monthly Income
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 700, color: 'success.main', fontSize: '9.5rem', lineHeight: 1 }}>
              {formatCurrency(monthlyIncome)}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ fontSize: '2.7rem' }}>
              Average per month
            </Typography>
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card sx={{ height: '540px' }}>
          <CardContent sx={{ p: 11, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="h3" color="text.secondary" sx={{ fontWeight: 500, fontSize: '3rem' }}>
              Monthly Spending
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 700, color: 'error.main', fontSize: '9.5rem', lineHeight: 1 }}>
              {formatCurrency(monthlySpending)}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ fontSize: '2.7rem' }}>
              Average per month
            </Typography>
          </CardContent>
        </Card>

        {/* Monthly Investments */}
        <Card sx={{ height: '540px' }}>
          <CardContent sx={{ p: 11, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="h3" color="text.secondary" sx={{ fontWeight: 500, fontSize: '3rem' }}>
              Monthly Investments
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '9.5rem', lineHeight: 1 }}>
              {formatCurrency(monthlyInvestments)}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ fontSize: '2.7rem' }}>
              Average per month
            </Typography>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card sx={{ height: '540px' }}>
          <CardContent sx={{ p: 11, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="h3" color="text.secondary" sx={{ fontWeight: 500, fontSize: '3rem' }}>
              Savings Rate
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 700, color: 'warning.main', fontSize: '9.5rem', lineHeight: 1 }}>
              {formatPercentage(overview.financial_summary.overall_savings_rate)}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ fontSize: '2.7rem' }}>
              {overview.financial_summary.overall_savings_rate > 20 ? 'Excellent' : 'Room for improvement'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Cash Flow Change */}
      <Card sx={{ mb: 13, height: '485px' }}>
        <CardContent sx={{ p: 11, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h2" color="text.secondary" sx={{ fontWeight: 500, mb: 8, fontSize: '3.2rem' }}>
              Monthly Savings
            </Typography>
            <Typography variant="h1" sx={{ 
              fontWeight: 700, 
              color: monthlyNetWorth >= 0 ? 'success.main' : 'error.main',
              fontSize: '10.8rem',
              lineHeight: 1
            }}>
              {formatCurrency(monthlyNetWorth)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h2" color="text.secondary" sx={{ fontWeight: 500, mb: 5, fontSize: '3.2rem' }}>
              Total Change
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 600, mb: 3, fontSize: '6.8rem' }}>
              {formatCurrency(overview.financial_summary.net_worth_change)}
            </Typography>
            <Typography variant="h4" color="text.secondary" sx={{ fontSize: '3rem' }}>
              Over {overview.date_range.total_months} months
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Year Comparison */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 11 }}>
        
        {/* Spending Comparison */}
        <Card sx={{ height: '650px' }}>
          <CardContent sx={{ p: 11, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h2" sx={{ fontWeight: 600, mb: 11, fontSize: '4.1rem' }}>
              Year-over-Year Spending
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="text.secondary" sx={{ mb: 5, fontSize: '3rem' }}>
                  {currentYear?.year} Average Monthly
                </Typography>
                <Typography variant="h1" sx={{ fontWeight: 600, color: 'error.main', mb: 8, fontSize: '7.6rem' }}>
                  {formatCurrency(currentYear?.spending || 0)}
                </Typography>
                {previousYear && (
                  <Typography variant="h5" color="text.secondary" sx={{ fontSize: '2.7rem' }}>
                    vs {previousYear.year}: {formatCurrency(previousYear.spending)}
                  </Typography>
                )}
              </Box>
              <Box>
                <Divider sx={{ mb: 8 }} />
                <Typography variant="h2" sx={{ 
                  fontWeight: 600,
                  color: spendingGrowth > 0 ? 'error.main' : 'success.main',
                  fontSize: '4.9rem'
                }}>
                  {spendingGrowth > 0 ? '+' : ''}{formatPercentage(spendingGrowth)} YoY
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Income Comparison */}
        <Card sx={{ height: '650px' }}>
          <CardContent sx={{ p: 11, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h2" sx={{ fontWeight: 600, mb: 11, fontSize: '4.1rem' }}>
              Year-over-Year Income
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="text.secondary" sx={{ mb: 5, fontSize: '3rem' }}>
                  {currentYear?.year} Average Monthly
                </Typography>
                <Typography variant="h1" sx={{ fontWeight: 600, color: 'success.main', mb: 8, fontSize: '7.6rem' }}>
                  {formatCurrency(currentYear?.income || 0)}
                </Typography>
                {previousYear && (
                  <Typography variant="h5" color="text.secondary" sx={{ fontSize: '2.7rem' }}>
                    vs {previousYear.year}: {formatCurrency(previousYear.income)}
                  </Typography>
                )}
              </Box>
              <Box>
                <Divider sx={{ mb: 8 }} />
                <Typography variant="h2" sx={{ 
                  fontWeight: 600,
                  color: incomeGrowth > 0 ? 'success.main' : 'error.main',
                  fontSize: '4.9rem'
                }}>
                  {incomeGrowth > 0 ? '+' : ''}{formatPercentage(incomeGrowth)} YoY
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;