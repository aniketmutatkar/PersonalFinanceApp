// src/components/dashboard/InvestmentInsights.tsx
import React from 'react';

interface InvestmentInsightsProps {
  overview: any;
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

function InvestmentInsights({ overview }: InvestmentInsightsProps) {
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

export default InvestmentInsights;