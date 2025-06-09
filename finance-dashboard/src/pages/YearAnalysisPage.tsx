// src/pages/YearAnalysisPage.tsx
import React, { useState, useMemo } from 'react';
import { useYearComparison } from '../hooks/useApiData';
import YearSelector from '../components/analytics/YearSelector';
import YearTrendsChart from '../components/analytics/YearTrendsChart';
import CategoryEvolution from '../components/analytics/CategoryEvolution';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function YearAnalysisPage() {
  const { 
    data: yearComparisonData, 
    isLoading: yearLoading, 
    isError: yearError 
  } = useYearComparison();

  // Initialize with all available years
  const availableYears = useMemo(() => {
    return yearComparisonData?.available_years || [];
  }, [yearComparisonData]);

  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // Set all years as default when data loads (only once)
  const [hasInitialized, setHasInitialized] = React.useState(false);
  React.useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0 && !hasInitialized) {
      setSelectedYears([...availableYears]);
      setHasInitialized(true);
    }
  }, [availableYears, selectedYears.length, hasInitialized]);

  // Calculate summary statistics for selected years
  const summaryStats = useMemo(() => {
    if (!yearComparisonData?.years || selectedYears.length === 0) {
      return null;
    }

    const yearsToAnalyze = selectedYears.length > 0 
      ? selectedYears.map(String)
      : Object.keys(yearComparisonData.years);

    const validYears = yearsToAnalyze.filter(year => yearComparisonData.years[year]);

    if (validYears.length === 0) return null;

    // Calculate totals using the correct field names
    const totalIncome = validYears.reduce((sum, year) => {
      const yearData = yearComparisonData.years[year];
      const income = Number(yearData.total_income || 0);
      return sum + income;
    }, 0);

    const totalSpending = validYears.reduce((sum, year) => {
      const yearData = yearComparisonData.years[year];
      const spending = Number(yearData.total_spending || 0);
      return sum + spending;
    }, 0);

    const totalInvestments = validYears.reduce((sum, year) => {
      const yearData = yearComparisonData.years[year];
      const investments = Number(yearData.total_investments || 0);
      return sum + investments;
    }, 0);

    const avgIncome = totalIncome / validYears.length;
    const avgSpending = totalSpending / validYears.length;
    const avgInvestments = totalInvestments / validYears.length;

    // Format numbers properly and handle edge cases
    const formatNumber = (num: number) => {
      if (!isFinite(num) || isNaN(num)) return 0;
      return Math.round(num);
    };

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0;

    return {
      yearsAnalyzed: validYears.length,
      totalIncome: formatNumber(totalIncome),
      totalSpending: formatNumber(totalSpending),
      totalInvestments: formatNumber(totalInvestments),
      avgIncome: formatNumber(avgIncome),
      avgSpending: formatNumber(avgSpending),
      avgInvestments: formatNumber(avgInvestments),
      savingsRate: isFinite(savingsRate) ? savingsRate : 0
    };
  }, [yearComparisonData, selectedYears]);

  if (yearError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-400">Failed to load year analysis data</p>
        </div>
      </div>
    );
  }

  if (yearLoading || !yearComparisonData) {
    return (
      <div className="h-full">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Year Analysis</h1>
          <div className="h-4 w-96 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-8 h-full">
          <LoadingSkeleton variant="metric" className="col-span-12 h-24" />
          <LoadingSkeleton variant="list" lines={8} className="col-span-6 h-96" />
          <LoadingSkeleton variant="list" lines={8} className="col-span-6 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-bold text-white mb-4">Year Analysis</h1>
          <p className="text-xl text-gray-400">
            Multi-year trends and category evolution analysis
          </p>
        </div>
        
        <YearSelector
          availableYears={availableYears}
          selectedYears={selectedYears}
          onChange={setSelectedYears}
        />
      </div>

      {/* Summary Statistics Row */}
      {summaryStats && (
        <div className="mb-8 grid grid-cols-4 gap-6">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Years Analyzed</h3>
            <p className="text-white text-3xl font-bold">{summaryStats.yearsAnalyzed}</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Avg Annual Income</h3>
            <p className="text-green-400 text-3xl font-bold">
              ${summaryStats.avgIncome.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Avg Annual Spending</h3>
            <p className="text-blue-400 text-3xl font-bold">
              ${summaryStats.avgSpending.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Savings Rate</h3>
            <p className="text-purple-400 text-3xl font-bold">
              {summaryStats.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Main Charts - Clean 2x1 Layout */}
      <div className="flex-1 grid grid-cols-1 gap-8">
        {/* Year-over-Year Trends */}
        <div className="col-span-1">
          <YearTrendsChart 
            yearData={yearComparisonData.years}
            selectedYears={selectedYears}
          />
        </div>

        {/* Category Evolution */}
        <div className="col-span-1">
          <CategoryEvolution 
            yearData={yearComparisonData.years}
            selectedYears={selectedYears}
          />
        </div>
      </div>
    </div>
  );
}