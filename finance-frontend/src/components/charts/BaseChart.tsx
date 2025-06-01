import React, { useState, useCallback } from 'react';
import { useInvestigation } from '../../contexts/InvestigationContext';
import { ChartDataPoint, ChartInteractionEvent, InvestigationContext as IInvestigationContext, InvestigationScope } from '../../types';

export interface BaseChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  loading?: boolean;
  error?: string;
  height?: number;
  enableInvestigation?: boolean;
  investigationHint?: string;
  className?: string;
  onDataPointClick?: (event: ChartInteractionEvent) => void;
  children: React.ReactNode;
}

export interface ChartInvestigationConfig {
  getInvestigationType: (dataPoint: ChartDataPoint) => IInvestigationContext['type'];
  getInvestigationScope: (dataPoint: ChartDataPoint) => InvestigationScope;
  getInvestigationTitle: (dataPoint: ChartDataPoint) => string;
}

const BaseChart: React.FC<BaseChartProps> = ({
  title,
  subtitle,
  data,
  loading = false,
  error,
  height = 400,
  enableInvestigation = true,
  investigationHint = "Click to investigate",
  className = '',
  onDataPointClick,
  children
}) => {
  const { actions } = useInvestigation();
  const [isStartingInvestigation, setIsStartingInvestigation] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Handle chart interaction and investigation triggering
  const handleChartInteraction = useCallback(async (event: ChartInteractionEvent) => {
    if (!enableInvestigation || isStartingInvestigation) return;

    try {
      setIsStartingInvestigation(true);

      // Call custom handler if provided
      onDataPointClick?.(event);

      // Auto-trigger investigation if context is provided
      if (event.investigation_context) {
        await actions.startInvestigation({
          type: event.investigation_context.type,
          scope: event.investigation_context.scope,
          title: event.investigation_context.title,
          metadata: {
            source: 'chart_click',
            trigger_data: {
              chart_interaction: event
            },
            depth_level: 0
          },
          tags: ['chart-triggered']
        });
      }
    } catch (error) {
      console.error('Failed to handle chart interaction:', error);
    } finally {
      setIsStartingInvestigation(false);
    }
  }, [enableInvestigation, isStartingInvestigation, onDataPointClick, actions]);

  // Chart loading skeleton
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            {subtitle && <div className="h-4 bg-gray-200 rounded w-1/2"></div>}
          </div>
          {/* Chart skeleton */}
          <div 
            className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center"
            style={{ height }}
          >
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">📊</div>
              <div>Loading chart...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-xl border border-red-200 p-6 ${className}`}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Chart Error</h3>
          <p className="text-sm">{error}</p>
          <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div 
          className="bg-gray-50 rounded-lg flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-gray-500 text-center">
            <div className="text-4xl mb-2">📈</div>
            <div>No data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 ${className} ${
      enableInvestigation ? 'hover:border-blue-300 hover:shadow-lg cursor-pointer' : ''
    }`}>
      {/* Chart Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        
        {/* Investigation hint */}
        {enableInvestigation && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>{investigationHint}</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay for investigation */}
      {isStartingInvestigation && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium text-gray-600">Starting investigation...</span>
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div 
        className={`relative group ${enableInvestigation ? 'cursor-pointer' : ''}`}
        style={{ height }}
      >
        {children}
      </div>

      {/* Chart Footer with Data Summary */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>{data.length} data point{data.length !== 1 ? 's' : ''}</span>
        {hoveredPoint && (
          <span>
            Hover: {hoveredPoint.x} - {hoveredPoint.y}
            {hoveredPoint.category && ` (${hoveredPoint.category})`}
          </span>
        )}
        {enableInvestigation && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            Click any point to investigate →
          </span>
        )}
      </div>
    </div>
  );
};

// Utility function to create investigation context from chart data
export const createInvestigationFromDataPoint = (
  dataPoint: ChartDataPoint,
  chartType: 'trend' | 'category' | 'timeline' | 'comparison'
): ChartInteractionEvent['investigation_context'] => {
  let investigationType: IInvestigationContext['type'] = 'transaction';
  let scope: InvestigationScope = {};
  let title = 'Chart Investigation';

  // Determine investigation type and scope based on data point
  if (dataPoint.category) {
    investigationType = 'category';
    scope.category = dataPoint.category;
    title = `Investigate ${dataPoint.category}`;
  }

  // If x-axis looks like a date (YYYY-MM format)
  if (typeof dataPoint.x === 'string' && /^\d{4}-\d{2}/.test(dataPoint.x)) {
    investigationType = 'monthly';
    scope.month = dataPoint.x;
    title = `Investigate ${dataPoint.x}`;
  }

  // If x-axis looks like a year
  if (typeof dataPoint.x === 'number' && dataPoint.x > 2000 && dataPoint.x < 2100) {
    investigationType = 'monthly';
    scope.year = dataPoint.x;
    title = `Investigate ${dataPoint.x}`;
  }

  return {
    type: investigationType,
    scope,
    title
  };
};

// Color palette for financial data
export const CHART_COLORS = {
  // Income colors (greens)
  income: '#10b981',
  pay: '#059669',
  
  // Expense colors (reds/oranges)
  expense: '#ef4444',
  spending: '#dc2626',
  
  // Investment colors (blues)
  investment: '#3b82f6',
  savings: '#1d4ed8',
  
  // Category colors (varied palette)
  category: [
    '#3b82f6', // blue
    '#ef4444', // red  
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280'  // gray
  ],
  
  // Neutral colors
  neutral: '#6b7280',
  background: '#f8fafc',
  
  // Gradient backgrounds
  gradients: {
    income: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    expense: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
    investment: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    neutral: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  }
};

export default BaseChart;