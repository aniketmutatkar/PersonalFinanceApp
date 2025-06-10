// src/components/dashboard/NetWorthChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NetWorthData {
  month: string;
  net_worth: number;
  liquid_assets: number;
  investment_assets: number;
}

interface NetWorthChartProps {
  data: NetWorthData[];
  currentNetWorth: number;
}

function NetWorthChart({ data, currentNetWorth }: NetWorthChartProps) {
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
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-teal-400 font-bold">
              Net Worth: {formatCurrency(data.net_worth)}
            </p>
            <p className="text-blue-400 text-sm">
              Liquid: {formatCurrency(data.liquid_assets)}
            </p>
            <p className="text-green-400 text-sm">
              Invested: {formatCurrency(data.investment_assets)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-lg">Net Worth Growth (24 Months)</h3>
        <span className="text-teal-400 text-sm flex items-center">
          <span className="mr-1">↗</span>
          Trending Up
        </span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${Math.round(value / 1000)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="net_worth"
              stroke="#14B8A6"
              strokeWidth={3}
              dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#14B8A6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
        <span className="text-xs text-gray-400">24 months ago</span>
        <span className="text-sm text-teal-400 font-medium">
          Current: {formatCurrency(currentNetWorth)}
        </span>
      </div>
    </div>
  );
}

export default NetWorthChart;