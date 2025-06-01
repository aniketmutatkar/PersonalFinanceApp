import React, { useCallback, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import BaseChart, { createInvestigationFromDataPoint, CHART_COLORS } from './BaseChart';
import type { BaseChartProps } from './BaseChart';
import { ChartDataPoint, ChartInteractionEvent } from '../../types';

interface CategoryChartProps extends Omit<BaseChartProps, 'children'> {
  variant?: 'pie' | 'donut';
  showLabels?: boolean;
  showLegend?: boolean;
  showPercentages?: boolean;
  labelPosition?: 'inside' | 'outside';
  innerRadius?: number;
  outerRadius?: number;
  formatValue?: (value: number) => string;
  minSlicePercent?: number; // Minimum percentage for a slice to be shown
  maxSlices?: number; // Maximum number of slices, rest grouped as "Others"
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  variant = 'pie',
  showLabels = true,
  showLegend = true,
  showPercentages = true,
  labelPosition = 'outside',
  innerRadius = variant === 'donut' ? 60 : 0,
  outerRadius = 120,
  formatValue = (value: number) => `$${value.toLocaleString()}`,
  minSlicePercent = 2,
  maxSlices = 8,
  onDataPointClick,
  ...baseProps
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Process data for pie chart
  const processChartData = () => {
    const total = data.reduce((sum, item) => sum + item.y, 0);
    
    // Filter out slices below minimum percentage
    const significantData = data.filter(item => (item.y / total) * 100 >= minSlicePercent);
    
    // Sort by value (largest first)
    const sortedData = significantData.sort((a, b) => b.y - a.y);
    
    // Limit number of slices
    let processedData = sortedData.slice(0, maxSlices);
    
    // Group remaining data as "Others" if needed
    if (sortedData.length > maxSlices) {
      const othersValue = sortedData.slice(maxSlices).reduce((sum, item) => sum + item.y, 0);
      processedData.push({
        x: 'Others',
        y: othersValue,
        category: 'Others',
        metadata: { isGrouped: true, originalCount: sortedData.length - maxSlices }
      });
    }

    return processedData.map((item, index) => ({
      ...item,
      name: item.category || String(item.x),
      value: item.y,
      percentage: ((item.y / total) * 100).toFixed(1),
      originalIndex: data.findIndex(d => d === item)
    }));
  };

  const chartData = processChartData();

  // Handle slice click with investigation context
  const handleSliceClick = useCallback((data: any, index: number) => {
    if (!baseProps.enableInvestigation) return;

    // Don't allow investigation of "Others" group
    if (data.metadata?.isGrouped) return;

    const originalPoint: ChartDataPoint = {
      x: data.name,
      y: data.value,
      category: data.name,
      metadata: data.metadata
    };

    const investigationContext = createInvestigationFromDataPoint(originalPoint, 'category');

    const event: ChartInteractionEvent = {
      type: 'click',
      chart_id: `category-${baseProps.title.toLowerCase().replace(/\s+/g, '-')}`,
      data_point: originalPoint,
      metadata: {
        chart_type: 'category',
        series_name: 'categories',
        index
      },
      investigation_context: investigationContext
    };

    onDataPointClick?.(event);
  }, [baseProps.enableInvestigation, baseProps.title, onDataPointClick]);

  // Mouse enter/leave for hover effects
  const onPieEnter = useCallback((data: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">
          {data.name}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium" style={{ color: payload[0].color }}>
            {formatValue(data.value)}
          </span>
          {showPercentages && (
            <span className="ml-2 text-gray-500">
              ({data.percentage}%)
            </span>
          )}
        </p>
        {baseProps.enableInvestigation && !data.metadata?.isGrouped && (
          <p className="text-xs text-blue-600 mt-1">
            Click to investigate {data.name} →
          </p>
        )}
        {data.metadata?.isGrouped && (
          <p className="text-xs text-gray-500 mt-1">
            Groups {data.metadata.originalCount} smaller categories
          </p>
        )}
      </div>
    );
  };

  // Custom label renderer
  const renderLabel = (entry: any) => {
    if (!showLabels) return null;
    
    if (labelPosition === 'inside') {
      return showPercentages ? `${entry.percentage}%` : entry.name;
    }
    
    return `${entry.name}${showPercentages ? ` (${entry.percentage}%)` : ''}`;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    if (!showLegend) return null;

    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {payload.map((entry: any, index: number) => (
            <div 
              key={index} 
              className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                baseProps.enableInvestigation && !entry.payload.metadata?.isGrouped
                  ? 'hover:bg-gray-50' 
                  : ''
              }`}
              onClick={() => !entry.payload.metadata?.isGrouped && handleSliceClick(entry.payload, index)}
            >
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 truncate">{entry.value}</span>
              <span className="text-gray-500 ml-auto">
                {formatValue(entry.payload.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <BaseChart {...baseProps} data={data} investigationHint="Click any slice to investigate">
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={Math.min(baseProps.height || 400, 300)}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={labelPosition === 'outside' ? renderLabel : undefined}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={handleSliceClick}
              className={baseProps.enableInvestigation ? 'cursor-pointer' : ''}
            >
              {chartData.map((entry, index) => {
                const isActive = activeIndex === index;
                const isGrouped = entry.metadata?.isGrouped;
                const color = isGrouped 
                  ? CHART_COLORS.neutral 
                  : CHART_COLORS.category[index % CHART_COLORS.category.length];
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={color}
                    stroke={isActive ? '#ffffff' : 'transparent'}
                    strokeWidth={isActive ? 3 : 0}
                    style={{
                      filter: isActive ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'all 0.2s ease',
                      cursor: isGrouped ? 'default' : (baseProps.enableInvestigation ? 'pointer' : 'default')
                    }}
                  />
                );
              })}
              {labelPosition === 'inside' && showLabels && 
                chartData.map((entry, index) => (
                  <text key={`label-${index}`}>{renderLabel(entry)}</text>
                ))
              }
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Custom Legend */}
        <CustomLegend payload={chartData.map((item, index) => ({
          value: item.name,
          type: 'square',
          color: item.metadata?.isGrouped 
            ? CHART_COLORS.neutral 
            : CHART_COLORS.category[index % CHART_COLORS.category.length],
          payload: item
        }))} />
        
        {/* Summary Stats */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <div className="flex items-center justify-center space-x-4">
            <span>
              {chartData.length} categor{chartData.length !== 1 ? 'ies' : 'y'}
            </span>
            <span>
              Total: {formatValue(chartData.reduce((sum, item) => sum + item.value, 0))}
            </span>
            {baseProps.enableInvestigation && (
              <span className="text-blue-600">
                Click slices to investigate
              </span>
            )}
          </div>
        </div>
      </div>
    </BaseChart>
  );
};

export default CategoryChart;