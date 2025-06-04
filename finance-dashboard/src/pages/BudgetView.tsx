// src/pages/BudgetView.tsx
import React, { useState, useMemo } from 'react';
import { useYearlyBudgetAnalysis, useBudgetAnalysis, useMonthlySummaries } from '../hooks/useApiData';
import MonthSelector from '../components/monthly/MonthSelector';
import BudgetMetrics from '../components/budget/BudgetMetrics';
import BudgetChart from '../components/budget/BudgetChart';
import BudgetTable from '../components/budget/BudgetTable';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

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

  // Fetch yearly or monthly data based on view
  const { 
    data: yearlyBudgetData, 
    isLoading: yearlyLoading, 
    isError: yearlyError 
  } = useYearlyBudgetAnalysis(selectedYear, { 
    enabled: selectedView === 'yearly' && !!selectedYear,
    queryKey: ['yearly-budget-analysis', selectedYear]
  });

  const { 
    data: monthlyBudgetData, 
    isLoading: monthlyLoading, 
    isError: monthlyError 
  } = useBudgetAnalysis(selectedMonth, { 
    enabled: selectedView === 'monthly' && !!selectedMonth,
    queryKey: ['budget-analysis', selectedMonth]
  });

  const isLoading = selectedView === 'yearly' ? yearlyLoading : monthlyLoading;
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
      <div className="h-full">
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
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Budget Analysis</h1>
          <p className="text-sm text-gray-400">
            Track your spending against planned budgets
          </p>
        </div>
        
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
      </div>

      {/* Budget Content */}
      <div className="flex-1 grid grid-cols-12 gap-8">
        {selectedView === 'yearly' && yearlyBudgetData ? (
          <>
            {/* Yearly Budget Metrics */}
            <div className="col-span-12">
              <BudgetMetrics 
                data={yearlyBudgetData} 
                type="yearly" 
                year={selectedYear}
              />
            </div>

            {/* Yearly Budget Chart */}
            <div className="col-span-8">
              <BudgetChart 
                data={yearlyBudgetData} 
                type="yearly" 
                year={selectedYear}
              />
            </div>

            {/* Yearly Budget Alerts */}
            <div className="col-span-4">
              <BudgetTable 
                data={yearlyBudgetData} 
                type="yearly" 
                year={selectedYear}
              />
            </div>
          </>
        ) : selectedView === 'monthly' && monthlyBudgetData ? (
          <>
            {/* Monthly Budget Metrics */}
            <div className="col-span-12">
              <BudgetMetrics 
                data={monthlyBudgetData} 
                type="monthly" 
                monthYear={selectedMonth}
              />
            </div>

            {/* Monthly Budget Chart */}
            <div className="col-span-8">
              <BudgetChart 
                data={monthlyBudgetData} 
                type="monthly" 
                monthYear={selectedMonth}
              />
            </div>

            {/* Monthly Budget Table */}
            <div className="col-span-4">
              <BudgetTable 
                data={monthlyBudgetData} 
                type="monthly" 
                monthYear={selectedMonth}
              />
            </div>
          </>
        ) : (
          <div className="col-span-12 flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <p>No budget data available</p>
              <p className="text-sm mt-2">
                {selectedView === 'yearly' 
                  ? `No data for year ${selectedYear}` 
                  : `No data for ${selectedMonth}`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}