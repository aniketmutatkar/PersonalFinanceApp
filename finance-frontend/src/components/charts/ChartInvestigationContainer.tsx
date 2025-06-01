import React, { useCallback } from 'react';
import { useChartInvestigation } from '../../hooks/useApi';
import { ChartDataPoint, ChartInteractionEvent, InvestigationContext as IInvestigationContext } from '../../types';
import TrendChart from './TrendChart';
import CategoryChart from './CategoryChart';
import TimelineChart from './TimelineChart';

// Chart type definitions
export type ChartType = 'trend' | 'category' | 'timeline';

export interface ChartInvestigationContainerProps {
  // Chart configuration
  type: ChartType;
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  
  // Investigation configuration
  enableInvestigation?: boolean;
  investigationPreset?: 'monthly' | 'category' | 'transaction' | 'custom';
  customInvestigationConfig?: {
    getInvestigationType: (dataPoint: ChartDataPoint) => IInvestigationContext['type'];
    getInvestigationScope: (dataPoint: ChartDataPoint) => any;
    getInvestigationTitle: (dataPoint: ChartDataPoint) => string;
  };
  
  // Chart-specific props (passed through to underlying chart)
  chartProps?: Record<string, any>;
  
  // Callbacks
  onInvestigationStart?: (investigation: IInvestigationContext) => void;
  onChartInteraction?: (event: ChartInteractionEvent) => void;
  
  // Loading and error states
  loading?: boolean;
  error?: string;
  
  // Styling
  className?: string;
  height?: number;
}

const ChartInvestigationContainer: React.FC<ChartInvestigationContainerProps> = ({
  type,
  title,
  subtitle,
  data,
  enableInvestigation = true,
  investigationPreset = 'custom',
  customInvestigationConfig,
  chartProps = {},
  onInvestigationStart,
  onChartInteraction,
  loading = false,
  error,
  className = '',
  height = 400
}) => {
  const { handleChartInteraction } = useChartInvestigation();

  // Create investigation configuration based on preset or custom config
  const createInvestigationConfig = useCallback((dataPoint: ChartDataPoint): ChartInteractionEvent['investigation_context'] => {
    if (customInvestigationConfig) {
      return {
        type: customInvestigationConfig.getInvestigationType(dataPoint),
        scope: customInvestigationConfig.getInvestigationScope(dataPoint),
        title: customInvestigationConfig.getInvestigationTitle(dataPoint)
      };
    }

    // Use preset configurations
    switch (investigationPreset) {
      case 'monthly': {
        return {
          type: 'monthly',
          scope: { 
            month: typeof dataPoint.x === 'string' ? dataPoint.x : String(dataPoint.x),
            dateRange: dataPoint.metadata?.dateRange
          },
          title: `Investigate ${dataPoint.x}`
        };
      }
      
      case 'category': {
        return {
          type: 'category',
          scope: { 
            category: dataPoint.category || String(dataPoint.x),
            dateRange: dataPoint.metadata?.dateRange
          },
          title: `Investigate ${dataPoint.category || dataPoint.x}`
        };
      }
      
      case 'transaction': {
        return {
          type: 'transaction',
          scope: {
            transactionId: dataPoint.metadata?.transactionId,
            filters: dataPoint.metadata?.filters
          },
          title: `Investigate Transaction`
        };
      }
      
      default: {
        // Auto-detect based on data point characteristics
        if (dataPoint.category) {
          return {
            type: 'category',
            scope: { category: dataPoint.category },
            title: `Investigate ${dataPoint.category}`
          };
        }
        
        if (typeof dataPoint.x === 'string' && /^\d{4}-\d{2}/.test(dataPoint.x)) {
          return {
            type: 'monthly',
            scope: { month: dataPoint.x },
            title: `Investigate ${dataPoint.x}`
          };
        }
        
        return {
          type: 'transaction',
          scope: {},
          title: 'Investigate Data Point'
        };
      }
    }
  }, [investigationPreset, customInvestigationConfig]);

  // Handle chart interaction and trigger investigation
  const handleDataPointClick = useCallback(async (event: ChartInteractionEvent) => {
    try {
      // Call custom handler if provided
      onChartInteraction?.(event);
      
      if (!enableInvestigation) return;

      // Create investigation context if not provided
      if (!event.investigation_context) {
        event.investigation_context = createInvestigationConfig(event.data_point);
      }

      // Use the hook to handle the investigation
      const investigation = await handleChartInteraction(event);
      
      if (investigation) {
        onInvestigationStart?.(investigation);
      }
    } catch (error) {
      console.error('Failed to handle chart interaction:', error);
    }
  }, [enableInvestigation, createInvestigationConfig, handleChartInteraction, onChartInteraction, onInvestigationStart]);

  // Common props for all chart types
  const baseChartProps = {
    title,
    subtitle,
    data,
    loading,
    error,
    height,
    enableInvestigation,
    className,
    onDataPointClick: handleDataPointClick,
    ...chartProps
  };

  // Render appropriate chart based on type
  switch (type) {
    case 'trend':
      return <TrendChart {...baseChartProps} />;
    
    case 'category':
      return <CategoryChart {...baseChartProps} />;
    
    case 'timeline':
      return <TimelineChart {...baseChartProps} />;
    
    default:
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-800">
            <h3 className="font-semibold">Invalid Chart Type</h3>
            <p>Chart type "{type}" is not supported.</p>
          </div>
        </div>
      );
  }
};

// Convenience components for specific use cases
export const MonthlyTrendChart: React.FC<Omit<ChartInvestigationContainerProps, 'type' | 'investigationPreset'>> = (props) => (
  <ChartInvestigationContainer 
    {...props} 
    type="trend" 
    investigationPreset="monthly" 
    chartProps={{
      colorScheme: 'expense',
      variant: 'area',
      smooth: true,
      showReferenceLine: true,
      ...props.chartProps
    }}
  />
);

export const CategoryBreakdownChart: React.FC<Omit<ChartInvestigationContainerProps, 'type' | 'investigationPreset'>> = (props) => (
  <ChartInvestigationContainer 
    {...props} 
    type="category" 
    investigationPreset="category"
    chartProps={{
      variant: 'donut',
      showPercentages: true,
      maxSlices: 6,
      ...props.chartProps
    }}
  />
);

export const YearlyComparisonChart: React.FC<Omit<ChartInvestigationContainerProps, 'type' | 'investigationPreset'>> = (props) => (
  <ChartInvestigationContainer 
    {...props} 
    type="timeline" 
    investigationPreset="monthly"
    chartProps={{
      colorScheme: 'dynamic',
      showGrid: true,
      showReferenceLine: true,
      ...props.chartProps
    }}
  />
);

export const InvestmentProgressChart: React.FC<Omit<ChartInvestigationContainerProps, 'type' | 'investigationPreset'>> = (props) => (
  <ChartInvestigationContainer 
    {...props} 
    type="trend" 
    investigationPreset="category"
    chartProps={{
      colorScheme: 'investment',
      variant: 'area',
      smooth: true,
      fillOpacity: 0.2,
      ...props.chartProps
    }}
  />
);

// Hook for easy chart data transformation
export const useChartData = () => {
  const transformFinancialData = useCallback((
    data: any[], 
    xKey: string, 
    yKey: string, 
    categoryKey?: string
  ): ChartDataPoint[] => {
    return data.map(item => ({
      x: item[xKey],
      y: Number(item[yKey]) || 0,
      category: categoryKey ? item[categoryKey] : undefined,
      metadata: {
        originalData: item,
        timestamp: Date.now()
      }
    }));
  }, []);

  const aggregateByCategory = useCallback((
    data: ChartDataPoint[]
  ): ChartDataPoint[] => {
    const aggregated = data.reduce((acc, point) => {
      const category = point.category || 'Unknown';
      if (!acc[category]) {
        acc[category] = { x: category, y: 0, category };
      }
      acc[category].y += point.y;
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    return Object.values(aggregated).sort((a, b) => b.y - a.y);
  }, []);

  const aggregateByTimePeriod = useCallback((
    data: ChartDataPoint[],
    period: 'month' | 'year' = 'month'
  ): ChartDataPoint[] => {
    const aggregated = data.reduce((acc, point) => {
      let periodKey: string;
      
      if (typeof point.x === 'string' && /^\d{4}-\d{2}/.test(point.x)) {
        // Already in YYYY-MM format
        periodKey = period === 'year' ? point.x.split('-')[0] : point.x;
      } else if (typeof point.x === 'object' && point.x && typeof (point.x as any).getFullYear === 'function') {
        // Handle Date objects
        const dateObj = point.x as any as Date;
        periodKey = period === 'year' 
          ? dateObj.getFullYear().toString()
          : `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        periodKey = String(point.x);
      }

      if (!acc[periodKey]) {
        acc[periodKey] = { x: periodKey, y: 0, category: point.category };
      }
      acc[periodKey].y += point.y;
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    return Object.values(aggregated).sort((a, b) => String(a.x).localeCompare(String(b.x)));
  }, []);

  return {
    transformFinancialData,
    aggregateByCategory,
    aggregateByTimePeriod
  };
};

export default ChartInvestigationContainer;