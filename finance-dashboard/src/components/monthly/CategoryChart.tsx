// src/components/monthly/CategoryChart.tsx - MINIMAL FIX: Only remove Math.abs, keep original structure
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MonthlySummary, Transaction } from '../../types/api';

interface CategoryChartProps {
  summary: MonthlySummary;
  transactions: Transaction[];
}

// Enhanced color palette with better contrast
const COLORS = [
  '#10B981', // emerald-500
  '#3B82F6', // blue-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
  '#EC4899', // pink-500
  '#6366F1'  // indigo-500
];

export default function CategoryChart({ summary, transactions }: CategoryChartProps) {
  const { chartData, totalAmount } = useMemo(() => {
    // Exclude: income categories, investment categories, and calculated fields
    const excludeCategories = [
      'Pay', 'Payment',  // Income
      'Acorns', 'Wealthfront', 'Robinhood', 'Schwab',  // Investments
      'investment_deposits', 'investment_withdrawals', 'income', 'net_income',  // Calculated fields
      'net_overall', 'net_without_investments'  // Calculated fields
    ];

    // Count transactions per category
    const transactionCounts: Record<string, number> = {};
    transactions.forEach(transaction => {
      if (!excludeCategories.includes(transaction.category)) {
        transactionCounts[transaction.category] = (transactionCounts[transaction.category] || 0) + 1;
      }
    });
    
    // ✅ MINIMAL CHANGE: Remove the isPositive filter to show negative categories in the processing
    // But still only use positive values for pie chart data
    const allCategories = Object.entries(summary.category_totals)
      .filter(([category]) => !excludeCategories.includes(category))
      .map(([category, amount]) => {
        const numericAmount = Number(amount); // ✅ Keep original sign 
        const transactionCount = transactionCounts[category] || 0;
        const avgPerTransaction = transactionCount > 0 ? 
          numericAmount / transactionCount : 0;
        
        return {
          name: category,
          value: numericAmount, // ✅ Preserve negative values
          percentage: numericAmount > 0 ? ((numericAmount / summary.total_minus_invest) * 100).toFixed(1) : '0',
          transactionCount,
          avgPerTransaction,
          isPositive: numericAmount > 0
        };
      })
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)) // Sort by absolute value
      .slice(0, 10); // Top 10 categories
    
    // ✅ ORIGINAL LOGIC: Only positive categories for pie chart
    const positiveCategories = allCategories.filter(cat => cat.isPositive);
    const totalAmount = summary.total_minus_invest;
    
    return { chartData: positiveCategories, totalAmount, allCategories };
  }, [summary, transactions, summary.total_minus_invest]);

  // ✅ FIXED: Move categories processing outside JSX to avoid conditional hook
  const allCategoriesForLegend = useMemo(() => {
    // Exclude: income categories, investment categories, and calculated fields
    const excludeCategories = [
      'Pay', 'Payment',  // Income
      'Acorns', 'Wealthfront', 'Robinhood', 'Schwab',  // Investments
      'investment_deposits', 'investment_withdrawals', 'income', 'net_income',  // Calculated fields
      'net_overall', 'net_without_investments'  // Calculated fields
    ];
    return Object.entries(summary.category_totals)
      .filter(([category]) => !excludeCategories.includes(category))
      .map(([category, amount]) => {
        const numericAmount = Number(amount); // ✅ Keep original sign
        const transactionCount = transactions.filter(t => t.category === category).length;
        const percentage = numericAmount > 0 ? ((numericAmount / summary.total_minus_invest) * 100).toFixed(1) : '—';
        const isPositive = numericAmount > 0;
        
        return {
          name: category,
          value: numericAmount,
          percentage,
          transactionCount,
          color: COLORS[Object.keys(summary.category_totals).indexOf(category) % COLORS.length],
          isPositive
        };
      })
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [summary.category_totals, transactions, summary.total_minus_invest]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Enhanced custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: payload[0].fill }}
            />
            <p className="text-white font-semibold">{data.name}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-emerald-400 font-medium">
              {formatCurrency(data.value)} ({data.percentage}%)
            </p>
            <p className="text-slate-300">
              {data.transactionCount} transactions
            </p>
            <p className="text-slate-400">
              {formatCurrency(data.avgPerTransaction)} avg/transaction
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // ✅ RESTORE ORIGINAL STRUCTURE EXACTLY
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 h-96 flex flex-col">
      {/* Header */}
      <div className="mb-3 flex-shrink-0">
        <h3 className="text-white font-semibold text-2xl mb-1">Category Breakdown</h3>
        <p className="text-slate-400 text-sm">
          {formatCurrency(totalAmount)} total spending • {chartData.length} categories
        </p>
      </div>
      
      {chartData.length > 0 ? (
        <>
          {/* Main Content: Categories List + Chart - Original structure */}
          <div className="flex-1 flex gap-6 min-h-0">
            {/* Categories List - Left Side - ✅ SHOW ALL CATEGORIES INCLUDING NEGATIVES */}
            <div className="flex-1 overflow-y-auto max-h-96">
              <div className="space-y-1">
                {/* ✅ FIXED: Use pre-computed categories to avoid conditional hook */}
                {allCategoriesForLegend.map((entry, index) => (
                  <div 
                    key={entry.name} 
                    className={`flex items-center gap-2 p-2 rounded transition-colors ${
                      entry.isPositive 
                        ? 'hover:bg-slate-700/30' 
                        : 'hover:bg-slate-700/20 opacity-75' // ✅ Muted for negative
                    }`}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ 
                        backgroundColor: entry.isPositive ? entry.color : '#6B7280' // ✅ Gray for negative
                      }}
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <p className={`font-medium text-sm ${
                          entry.isPositive ? 'text-white' : 'text-slate-400'
                        }`}>
                          {entry.name}
                        </p>
                        <p className="text-slate-300 text-sm font-medium">
                          {entry.percentage}%
                        </p>
                      </div>
                      <p className={`text-xs ${
                        entry.isPositive ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {formatCurrency(entry.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart - Right Side - ✅ RESTORE ORIGINAL DESIGN */}
            <div className="w-64 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#0f172a"
                    strokeWidth={1}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center flex-1 text-slate-500">
          <div className="text-center">
            <p className="text-lg">No spending data available</p>
            <p className="text-sm mt-2 text-slate-600">
              Categories found: {Object.keys(summary.category_totals).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}