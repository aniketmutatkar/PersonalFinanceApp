// src/components/monthly/CategoryChart.tsx
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MonthlySummary, Transaction } from '../../types/api';

interface CategoryChartProps {
  summary: MonthlySummary;
  transactions: Transaction[];
}

const COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
];

export default function CategoryChart({ summary }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const excludeCategories = ['Pay', 'Payment', 'Acorns', 'Wealthfront', 'Robinhood', 'Schwab'];
    
    console.log('Summary category_totals:', summary.category_totals); // Debug log
    console.log('Total minus invest:', summary.total_minus_invest); // Debug log
    
    const data = Object.entries(summary.category_totals)
      .filter(([category, amount]) => {
        const isExcluded = excludeCategories.includes(category);
        const numericAmount = Number(amount); // Convert to number
        const isPositive = numericAmount > 0;
        console.log(`Category: ${category}, Amount: ${amount} (${typeof amount}), Numeric: ${numericAmount}, Excluded: ${isExcluded}, Positive: ${isPositive}`);
        return !isExcluded && isPositive;
      })
      .map(([category, amount]) => {
        const numericAmount = Number(amount); // Convert to number
        return {
          name: category,
          value: numericAmount, // Use numeric value
          percentage: ((numericAmount / summary.total_minus_invest) * 100).toFixed(1)
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
    
    console.log('Final chart data:', data); // Debug log
    return data;
  }, [summary]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-gray-300">{formatCurrency(data.value)}</p>
          <p className="text-gray-400">{data.percentage}% of spending</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 h-full">
      <h3 className="text-white font-semibold text-3xl mb-6">Category Breakdown</h3>
      
      {chartData.length > 0 ? (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ color: '#D1D5DB', fontSize: '14px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p>No spending data available for this month</p>
            <p className="text-sm mt-2">Categories found: {Object.keys(summary.category_totals).join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}