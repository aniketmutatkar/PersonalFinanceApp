// src/pages/InvestmentView.tsx
import React from 'react';
import { useInvestmentOverview, useInvestmentTrends, useSpendingPatterns } from '../hooks/useApiData';
import InvestmentOverview from '../components/investments/InvestmentOverview';
import InvestmentTrends from '../components/investments/InvestmentTrends';
import AccountComparison from '../components/investments/AccountComparison';
import InvestmentPatterns from '../components/investments/InvestmentPatterns';

export default function InvestmentView() {
  // Fetch all required data
  const { 
    data: overviewData, 
    isLoading: overviewLoading, 
    error: overviewError 
  } = useInvestmentOverview();
  
  const { 
    data: trendsData, 
    isLoading: trendsLoading, 
    error: trendsError 
  } = useInvestmentTrends();
  
  const { 
    data: patternsData, 
    isLoading: patternsLoading 
  } = useSpendingPatterns();

  // Check for any critical errors
  const hasError = overviewError || trendsError;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-white">Investment Analytics</h1>
        <p className="text-gray-400 mt-2">
          Track your investment deposits, account allocation, and growth patterns across all platforms.
        </p>
        
        {/* Period indicator */}
        {overviewData && !overviewLoading && (
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>
              📊 Analysis Period: {overviewData.period_covered.start_month} → {overviewData.period_covered.end_month}
            </span>
            <span>
              📅 {overviewData.period_covered.total_months} months of data
            </span>
          </div>
        )}
      </div>

      {/* Error State */}
      {hasError && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <div>
              <h3 className="text-red-400 font-medium">Error Loading Investment Data</h3>
              <p className="text-red-300 text-sm mt-1">
                {overviewError?.message || trendsError?.message || 'Unable to load investment analytics'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Investment Overview Cards */}
      <InvestmentOverview 
        data={overviewData} 
        isLoading={overviewLoading} 
      />

      {/* Investment Trends Chart */}
      <InvestmentTrends 
        data={trendsData} 
        isLoading={trendsLoading} 
      />

      {/* Bottom Section: Account Comparison + Investment Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Comparison - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <AccountComparison 
            data={trendsData} 
            isLoading={trendsLoading} 
          />
        </div>
        
        {/* Investment Patterns - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <InvestmentPatterns 
            patternsData={patternsData} 
            isLoading={patternsLoading} 
          />
        </div>
      </div>

      {/* Investment Summary Footer */}
      {overviewData && !overviewLoading && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-medium text-white mb-4">Investment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            
            {/* Total Investment Activity */}
            <div>
              <h4 className="text-gray-300 font-medium mb-2">Total Activity</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Total Invested: ${overviewData.total_invested.toLocaleString()}</li>
                <li>• Active Accounts: {overviewData.active_accounts}</li>
                <li>• Best Month: {overviewData.best_month.month}</li>
              </ul>
            </div>
            
            {/* Performance Metrics */}
            <div>
              <h4 className="text-gray-300 font-medium mb-2">Performance</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Investment Rate: {overviewData.investment_rate.toFixed(1)}% of income</li>
                <li>• Monthly Average: ${overviewData.monthly_average.toLocaleString()}</li>
                <li>• Consistency Score: {overviewData.consistency_score.toFixed(0)}/100</li>
              </ul>
            </div>
            
            {/* Account Breakdown */}
            <div>
              <h4 className="text-gray-300 font-medium mb-2">Top Accounts</h4>
              <ul className="space-y-1 text-gray-400">
                {overviewData.account_breakdown
                  .sort((a, b) => b.total_deposits - a.total_deposits)
                  .slice(0, 3)
                  .map(account => (
                    <li key={account.name}>
                      • {account.name}: ${account.total_deposits.toLocaleString()}
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Future Enhancement Note */}
      <div className="bg-blue-900/10 border border-blue-800/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-400 text-lg">🚀</span>
          <div>
            <h4 className="text-blue-300 font-medium text-sm">Future Enhancement</h4>
            <p className="text-blue-200/80 text-xs mt-1">
              Portfolio balance tracking and growth calculations coming soon with PDF statement upload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}