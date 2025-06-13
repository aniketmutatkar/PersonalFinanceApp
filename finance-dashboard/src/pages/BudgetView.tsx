// src/pages/BudgetView.tsx - Fixed with proper vertical spacing
import React, { useState, useMemo } from 'react';
import { useYearlyBudgetAnalysis, useBudgetAnalysis, useMonthlySummaries } from '../hooks/useApiData';
import MonthSelector from '../components/monthly/MonthSelector';
import BudgetMetrics from '../components/budget/BudgetMetrics';
import BudgetChart from '../components/budget/BudgetChart';
import BudgetTable from '../components/budget/BudgetTable';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import PageHeader from '../components/layout/PageHeader';

export default function BudgetView() {
  const [selectedView, setSelectedView] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Get available years and months
  const { data: summariesResponse } = useMonthlySummaries();
  
  const availableYears = useMemo(() => {
    if (!summariesResponse?.summaries) return [];
    const years = Array.from(new Set(summariesResponse.summaries.map(s => s.year)));
    return years.sort((a, b) => b - a); // Most recent first
  }, [summariesResponse]);

  const availableMonths = useMemo(() => {
    if (!summariesResponse?.summaries) return [];
    return summariesResponse.summaries.map(s => ({
      value: s.month_year,
      label: s.month_year
    }));
  }, [summariesResponse]);

  // Set default year and month
  React.useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].value);
    }
  }, [availableYears, availableMonths, selectedYear, selectedMonth]);

  // Fetch current year data
  const { 
    data: yearlyBudgetData, 
    isLoading: yearlyLoading, 
    isError: yearlyError 
  } = useYearlyBudgetAnalysis(selectedYear, { 
    enabled: selectedView === 'yearly' && !!selectedYear,
    queryKey: ['yearly-budget-analysis', selectedYear]
  });

  // Fetch previous year data for trends (only for yearly view)
  const previousYear = selectedYear - 1;
  const shouldFetchPreviousYear = selectedView === 'yearly' && availableYears.includes(previousYear);
  
  const { 
    data: previousYearBudgetData, 
    isLoading: previousYearLoading 
  } = useYearlyBudgetAnalysis(previousYear, { 
    enabled: shouldFetchPreviousYear,
    queryKey: ['yearly-budget-analysis', previousYear],
    // Don't refetch as often since this is just for comparison
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch monthly data
  const { 
    data: monthlyBudgetData, 
    isLoading: monthlyLoading, 
    isError: monthlyError 
  } = useBudgetAnalysis(selectedMonth, { 
    enabled: selectedView === 'monthly' && !!selectedMonth,
    queryKey: ['budget-analysis', selectedMonth]
  });

  const isLoading = selectedView === 'yearly' 
    ? (yearlyLoading || (shouldFetchPreviousYear && previousYearLoading))
    : monthlyLoading;
  const isError = selectedView === 'yearly' ? yearlyError : monthlyError;

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Budget Data</h2>
          <p className="text-gray-400">Failed to load budget analysis</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Budget Analysis</h1>
          <div className="h-4 w-64 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-8 h-full">
          <LoadingSkeleton variant="metric" className="col-span-12 h-32" />
          <LoadingSkeleton variant="chart" className="col-span-8 h-64" />
          <LoadingSkeleton variant="list" lines={5} className="col-span-4 h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen p-8 flex flex-col">
      {/* Page Header - Fixed height */}
      <PageHeader
        title="Budget Analysis"
        subtitle={`Track your spending against planned budgets${selectedView === 'yearly' && previousYearBudgetData ? ' • Year-over-year trends enabled' : ''}`}
        actions={
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setSelectedView('yearly')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedView === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Yearly View
              </button>
              <button
                onClick={() => setSelectedView('monthly')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedView === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Monthly View
              </button>
            </div>

            {/* Year/Month Selector */}
            {selectedView === 'yearly' ? (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="
                  bg-gray-800 border border-gray-600 rounded-lg
                  px-4 py-2 text-white text-sm
                  focus:outline-none focus:border-blue-500
                "
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            ) : (
              <MonthSelector
                options={availableMonths}
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
            )}
          </div>
        }
      />

      {/* Budget Content - FIXED VERTICAL SPACING */}
      <div className="flex-1 min-h-0 space-y-8">
        {selectedView === 'yearly' && yearlyBudgetData ? (
          <>
            {/* Yearly Budget Metrics */}
            <div>
              <BudgetMetrics 
                data={yearlyBudgetData} 
                type="yearly" 
                year={selectedYear}
                previousYearData={previousYearBudgetData}
              />
            </div>

            {/* Yearly Chart/Table Row */}
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-7 h-[500px]">
                <BudgetChart 
                  data={yearlyBudgetData} 
                  type="yearly" 
                  year={selectedYear}
                />
              </div>

              <div className="col-span-5 h-[500px]">
                <BudgetTable 
                  data={yearlyBudgetData} 
                  type="yearly" 
                  year={selectedYear}
                />
              </div>
            </div>
          </>
        ) : selectedView === 'monthly' && monthlyBudgetData ? (
          <>
            {/* Monthly Budget Metrics */}
            <div>
              <BudgetMetrics 
                data={monthlyBudgetData} 
                type="monthly" 
                monthYear={selectedMonth}
              />
            </div>

            {/* Monthly Chart/Table Row */}
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-7 h-[500px]">
                <BudgetChart 
                  data={monthlyBudgetData} 
                  type="monthly" 
                  monthYear={selectedMonth}
                />
              </div>

              <div className="col-span-5 h-[500px]">
                <BudgetTable 
                  data={monthlyBudgetData} 
                  type="monthly" 
                  monthYear={selectedMonth}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">No budget data available for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}