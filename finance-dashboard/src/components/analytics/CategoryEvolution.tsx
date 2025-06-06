// src/components/analytics/CategoryEvolution.tsx
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearlyData } from '../../types/api';
import CategorySelector from './CategorySelector';

interface CategoryEvolutionProps {
  yearData: Record<string, YearlyData>;
  selectedYears: number[];
}

const COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
];

export default function CategoryEvolution({ yearData, selectedYears }: CategoryEvolutionProps) {
  // Get available categories sorted by total spending
  const availableCategories = useMemo(() => {
    const years = selectedYears.length > 0 
      ? selectedYears.map(String)
      : Object.keys(yearData);

    const filteredYears = years.filter(year => yearData[year]).sort();
    const excludeCategories = ['Pay', 'Payment'];

    // Calculate category totals across all years
    const categoryTotals: Record<string, number> = {};

    filteredYears.forEach(year => {
      const categories = yearData[year].categories || {};
      Object.entries(categories).forEach(([category, amount]) => {
        if (!excludeCategories.includes(category)) {
          categoryTotals[category] = (categoryTotals[category] || 0) + Number(amount);
        }
      });
    });

    // Return sorted array with category and total amount
    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, totalAmount]) => ({ category, totalAmount }));
  }, [yearData, selectedYears]);

  // Default to top 6 categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize with top 6 categories when available categories change (only once)
  React.useEffect(() => {
    if (availableCategories.length > 0 && selectedCategories.length === 0 && !hasInitialized) {
      const topCategories = availableCategories.slice(0, 6).map(c => c.category);
      setSelectedCategories(topCategories);
      setHasInitialized(true);
    }
  }, [availableCategories.length, selectedCategories.length, hasInitialized]);

  const chartData = useMemo(() => {
    const years = selectedYears.length > 0 
      ? selectedYears.map(String)
      : Object.keys(yearData);

    const filteredYears = years.filter(year => yearData[year]).sort();

    if (filteredYears.length === 0 || selectedCategories.length === 0) {
      return [];
    }

    // Build chart data using selected categories
    const chartData = filteredYears.map(year => {
      const yearCategories = yearData[year].categories || {};
      const months = yearData[year].months || 1;
      
      const dataPoint: any = { year };
      
      selectedCategories.forEach(category => {
        // Convert to monthly average
        dataPoint[category] = Math.round((Number(yearCategories[category]) || 0) / months);
      });
      
      return dataPoint;
    });

    return chartData;
  }, [yearData, selectedYears, selectedCategories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload
            .sort((a: any, b: any) => b.value - a.value)
            .map((entry: any) => (
              <p key={entry.dataKey} style={{ color: entry.color }}>
                {entry.dataKey}: {formatCurrency(entry.value)}
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-white font-semibold text-3xl mb-2">Category Evolution</h3>
          <p className="text-gray-400">Top spending categories over time (monthly average)</p>
        </div>
        
        <CategorySelector
          availableCategories={availableCategories}
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
          maxSelection={8}
        />
      </div>
      
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No category data available for selected years</p>
        </div>
      ) : (
        <>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#D1D5DB' }}
                  axisLine={{ stroke: '#6B7280' }}
                />
                <YAxis 
                  tick={{ fill: '#D1D5DB' }}
                  axisLine={{ stroke: '#6B7280' }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: '#D1D5DB' }}
                />
                
                {selectedCategories.map((category, index) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category growth summary */}
          {chartData.length > 1 && selectedCategories.length > 0 && (
            <div className="mt-6">
              <h4 className="text-white font-semibold mb-4">Category Growth (Latest Year vs Previous)</h4>
              <div className="grid grid-cols-3 gap-4">
                {selectedCategories.slice(0, 6).map((category) => {
                  const latest = chartData[chartData.length - 1][category] || 0;
                  const previous = chartData[chartData.length - 2][category] || 0;
                  const growth = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
                  const isPositive = growth > 0;
                  
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{category}</span>
                      <span className={`font-semibold text-sm ${Math.abs(growth) < 1 ? 'text-gray-400' : isPositive ? 'text-red-400' : 'text-green-400'}`}>
                        {Math.abs(growth) < 1 ? 'Stable' : `${isPositive ? '+' : ''}${growth.toFixed(1)}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}