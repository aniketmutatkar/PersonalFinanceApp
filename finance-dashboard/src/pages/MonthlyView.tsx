// src/pages/MonthlyView.tsx
import React, { useState, useMemo } from 'react';
import { useMonthlySummaries, useTransactions } from '../hooks/useApiData';
import MonthSelector from '../components/monthly/MonthSelector';
import MonthlyMetrics from '../components/monthly/MonthlyMetrics';
import CategoryChart from '../components/monthly/CategoryChart';
import TransactionTable from '../components/monthly/TransactionTable';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function MonthlyView() {
  const { data: summariesResponse, isLoading: summariesLoading, isError: summariesError } = useMonthlySummaries();
  
  // Get the most recent month as default
  const defaultMonth = useMemo(() => {
    if (!summariesResponse?.summaries || summariesResponse.summaries.length === 0) {
      return '';
    }
    // summaries are ordered by date DESC in your backend
    return summariesResponse.summaries[0].month_year;
  }, [summariesResponse]);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Set default month when data loads
  React.useEffect(() => {
    if (defaultMonth && !selectedMonth) {
      setSelectedMonth(defaultMonth);
    }
  }, [defaultMonth, selectedMonth]);

  // Get selected month data
  const selectedSummary = useMemo(() => {
    if (!summariesResponse?.summaries || !selectedMonth) return null;
    return summariesResponse.summaries.find(s => s.month_year === selectedMonth);
  }, [summariesResponse, selectedMonth]);

  // Fetch transactions for selected month
  const monthForApi = useMemo(() => {
    if (!selectedSummary) return '';
    // Convert "January 2023" to "2023-01"
    const [monthName, year] = selectedSummary.month_year.split(' ');
    const monthMap: { [key: string]: string } = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    return `${year}-${monthMap[monthName]}`;
  }, [selectedSummary]);

  const { 
    data: transactionsResponse, 
    isLoading: transactionsLoading 
  } = useTransactions(
    { month: monthForApi, page_size: 1000 }, 
    { 
      enabled: !!monthForApi,
      // Add this to satisfy TypeScript requirements
      queryKey: ['transactions', { month: monthForApi, page_size: 1000 }]
    }
  );

  if (summariesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-400">Failed to load monthly summaries</p>
        </div>
      </div>
    );
  }

  if (summariesLoading || !summariesResponse || !selectedMonth) {
    return (
      <div className="h-full">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Monthly Analysis</h1>
          <div className="h-4 w-64 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-8 h-full">
          <LoadingSkeleton variant="metric" className="col-span-8 h-48" />
          <LoadingSkeleton variant="metric" className="col-span-4 h-48" />
          <LoadingSkeleton variant="list" lines={5} className="col-span-6 h-64" />
          <LoadingSkeleton variant="list" lines={4} className="col-span-6 h-64" />
        </div>
      </div>
    );
  }

  const availableMonths = summariesResponse.summaries.map(s => ({
    value: s.month_year,
    label: s.month_year
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-bold text-white mb-4">Monthly Analysis</h1>
          <p className="text-xl text-gray-400">
            Detailed breakdown and transaction analysis
          </p>
        </div>
        
        <MonthSelector
          options={availableMonths}
          value={selectedMonth}
          onChange={setSelectedMonth}
        />
      </div>

      {selectedSummary && (
        <div className="flex-1 grid grid-cols-12 gap-8">
          {/* Monthly Metrics - Top Row */}
          <div className="col-span-12">
            <MonthlyMetrics summary={selectedSummary} />
          </div>

          {/* Category Chart and Transaction Summary - Middle Row */}
          <div className="col-span-6">
            <CategoryChart 
              summary={selectedSummary}
              transactions={transactionsResponse?.items || []}
            />
          </div>

          <div className="col-span-6">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 h-full">
              <h3 className="text-white font-semibold text-3xl mb-6">Transaction Summary</h3>
              
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xl">Total Transactions</span>
                    <span className="text-white text-xl font-semibold">
                      {transactionsResponse?.total || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xl">Total Amount</span>
                    <span className="text-white text-xl font-semibold">
                      ${selectedSummary.total_minus_invest.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xl">Investments</span>
                    <span className="text-teal-400 text-xl font-semibold">
                      ${selectedSummary.investment_total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Table - Bottom Row */}
          <div className="col-span-12">
            <TransactionTable 
              transactions={transactionsResponse?.items || []}
              isLoading={transactionsLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}