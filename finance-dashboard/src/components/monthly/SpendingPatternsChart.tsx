// src/components/monthly/SpendingPatternsChart.tsx - REVERT TO ORIGINAL + minimal Math.abs fix
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { Transaction } from '../../types/api';

interface SpendingPatternsChartProps {
  transactions: Transaction[];
  monthYear: string; // e.g., "December 2024"
}

type ViewType = 'weekly' | 'category';

interface CombinedSpendingData {
  day: number;
  date: string;
  longPeriodTotal?: number;   // Renamed from weeklyTotal
  shortPeriodTotal?: number;  // Renamed from fourDayTotal
}

interface CategorySpendingData {
  day: number;
  date: string;
  [category: string]: number | string; // Dynamic category amounts
}

// Category colors matching your chart
const CATEGORY_COLORS: Record<string, string> = {
  'Rent': '#10B981',
  'Food': '#F59E0B', 
  'Venmo': '#3B82F6',
  'Shopping': '#EF4444',
  'Groceries': '#8B5CF6',
  'Travel': '#06B6D4',
  'Subscriptions': '#F97316',
  'Utilities': '#84CC16',
  'Entertainment': '#EC4899',
  'Transportation': '#6366F1'
};

export default function SpendingPatternsChart({ transactions, monthYear }: SpendingPatternsChartProps) {
  const [activeView, setActiveView] = useState<ViewType>('weekly');

  // CONFIGURABLE PERIOD LENGTHS - Change these to experiment!
  const SHORT_PERIOD_DAYS = 2;  // Current: 2-day periods
  const LONG_PERIOD_DAYS = 5;   // Current: 5-day periods

  const { combinedData, categoryData, weeklyInsights, categoryInsights } = useMemo(() => {
    if (!transactions.length) {
      return { 
        combinedData: [],
        categoryData: [], 
        weeklyInsights: { peak: 0, lowest: 0, average: 0, peakWeek: '', lowestWeek: '' },
        categoryInsights: { topCategories: [], totalDays: 0 }
      };
    }

    // ✅ DEBUG: Log the incoming data
    console.log('🔧 SpendingPatternsChart Debug:');
    console.log('🔧 Transactions count:', transactions.length);
    console.log('🔧 Sample transactions:', transactions.slice(0, 3));
    console.log('🔧 Month/Year:', monthYear);

    const [monthName, year] = monthYear.split(' ');
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const daysInMonth = new Date(parseInt(year), monthIndex + 1, 0).getDate();

    // Store daily spending - ✅ ONLY CHANGE: Remove Math.abs() here
    const dailySpending: Record<number, number> = {};
    
    transactions.forEach(transaction => {
      const amount = Number(transaction.amount); // ✅ FIXED: Convert to number first!
      const date = new Date(transaction.date);
      const day = date.getDate();
      
      dailySpending[day] = (dailySpending[day] || 0) + amount;
    });

    // ✅ DEBUG: Log daily spending data
    console.log('🔧 Daily spending totals:', dailySpending);
    console.log('🔧 Days in month:', daysInMonth);

    // Create combined data array starting with day 0
    const processedCombinedData: CombinedSpendingData[] = [];
    
    // Add starting point at day 0 with zero values
    processedCombinedData.push({
      day: 0,
      date: `${monthName.slice(0, 3)} 0`,
      longPeriodTotal: 0,
      shortPeriodTotal: 0
    });
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData: CombinedSpendingData = {
        day,
        date: `${monthName.slice(0, 3)} ${day}`
      };

      // Add long period total at the end of each period
      if (day % LONG_PERIOD_DAYS === 0 || day === daysInMonth) {
        const periodStart = Math.floor((day - 1) / LONG_PERIOD_DAYS) * LONG_PERIOD_DAYS + 1;
        const periodEnd = day;
        let longPeriodTotal = 0;
        
        for (let d = periodStart; d <= periodEnd; d++) {
          longPeriodTotal += dailySpending[d] || 0;
        }
        
        dayData.longPeriodTotal = longPeriodTotal;
      }

      // Add short period total at the end of each period
      if (day % SHORT_PERIOD_DAYS === 0 || day === daysInMonth) {
        const periodStart = Math.floor((day - 1) / SHORT_PERIOD_DAYS) * SHORT_PERIOD_DAYS + 1;
        const periodEnd = day;
        let shortPeriodTotal = 0;
        
        for (let d = periodStart; d <= periodEnd; d++) {
          shortPeriodTotal += dailySpending[d] || 0;
        }
        
        dayData.shortPeriodTotal = shortPeriodTotal;
      }

      processedCombinedData.push(dayData);
    }

    // Calculate period insights from the data points that have totals
    const longPeriodTotals = processedCombinedData
      .filter(d => d.longPeriodTotal !== undefined)
      .map(d => d.longPeriodTotal!)
      .filter(total => typeof total === 'number' && isFinite(total)); // ✅ FIXED: Remove > 0 filter, allow negatives
    
    // ✅ DEBUG: Log period totals
    console.log('🔧 Long period totals (all valid numbers):', longPeriodTotals);
    console.log('🔧 All long period data:', processedCombinedData.filter(d => d.longPeriodTotal !== undefined).map(d => ({ day: d.day, total: d.longPeriodTotal })));
    
    const weeklyPeak = longPeriodTotals.length > 0 ? Math.max(...longPeriodTotals) : 0;
    const weeklyLowest = longPeriodTotals.length > 0 ? Math.min(...longPeriodTotals) : 0;
    const weeklyAverage = longPeriodTotals.length > 0 ? longPeriodTotals.reduce((sum, amt) => sum + amt, 0) / longPeriodTotals.length : 0;
    
    const peakWeekDay = processedCombinedData.find(d => d.longPeriodTotal === weeklyPeak);
    const lowestWeekDay = processedCombinedData.find(d => d.longPeriodTotal === weeklyLowest && d.longPeriodTotal && d.longPeriodTotal > 0);
    
    const peakWeek = peakWeekDay ? `${LONG_PERIOD_DAYS}-day period ending ${peakWeekDay.date}` : '';
    const lowestWeek = lowestWeekDay ? `${LONG_PERIOD_DAYS}-day period ending ${lowestWeekDay.date}` : '';

    // CATEGORY DATA PROCESSING
    // Get top 6 categories by total spending (excluding investment and payment categories)
    const excludeCategories = ['Pay', 'Payment', 'Acorns', 'Wealthfront', 'Robinhood', 'Schwab'];
    const categoryTotals: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount); // ✅ Keep Math.abs() for category ranking only
      if (!excludeCategories.includes(transaction.category)) {
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
      }
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6) // Top 6 after exclusions
      .map(([category]) => category);

    // ✅ DEBUG: Log category processing
    console.log('🔧 Category totals:', categoryTotals);
    console.log('🔧 Top categories:', topCategories);

    // Group by day and category - ✅ ONLY CHANGE: Remove Math.abs() here too
    const dailyCategorySpending: Record<string, Record<string, number>> = {};
    
    transactions.forEach(transaction => {
      const amount = Number(transaction.amount); // ✅ FIXED: Convert to number first!
      const date = new Date(transaction.date);
      const day = date.getDate();
      const dayKey = day.toString();
      
      if (!dailyCategorySpending[dayKey]) {
        dailyCategorySpending[dayKey] = {};
      }
      
      if (topCategories.includes(transaction.category)) {
        dailyCategorySpending[dayKey][transaction.category] = 
          (dailyCategorySpending[dayKey][transaction.category] || 0) + amount;
      }
    });

    // Create category data array
    const processedCategoryData: CategorySpendingData[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = day.toString();
      const dayData: CategorySpendingData = {
        day,
        date: `${monthName.slice(0, 3)} ${day}`
      };
      
      topCategories.forEach(category => {
        dayData[category] = dailyCategorySpending[dayKey]?.[category] || 0;
      });
      
      processedCategoryData.push(dayData);
    }

    // ✅ DEBUG: Log final data structures
    console.log('🔧 Final combined data sample:', processedCombinedData.slice(0, 5));
    console.log('🔧 Final category data sample:', processedCategoryData.slice(0, 5));
    console.log('🔧 Weekly insights:', {
      peak: weeklyPeak,
      lowest: weeklyLowest,
      average: weeklyAverage
    });

    return {
      combinedData: processedCombinedData,
      categoryData: processedCategoryData,
      weeklyInsights: {
        peak: weeklyPeak,
        lowest: weeklyLowest,
        average: weeklyAverage,
        peakWeek,
        lowestWeek
      },
      categoryInsights: {
        topCategories,
        totalDays: daysInMonth
      }
    };
  }, [transactions, monthYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryColor = (category: string, index: number) => {
    return CATEGORY_COLORS[category] || COLORS[index % COLORS.length];
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const CombinedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{data.date}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const periodLength = entry.dataKey.includes('long') ? 
                LONG_PERIOD_DAYS : SHORT_PERIOD_DAYS;
              return (
                <p key={index} style={{ color: entry.color }} className="text-sm">
                  {periodLength}-Day Total: {formatCurrency(entry.value)}
                </p>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const CategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{data.date}</p>
          <div className="space-y-1">
            {categoryInsights.topCategories.map((category, index) => {
              const amount = data[category] as number;
              if (amount !== 0) { // ✅ FIXED: Show both positive AND negative amounts
                return (
                  <p key={category} className="text-sm" style={{ color: getCategoryColor(category, index) }}>
                    {category}: {formatCurrency(amount)}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!transactions.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 h-96 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <p className="text-lg">No transaction data</p>
          <p className="text-sm mt-1">No spending patterns to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 h-96 flex flex-col">
      {/* Header with Tabs */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-2xl">Spending Patterns</h3>
          
          {/* Tab Controls */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setActiveView('weekly')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeView === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setActiveView('category')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeView === 'category'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Category
            </button>
          </div>
        </div>
        
        <p className="text-slate-400 text-sm">
          {activeView === 'weekly' 
            ? `Peak: ${formatCurrency(weeklyInsights.peak)} • Lowest: ${formatCurrency(weeklyInsights.lowest)} • Avg: ${formatCurrency(weeklyInsights.average)}`
            : `Daily spending breakdown by top ${categoryInsights.topCategories.length} categories`
          }
        </p>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[180px] mb-1">
        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'weekly' ? (
            <LineChart data={combinedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="day"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
                tickFormatter={formatCurrency}
                domain={['dataMin', 'dataMax']}
                tickCount={6}
              />
              {/* ✅ ADDED: Zero reference line */}
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" strokeWidth={1} />
              <Tooltip content={<CombinedTooltip />} />
              
              {/* Long period totals (blue) */}
              <Line
                type="monotone"
                dataKey="longPeriodTotal"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                connectNulls={true}
              />
              
              {/* Short period totals (green solid) */}
              <Line
                type="monotone"
                dataKey="shortPeriodTotal"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                connectNulls={true}
              />
            </LineChart>
          ) : (
            <LineChart data={categoryData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="day"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
                tickFormatter={formatCurrency}
                domain={['dataMin', 'dataMax']}
                tickCount={6}
              />
              {/* ✅ ADDED: Zero reference line */}
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" strokeWidth={1} />
              <Tooltip content={<CategoryTooltip />} />
              
              {categoryInsights.topCategories.map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={getCategoryColor(category, index)}
                  strokeWidth={2}
                  dot={{ fill: getCategoryColor(category, index), strokeWidth: 1, r: 2 }}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}