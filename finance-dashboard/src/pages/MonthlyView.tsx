// src/pages/MonthlyView.tsx - Fixed with previous month data and enhanced spending patterns
import React, { useState, useMemo } from 'react';
import { useMonthlySummariesRecent, useTransactions } from '../hooks/useApiData';
import MonthSelector from '../components/monthly/MonthSelector';
import MonthlyMetrics from '../components/monthly/MonthlyMetrics';
import CategoryChart from '../components/monthly/CategoryChart';
import SpendingPatternsChart from '../components/monthly/SpendingPatternsChart';
import TransactionTable from '../components/monthly/TransactionTable';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function MonthlyView() {
  // Use the recent hook for newest-first ordering (good for dropdowns)
  const { data: summariesResponse, isLoading: summariesLoading, isError: summariesError } = useMonthlySummariesRecent();
  
  // Get the most recent month as default
  const defaultMonth = useMemo(() => {
    if (!summariesResponse?.summaries || summariesResponse.summaries.length === 0) {
      return '';
    }
    // Data is already ordered newest first from API, so first item is most recent
    return summariesResponse.summaries[0].month_year;
  }, [summariesResponse]);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Set default month when data loads
  React.useEffect(() => {
    if (defaultMonth && !selectedMonth) {
      setSelectedMonth(defaultMonth);
    }
  }, [defaultMonth, selectedMonth]);

  // Get selected month data and previous month data
  const { selectedSummary, previousSummary } = useMemo(() => {
    if (!summariesResponse?.summaries || !selectedMonth) {
      return { selectedSummary: null, previousSummary: null };
    }
    
    const selectedIndex = summariesResponse.summaries.findIndex(s => s.month_year === selectedMonth);
    const selected = summariesResponse.summaries[selectedIndex] || null;
    
    // Get previous month (next index since array is newest-first)
    const previous = selectedIndex < summariesResponse.summaries.length - 1 
      ? summariesResponse.summaries[selectedIndex + 1] 
      : null;
    
    return { selectedSummary: selected, previousSummary: previous };
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

  // Data is already in the correct order (newest first) for dropdown display
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
            <MonthlyMetrics 
              summary={selectedSummary} 
              previousSummary={previousSummary}
            />
          </div>

          {/* Category Chart and Spending Patterns - Middle Row */}
          <div className="col-span-6">
            <CategoryChart 
              summary={selectedSummary}
              transactions={transactionsResponse?.items || []}
            />
          </div>

          <div className="col-span-6">
            <SpendingPatternsChart 
              transactions={transactionsResponse?.items || []}
              monthYear={selectedSummary.month_year}
            />
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