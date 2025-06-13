// src/pages/InvestmentView.tsx - PHASE 4.6 CONVERSION - Design System Implementation
import React, { useState } from 'react';
import { 
  usePortfolioOverview, 
  usePortfolioTrends, 
  useInvestmentOverview,
  useInvestmentTrends, 
  useSpendingPatterns
} from '../hooks/useApiData';
import { PortfolioAccount, InstitutionSummary, AccountTypeSummary } from '../types/api';
import InvestmentOverview from '../components/investments/InvestmentOverview';
import InvestmentTrends from '../components/investments/InvestmentTrends';
import AccountComparison from '../components/investments/AccountComparison';
import InvestmentPatterns from '../components/investments/InvestmentPatterns';
import PortfolioValueChart from '../components/portfolio/PortfolioValueChart';
import PageHeader from '../components/layout/PageHeader';
import MetricCard from '../components/cards/MetricCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function InvestmentView() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  
  // Portfolio Performance Data
  const { 
    data: portfolioOverview, 
    isLoading: portfolioLoading, 
    error: portfolioError 
  } = usePortfolioOverview();
  
  const { 
    data: portfolioTrends, 
    isLoading: trendsLoading, 
    error: trendsError 
  } = usePortfolioTrends(selectedPeriod);
  
  // Legacy Investment Data (for patterns/consistency analysis)
  const { 
    data: legacyOverviewData, 
    isLoading: legacyOverviewLoading 
  } = useInvestmentOverview();
  
  const { 
    data: legacyTrendsData, 
    isLoading: legacyTrendsLoading 
  } = useInvestmentTrends();
  
  const { 
    data: patternsData, 
    isLoading: patternsLoading 
  } = useSpendingPatterns();

  // Check for critical errors
  const hasError = portfolioError || trendsError;

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Investment Data</h2>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  if (portfolioLoading || trendsLoading) {
    return (
      <div className="page-content">
        {/* Page Header Skeleton - DESIGN SYSTEM */}
        <div className="section-gap">
          <div className="page-title bg-gray-700 rounded animate-pulse h-8 w-64"></div>
          <div className="h-4 w-96 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Content Skeletons - DESIGN SYSTEM */}
        <div className="grid-metrics-4">
          <LoadingSkeleton variant="metric" />
          <LoadingSkeleton variant="metric" />
          <LoadingSkeleton variant="metric" />
          <LoadingSkeleton variant="metric" />
        </div>
        <div className="grid-layout-12">
          <LoadingSkeleton variant="chart" className="col-8" />
          <LoadingSkeleton variant="chart" className="col-4" />
          <LoadingSkeleton variant="chart" className="col-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Page Header - DESIGN SYSTEM */}
      <PageHeader
        title="Investment Portfolio"
        subtitle="Complete portfolio performance analysis and investment insights"
        actions={
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="2y">2 Years</option>
            <option value="1y">1 Year</option>
            <option value="6m">6 Months</option>
            <option value="3m">3 Months</option>
          </select>
        }
      />

      {/* Portfolio Summary Cards - DESIGN SYSTEM */}
      {portfolioOverview && !portfolioLoading && (
        <div className="grid-metrics-4">
          <MetricCard
            title="Portfolio Value"
            value={formatCurrency(portfolioOverview.total_portfolio_value)}
            subtitle={`Across ${portfolioOverview.accounts.length} accounts`}
            variant="hero"
            trend={{
              value: `${portfolioOverview.total_growth >= 0 ? '+' : ''}${portfolioOverview.growth_percentage.toFixed(1)}%`,
              direction: portfolioOverview.growth_percentage >= 0 ? 'up' : 'down',
              isPositive: portfolioOverview.growth_percentage >= 0
            }}
          />

          <MetricCard
            title="Total Growth"
            value={formatCurrency(portfolioOverview.total_growth)}
            subtitle="Since account opening"
            variant={portfolioOverview.growth_percentage >= 0 ? 'success' : 'danger'}
            trend={{
              value: `${portfolioOverview.growth_percentage.toFixed(1)}% return`,
              direction: portfolioOverview.growth_percentage >= 0 ? 'up' : 'down',
              isPositive: portfolioOverview.growth_percentage >= 0
            }}
          />

          <MetricCard
            title="Active Accounts"
            value={portfolioOverview.accounts.length}
            subtitle={`${portfolioOverview.by_institution.length} institutions`}
            variant="info"
          />

          <MetricCard
            title="Best Performer"
            value={`${portfolioOverview.accounts[0]?.annualized_return.toFixed(1) || 0}%`}
            subtitle={portfolioOverview.accounts[0]?.account_name || 'No data'}
            variant="accent"
            trend={{
              value: 'Annual return',
              direction: 'up',
              isPositive: true
            }}
          />
        </div>
      )}

      {/* Portfolio Performance Details - DESIGN SYSTEM */}
      {portfolioOverview && !portfolioLoading && (
        <div className="grid-layout-12">
          {/* Top Account Performance */}
          <div className="col-6">
            <div className="card-standard h-full">
              <h3 className="section-title content-gap">🏆 Top Account Performance</h3>
              <div className="space-y-4">
                {portfolioOverview.accounts
                  .sort((a: PortfolioAccount, b: PortfolioAccount) => b.annualized_return - a.annualized_return)
                  .slice(0, 5)
                  .map((account: PortfolioAccount, index: number) => (
                    <div key={account.account_id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm">#{index + 1}</span>
                        <div>
                          <div className="text-white font-medium text-sm">{account.account_name}</div>
                          <div className="text-gray-400 text-xs">{account.institution}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-sm ${account.annualized_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {account.annualized_return.toFixed(1)}%
                        </div>
                        <div className="text-gray-400 text-xs">annual return</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Institution Performance */}
          <div className="col-6">
            <div className="card-standard h-full">
              <h3 className="section-title content-gap">🏛️ Institution Performance</h3>
              <div className="space-y-3">
                {portfolioOverview.by_institution
                  .sort((a: InstitutionSummary, b: InstitutionSummary) => b.growth_percentage - a.growth_percentage)
                  .map((institution: InstitutionSummary, index: number) => (
                    <div key={institution.institution} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm">#{index + 1}</span>
                        <div>
                          <div className="text-white font-medium text-sm">{institution.institution}</div>
                          <div className="text-gray-400 text-xs">
                            {institution.account_count} account{institution.account_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-sm ${institution.growth_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {institution.growth_percentage.toFixed(1)}%
                        </div>
                        <div className="text-gray-400 text-xs">
                          {formatCurrency(institution.total_balance)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Investment Overview - DESIGN SYSTEM */}
      <div className="card-standard">
        <div className="flex items-center justify-between content-gap">
          <h2 className="section-title">Investment Deposit Analysis</h2>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            Transaction-based data
          </span>
        </div>
        <div className="grid-metrics-4">
          <InvestmentOverview 
            data={legacyOverviewData} 
            isLoading={legacyOverviewLoading} 
          />
        </div>
      </div>

      {/* Portfolio Value Trends Chart - DESIGN SYSTEM */}
      {portfolioTrends && !trendsLoading && (
        <div className="card-standard">
          <h2 className="section-title content-gap">📈 Portfolio Value Over Time</h2>
          <PortfolioValueChart 
            data={portfolioTrends} 
            isLoading={trendsLoading}
            portfolioOverview={portfolioOverview}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>
      )}

      {/* Enhanced Investment Trends - DESIGN SYSTEM */}
      <InvestmentTrends 
        data={legacyTrendsData} 
        isLoading={legacyTrendsLoading} 
      />

      {/* Account Comparison + Investment Patterns - DESIGN SYSTEM */}
      <div className="grid-layout-12">
        {/* Account Comparison */}
        <div className="col-8">
          <AccountComparison 
            data={legacyTrendsData} 
            isLoading={legacyTrendsLoading} 
          />
        </div>
        
        {/* Investment Patterns */}
        <div className="col-4">
          <InvestmentPatterns 
            patternsData={patternsData} 
            isLoading={patternsLoading} 
          />
        </div>
      </div>

      {/* Account Type Performance - DESIGN SYSTEM */}
      {portfolioOverview && !portfolioLoading && (
        <div className="card-standard">
          <h2 className="section-title content-gap">🏦 Account Type Performance</h2>
          <div className="grid-metrics-4">
            {portfolioOverview.by_account_type.map((accountType: AccountTypeSummary) => (
              <MetricCard
                key={accountType.account_type}
                title={accountType.account_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                value={formatCurrency(accountType.total_balance)}
                subtitle={`${accountType.account_count} account${accountType.account_count !== 1 ? 's' : ''}`}
                variant={accountType.growth_percentage >= 0 ? 'success' : 'danger'}
                trend={{
                  value: `${accountType.growth_percentage >= 0 ? '+' : ''}${accountType.growth_percentage.toFixed(1)}%`,
                  direction: accountType.growth_percentage >= 0 ? 'up' : 'down',
                  isPositive: accountType.growth_percentage >= 0
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Development Note - DESIGN SYSTEM */}
      <div className="card-info">
        <div className="flex items-start space-x-3">
          <span className="text-blue-400 text-lg">🚀</span>
          <div>
            <h4 className="text-blue-300 font-medium text-sm">Pure Analytics Dashboard</h4>
            <p className="text-blue-200/80 text-xs mt-1">
              Focused on portfolio performance and insights. All data uploads now handled via the unified Upload Center.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}