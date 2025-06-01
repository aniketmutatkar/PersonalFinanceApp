import React, { useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import BaseChart, { createInvestigationFromDataPoint, CHART_COLORS } from './BaseChart';
import type { BaseChartProps } from './BaseChart';
import { ChartDataPoint, ChartInteractionEvent } from '../../types';

interface TrendChartProps extends Omit<BaseChartProps, 'children'> {
  variant?: 'line' | 'area';
  showGrid?: boolean;
  showReferenceLine?: boolean;
  referenceValue?: number;
  referenceLabel?: string;
  smooth?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
  dataKey?: string;
  xAxisKey?: string;
  formatValue?: (value: number) => string;
  formatXAxis?: (value: any) => string;
  colorScheme?: 'income' | 'expense' | 'investment' | 'neutral';
}

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  variant = 'line',
  showGrid = true,
  showReferenceLine = false,
  referenceValue,
  referenceLabel = 'Average',
  smooth = true,
  strokeWidth = 2,
  fillOpacity = 0.1,
  dataKey = 'y',
  xAxisKey = 'x',
  formatValue = (value: number) => `$${value.toLocaleString()}`,
  formatXAxis = (value: any) => String(value),
  colorScheme = 'neutral',
  onDataPointClick,
  ...baseProps
}) => {
  // Transform data for Recharts
  const chartData = data.map((point, index) => ({
    ...point,
    [xAxisKey]: point.x,
    [dataKey]: point.y,
    originalIndex: index
  }));

  // Handle point click with investigation context
  const handlePointClick = useCallback((data: any, index: number) => {
    if (!baseProps.enableInvestigation) return;

    const originalPoint = chartData[index];
    const investigationContext = createInvestigationFromDataPoint(originalPoint, 'trend');

    const event: ChartInteractionEvent = {
      type: 'click',
      chart_id: `trend-${baseProps.title.toLowerCase().replace(/\s+/g, '-')}`,
      data_point: originalPoint,
      metadata: {
        chart_type: 'trend',
        series_name: 'main',
        index
      },
      investigation_context: investigationContext
    };

    onDataPointClick?.(event);
  }, [chartData, baseProps.enableInvestigation, baseProps.title, onDataPointClick]);

  // Get color scheme
  const getColor = () => {
    switch (colorScheme) {
      case 'income': return CHART_COLORS.income;
      case 'expense': return CHART_COLORS.expense;
      case 'investment': return CHART_COLORS.investment;
      default: return CHART_COLORS.category[0];
    }
  };

  const color = getColor();

  // Custom tooltip with investigation hint
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const value = data.value;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">
          {formatXAxis(label)}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium" style={{ color }}>
            {formatValue(value)}
          </span>
        </p>
        {baseProps.enableInvestigation && (
          <p className="text-xs text-blue-600 mt-1">
            Click to investigate →
          </p>
        )}
      </div>
    );
  };

  // Custom dot for better click interaction
  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke="white"
        strokeWidth={2}
        className={baseProps.enableInvestigation ? 'cursor-pointer hover:r-6 transition-all duration-150' : ''}
        onClick={() => handlePointClick(payload, index)}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
      />
    );
  };

  return (
    <BaseChart {...baseProps} data={data} investigationHint="Click any point to investigate">
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
            <XAxis 
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatXAxis}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            {showReferenceLine && referenceValue && (
              <ReferenceLine 
                y={referenceValue} 
                stroke="#9ca3af" 
                strokeDasharray="5 5" 
                label={{ value: referenceLabel, position: 'right' }}
              />
            )}
            <Area
              type={smooth ? 'monotone' : 'linear'}
              dataKey={dataKey}
              stroke={color}
              strokeWidth={strokeWidth}
              fill={color}
              fillOpacity={fillOpacity}
              dot={<CustomDot />}
              activeDot={{ 
                r: 6, 
                fill: color,
                stroke: 'white',
                strokeWidth: 2,
                style: { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }
              }}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
            <XAxis 
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatXAxis}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            {showReferenceLine && referenceValue && (
              <ReferenceLine 
                y={referenceValue} 
                stroke="#9ca3af" 
                strokeDasharray="5 5" 
                label={{ value: referenceLabel, position: 'right' }}
              />
            )}
            <Line
              type={smooth ? 'monotone' : 'linear'}
              dataKey={dataKey}
              stroke={color}
              strokeWidth={strokeWidth}
              dot={<CustomDot />}
              activeDot={{ 
                r: 6, 
                fill: color,
                stroke: 'white',
                strokeWidth: 2,
                style: { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }
              }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </BaseChart>
  );
};

export default TrendChart;