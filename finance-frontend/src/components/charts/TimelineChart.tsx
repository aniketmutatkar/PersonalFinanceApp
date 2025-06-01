import React, { useCallback, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import BaseChart, { createInvestigationFromDataPoint, CHART_COLORS } from './BaseChart';
import type { BaseChartProps } from './BaseChart';
import { ChartDataPoint, ChartInteractionEvent } from '../../types';

interface TimelineChartProps extends Omit<BaseChartProps, 'children'> {
  variant?: 'vertical' | 'horizontal';
  showGrid?: boolean;
  showReferenceLine?: boolean;
  referenceValue?: number;
  referenceLabel?: string;
  barRadius?: number;
  formatValue?: (value: number) => string;
  formatXAxis?: (value: any) => string;
  colorScheme?: 'income' | 'expense' | 'investment' | 'neutral' | 'dynamic';
  highlightCondition?: (dataPoint: ChartDataPoint) => boolean;
  highlightColor?: string;
}

const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  variant = 'vertical',
  showGrid = true,
  showReferenceLine = false,
  referenceValue,
  referenceLabel = 'Average',
  barRadius = 4,
  formatValue = (value: number) => `$${value.toLocaleString()}`,
  formatXAxis = (value: any) => String(value),
  colorScheme = 'neutral',
  highlightCondition,
  highlightColor = CHART_COLORS.expense,
  onDataPointClick,
  ...baseProps
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Transform data for Recharts
  const chartData = data.map((point, index) => ({
    ...point,
    name: formatXAxis(point.x),
    value: point.y,
    originalIndex: index,
    isHighlighted: highlightCondition ? highlightCondition(point) : false
  }));

  // Handle bar click with investigation context
  const handleBarClick = useCallback((data: any, index: number) => {
    if (!baseProps.enableInvestigation) return;

    const originalPoint = chartData[index];
    const investigationContext = createInvestigationFromDataPoint(originalPoint, 'timeline');

    const event: ChartInteractionEvent = {
      type: 'click',
      chart_id: `timeline-${baseProps.title.toLowerCase().replace(/\s+/g, '-')}`,
      data_point: originalPoint,
      metadata: {
        chart_type: 'timeline',
        series_name: 'main',
        index
      },
      investigation_context: investigationContext
    };

    onDataPointClick?.(event);
  }, [chartData, baseProps.enableInvestigation, baseProps.title, onDataPointClick]);

  // Get bar color based on scheme and data
  const getBarColor = (entry: any, index: number) => {
    if (entry.isHighlighted) return highlightColor;
    
    switch (colorScheme) {
      case 'income': return CHART_COLORS.income;
      case 'expense': return CHART_COLORS.expense;
      case 'investment': return CHART_COLORS.investment;
      case 'dynamic': {
        // Dynamic coloring based on value
        if (entry.value > 0) return CHART_COLORS.income;
        if (entry.value < 0) return CHART_COLORS.expense;
        return CHART_COLORS.neutral;
      }
      default: return CHART_COLORS.category[index % CHART_COLORS.category.length];
    }
  };

  // Custom tooltip with investigation hint
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const value = payload[0].value;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">
          {label}
        </p>
        <p className="text-sm text-gray-600">
          <span 
            className="font-medium" 
            style={{ color: payload[0].color }}
          >
            {formatValue(value)}
          </span>
        </p>
        {data.category && (
          <p className="text-xs text-gray-500">
            Category: {data.category}
          </p>
        )}
        {data.isHighlighted && (
          <p className="text-xs text-orange-600 font-medium">
            ⚠️ Highlighted
          </p>
        )}
        {baseProps.enableInvestigation && (
          <p className="text-xs text-blue-600 mt-1">
            Click to investigate →
          </p>
        )}
      </div>
    );
  };

  // Custom bar shape for better interaction
  const CustomBar = (props: any) => {
    const { fill, ...otherProps } = props;
    const isActive = activeIndex === props.index;
    
    return (
      <Bar
        {...otherProps}
        fill={fill}
        radius={barRadius}
        className={baseProps.enableInvestigation ? 'cursor-pointer' : ''}
        style={{
          filter: isActive ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none',
          transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
          transformOrigin: 'bottom',
          transition: 'all 0.2s ease'
        }}
        onClick={() => handleBarClick(props.payload, props.index)}
        onMouseEnter={() => setActiveIndex(props.index)}
        onMouseLeave={() => setActiveIndex(null)}
      />
    );
  };

  return (
    <BaseChart {...baseProps} data={data} investigationHint="Click any bar to investigate">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={variant === 'horizontal' ? 'horizontal' : 'vertical'}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          
          {variant === 'horizontal' ? (
            <>
              <XAxis 
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={formatValue}
              />
              <YAxis 
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                angle={data.length > 6 ? -45 : 0}
                textAnchor={data.length > 6 ? 'end' : 'middle'}
                height={data.length > 6 ? 60 : 30}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={formatValue}
              />
            </>
          )}
          
          <Tooltip content={<CustomTooltip />} />
          
          {showReferenceLine && referenceValue && (
            <ReferenceLine 
              y={referenceValue} 
              stroke="#9ca3af" 
              strokeDasharray="5 5" 
              label={{ value: referenceLabel, position: 'right' }}
            />
          )}
          
          <Bar 
            dataKey="value" 
            radius={barRadius}
            className={baseProps.enableInvestigation ? 'cursor-pointer' : ''}
            onClick={(data, index) => handleBarClick(data, index)}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry, index)}
                className={baseProps.enableInvestigation ? 'hover:brightness-110 transition-all duration-150' : ''}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                style={{
                  filter: activeIndex === index ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </BaseChart>
  );
};

export default TimelineChart;