// Base chart components
export { default as BaseChart, CHART_COLORS, createInvestigationFromDataPoint } from './BaseChart';
export { default as TrendChart } from './TrendChart';
export { default as CategoryChart } from './CategoryChart';
export { default as TimelineChart } from './TimelineChart';

// Chart investigation container
export { 
  default as ChartInvestigationContainer,
  MonthlyTrendChart,
  CategoryBreakdownChart,
  YearlyComparisonChart,
  InvestmentProgressChart,
  useChartData
} from './ChartInvestigationContainer';

// Types and utilities
export type { ChartType, ChartInvestigationContainerProps } from './ChartInvestigationContainer';

// Re-export common types for convenience
export type { ChartDataPoint, ChartInteractionEvent } from '../../types';