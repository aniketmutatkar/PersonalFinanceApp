// src/components/budget/BudgetChart.tsx
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BudgetChartProps {
  data: any;
  type: 'yearly' | 'monthly';
  year?: number;
  monthYear?: string;
}

export default function BudgetChart({ data, type, year, monthYear }: BudgetChartProps) {
  const chartData = useMemo(() => {
    if (type === 'monthly') {
      // Monthly view - show budget vs actual by category
      return (data.budget_items || [])
        .filter((item: any) => item.budget_amount > 0 || item.actual_amount > 0)
        .map((item: any) => ({
          category: item.category,
          budget: Number(item.budget_amount),
          actual: Number(item.actual_amount),
          isOverBudget: item.is_over_budget
        }))
        .sort((a: any, b: any) => b.budget - a.budget)
        .slice(0, 10); // Top 10 categories
    } else {
      // Yearly view - show average budget vs actual by month
      const months = data.months || [];
      const budgetData = data.budget_data || {};
      
      return months.map((month: string) => {
        const monthData = budgetData[month] || {};
        
        let monthlyBudget = 0;
        let monthlyActual = 0;
        let overBudgetCount = 0;
        let totalCategories = 0;
        
        Object.values(monthData).forEach((item: any) => {
          monthlyBudget += Number(item.budget_amount) || 0;
          monthlyActual += Number(item.actual_amount) || 0;
          totalCategories++;
          if (item.is_over_budget) overBudgetCount++;
        });
        
        return {
          month: month.substring(0, 3), // Abbreviate month names
          budget: monthlyBudget,
          actual: monthlyActual,
          variance: monthlyBudget - monthlyActual,
          overBudgetCount,
          adherenceRate: totalCategories > 0 ? ((totalCategories - overBudgetCount) / totalCategories) * 100 : 100
        };
      });
    }
  }, [data, type]);

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
      if (type === 'monthly') {
        const budget = payload.find((p: any) => p.dataKey === 'budget')?.value || 0;
        const actual = payload.find((p: any) => p.dataKey === 'actual')?.value || 0;
        const variance = budget - actual;
        const isOverBudget = actual > budget;
        
        return (
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
            <p className="text-white font-semibold">{label}</p>
            <p className="text-blue-400">Budget: {formatCurrency(budget)}</p>
            <p className="text-green-400">Actual: {formatCurrency(actual)}</p>
            <p className={`${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
              Variance: {formatCurrency(Math.abs(variance))} {isOverBudget ? 'over' : 'under'}
            </p>
          </div>
        );
      } else {
        const budget = payload.find((p: any) => p.dataKey === 'budget')?.value || 0;
        const actual = payload.find((p: any) => p.dataKey === 'actual')?.value || 0;
        const data = payload[0]?.payload;
        
        return (
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
            <p className="text-white font-semibold">{label}</p>
            <p className="text-blue-400">Budget: {formatCurrency(budget)}</p>
            <p className="text-green-400">Actual: {formatCurrency(actual)}</p>
            <p className="text-gray-300">Adherence: {data.adherenceRate.toFixed(1)}%</p>
            {data.overBudgetCount > 0 && (
              <p className="text-red-400">{data.overBudgetCount} categories over budget</p>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const title = type === 'monthly' 
    ? `Budget vs Actual - ${monthYear}`
    : `Monthly Budget Performance - ${year}`;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 h-full">
      <h3 className="text-white font-semibold text-base mb-6">{title}</h3>
      
      {chartData.length > 0 ? (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey={type === 'monthly' ? 'category' : 'month'} 
                stroke="#9CA3AF" 
                fontSize={12}
                angle={type === 'monthly' ? -45 : 0}
                textAnchor={type === 'monthly' ? 'end' : 'middle'}
                height={type === 'monthly' ? 60 : 30}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#D1D5DB' }}
              />
              <Bar 
                dataKey="budget" 
                fill="#3B82F6" 
                name="Budget"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="actual" 
                fill="#10B981" 
                name="Actual"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p>No budget data available</p>
            <p className="text-sm mt-2">
              {type === 'monthly' ? 'No categories with budget data' : 'No monthly data found'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}