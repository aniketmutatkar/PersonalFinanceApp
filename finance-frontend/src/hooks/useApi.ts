import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../utils/constants';
import {
  Transaction,
  TransactionFilters,
  TransactionListResponse,
  MonthlySummary,
  MonthlySummaryListResponse,
  Category,
  CategoryListResponse,
  FinancialOverview,
  YearComparison,
  SpendingPatterns,
  BudgetAnalysis,
  FileUploadResponse,
  FilePreviewResponse,
  ApiResponse,
  PagedResponse,
  InvestigationContext,
  InvestigationResult,
  InvestigationScope,
  PatternInsight,
  AnomalyAlert,
  PatternDetectionResult,
  DrillDownOption,
  InvestigationSuggestion,
  ChartInteractionEvent,
  InvestigationMetrics
} from '../types';

// ==================== Enhanced Base API Hook ====================

export interface UseApiOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheKey?: string;
}

export interface UseApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useApi = <T>(
  endpoint: string, 
  options?: RequestInit,
  hookOptions?: UseApiOptions
): UseApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = hookOptions?.cacheKey || endpoint;
  const enabled = hookOptions?.enabled !== false;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API Error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      
      // Cache the result
      apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(`API Error for ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled, cacheKey, options]);

  useEffect(() => {
    if (hookOptions?.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, hookOptions?.refetchOnMount]);

  return { data, loading, error, refetch: fetchData };
};

// ==================== Mutation Hook for POST/PUT/DELETE ====================

export interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: string, variables: TVariables) => void;
}

export const useApiMutation = <TData = any, TVariables = any>(
  endpoint: string,
  options?: UseApiMutationOptions<TData, TVariables>
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (variables: TVariables, requestOptions?: RequestInit) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...requestOptions?.headers,
        },
        body: JSON.stringify(variables),
        ...requestOptions,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API Error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      
      // Clear relevant cache entries
      apiCache.clear();
      
      options?.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      options?.onError?.(errorMessage, variables);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};

// ==================== Core Data Hooks ====================

export const useTransactions = (filters?: TransactionFilters) => {
  const queryParams = new URLSearchParams();
  
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.start_date) queryParams.append('start_date', filters.start_date);
  if (filters?.end_date) queryParams.append('end_date', filters.end_date);
  if (filters?.month) queryParams.append('month', filters.month);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.page_size) queryParams.append('page_size', filters.page_size.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';

  return useApi<PagedResponse<Transaction>>(endpoint, undefined, {
    cacheKey: `transactions-${queryString}`
  });
};

export const useTransaction = (transactionId: number) => {
  return useApi<Transaction>(`/transactions/${transactionId}`);
};

export const useMonthlySummaries = (year?: number) => {
  const endpoint = year ? `/monthly-summary?year=${year}` : '/monthly-summary';
  return useApi<MonthlySummaryListResponse>(endpoint, undefined, {
    cacheKey: `monthly-summaries-${year || 'all'}`
  });
};

export const useMonthlySummary = (monthYear: string) => {
  return useApi<MonthlySummary>(`/monthly-summary/${monthYear}`);
};

export const useCategories = () => {
  return useApi<CategoryListResponse>('/categories', undefined, {
    cacheKey: 'categories'
  });
};

// ==================== Statistics Hooks (Now with Proper Types) ====================

export const useFinancialOverview = () => {
  return useApi<FinancialOverview>('/statistics/overview', undefined, {
    cacheKey: 'financial-overview'
  });
};

export const useYearComparison = () => {
  return useApi<YearComparison>('/statistics/year-comparison', undefined, {
    cacheKey: 'year-comparison'
  });
};

export const useSpendingPatterns = () => {
  return useApi<SpendingPatterns>('/statistics/patterns', undefined, {
    cacheKey: 'spending-patterns'
  });
};

// ==================== Budget Hooks ====================

export const useBudgets = () => {
  return useApi<Record<string, number>>('/budgets');
};

export const useBudgetAnalysis = (monthYear: string) => {
  return useApi<BudgetAnalysis>(`/budgets/analysis/${monthYear}`);
};

export const useYearlyBudgetAnalysis = (year: number) => {
  return useApi(`/budgets/yearly-analysis/${year}`);
};

// ==================== Enhanced Investigation Hooks ====================

// Generate investigation insights from raw data
const generateInvestigationInsights = (
  data: any,
  context: InvestigationContext
): PatternInsight[] => {
  const insights: PatternInsight[] = [];
  
  // This would normally be more sophisticated analysis
  // For now, we'll create basic insights based on the investigation type
  
  if (context.type === 'category' && data.categoryStats) {
    const stats = data.categoryStats;
    if (stats.volatility > 50) {
      insights.push({
        id: `volatility-${context.scope.category}`,
        type: 'statistical',
        severity: 'medium',
        title: 'High Spending Volatility',
        description: `${context.scope.category} shows high volatility with σ=${stats.volatility.toFixed(2)}`,
        explanation: 'This category has inconsistent spending patterns that may indicate irregular purchasing behavior or seasonal effects.',
        confidence: 0.85,
        supporting_data: { volatility: stats.volatility, average: stats.average },
        related_patterns: []
      });
    }
  }
  
  if (context.type === 'monthly' && data.summary) {
    const summary = data.summary;
    if (summary.total_minus_invest > 3000) {
      insights.push({
        id: `high-spending-${context.scope.month}`,
        type: 'anomaly',
        severity: 'high',
        title: 'Above Average Spending',
        description: `This month's spending of ${summary.total_minus_invest.toFixed(2)} is significantly elevated`,
        explanation: 'Monthly spending exceeded typical patterns, suggesting either increased necessary expenses or lifestyle changes.',
        confidence: 0.9,
        supporting_data: { monthly_total: summary.total_minus_invest },
        related_patterns: []
      });
    }
  }
  
  return insights;
};

// Generate investigation suggestions
const generateInvestigationSuggestions = (
  context: InvestigationContext,
  insights: PatternInsight[]
): InvestigationSuggestion[] => {
  const suggestions: InvestigationSuggestion[] = [];
  
  if (context.type === 'category') {
    suggestions.push({
      id: `drill-transactions-${context.scope.category}`,
      type: 'drill_down',
      action: 'Analyze Individual Transactions',
      description: `Examine specific transactions in ${context.scope.category} to identify spending patterns`,
      priority: 'high',
      investigation_config: {
        type: 'transaction',
        scope: {
          category: context.scope.category,
          dateRange: context.scope.dateRange
        },
        title: `Transaction Analysis: ${context.scope.category}`
      },
      estimated_insights: 3
    });
  }
  
  if (context.type === 'monthly') {
    suggestions.push({
      id: `compare-months-${context.scope.month}`,
      type: 'compare',
      action: 'Compare with Previous Months',
      description: 'See how this month compares to historical patterns',
      priority: 'medium',
      investigation_config: {
        type: 'comparison',
        scope: {
          comparisonPeriods: [context.scope.month!, 'previous-month', 'same-month-last-year']
        },
        title: `Monthly Comparison: ${context.scope.month}`
      },
      estimated_insights: 2
    });
  }
  
  return suggestions;
};

// Core investigation hook that combines multiple data sources
export const useInvestigationResults = (context: InvestigationContext | null) => {
  const [results, setResults] = useState<InvestigationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get data based on investigation type
  const categoryInvestigation = useInvestigateCategory(
    context?.scope.category || '',
    context?.scope.dateRange,
    { enabled: context?.type === 'category' }
  );
  
  const monthInvestigation = useInvestigateMonth(
    context?.scope.month || '',
    { enabled: context?.type === 'monthly' }
  );
  
  const patterns = useSpendingPatterns();
  const overview = useFinancialOverview();

  useEffect(() => {
    if (!context) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let investigationData: any = {};
      
      // Collect data based on investigation type
      if (context.type === 'category') {
        investigationData = {
          transactions: categoryInvestigation.transactions,
          categoryStats: categoryInvestigation.categoryStats,
          relatedPatterns: categoryInvestigation.relatedPatterns
        };
      } else if (context.type === 'monthly') {
        investigationData = {
          summary: monthInvestigation.summary,
          transactions: monthInvestigation.transactions,
          budget: monthInvestigation.budget,
          patterns: monthInvestigation.relevantPatterns
        };
      }

      // Generate insights from the data
      const insights = generateInvestigationInsights(investigationData, context);
      
      // Generate suggestions
      const suggestions = generateInvestigationSuggestions(context, insights);
      
      // Generate drill-down options
      const drillDownOptions: DrillDownOption[] = [];
      if (context.type === 'category' && investigationData.transactions?.items?.length > 0) {
        drillDownOptions.push({
          id: 'merchant-analysis',
          title: 'Merchant Analysis',
          description: `Analyze spending patterns by merchant within ${context.scope.category}`,
          investigation_type: 'pattern',
          scope: {
            category: context.scope.category,
            dateRange: context.scope.dateRange
          },
          estimated_complexity: 'moderate'
        });
      }

      // Create the investigation result
      const result: InvestigationResult = {
        context,
        summary: {
          title: context.title,
          key_finding: insights[0]?.description || 'Analysis complete',
          impact_level: insights.some(i => i.severity === 'high') ? 'high' : 'medium',
          primary_metric: {
            value: context.type === 'category' 
              ? investigationData.categoryStats?.total || 0
              : investigationData.summary?.total_minus_invest || 0,
            change: 0, // Would calculate from comparison data
            change_percentage: 0,
            period_comparison: 'vs. previous period'
          },
          quick_stats: []
        },
        insights,
        data_sections: [
          {
            id: 'main-chart',
            title: 'Spending Trend',
            type: 'chart',
            data: investigationData,
            interactions_enabled: true
          }
        ],
        related_transactions: investigationData.transactions?.items || [],
        suggestions,
        drill_down_options: drillDownOptions,
        confidence: insights.length > 0 ? Math.min(...insights.map(i => i.confidence)) : 0.7,
        generated_at: new Date().toISOString()
      };

      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [context, categoryInvestigation, monthInvestigation, patterns.data, overview.data]);

  return {
    results,
    loading: loading || categoryInvestigation.loading || monthInvestigation.loading,
    error: error || categoryInvestigation.error || monthInvestigation.error,
    refetch: () => {
      categoryInvestigation.refetch();
      monthInvestigation.refetch();
      patterns.refetch();
      overview.refetch();
    }
  };
};

// Hook for starting new investigations
export const useStartInvestigation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startInvestigation = useCallback(async (
    config: {
      type: InvestigationContext['type'];
      scope: InvestigationScope;
      title: string;
      source?: 'dashboard' | 'chart_click' | 'alert' | 'manual';
      trigger_data?: any;
    }
  ): Promise<InvestigationContext> => {
    setLoading(true);
    setError(null);

    try {
      // Generate investigation ID
      const investigationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create investigation context
      const context: InvestigationContext = {
        id: investigationId,
        type: config.type,
        scope: config.scope,
        title: config.title,
        startedAt: new Date().toISOString(),
        breadcrumbs: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            investigationType: 'monthly',
            scope: {},
            active: false,
            clickable: true
          },
          {
            id: investigationId,
            label: config.title,
            investigationType: config.type,
            scope: config.scope,
            active: true,
            clickable: false
          }
        ],
        metadata: {
          source: config.source || 'manual',
          trigger_data: config.trigger_data,
          depth_level: 1,
          parent_investigation_id: undefined,
          child_investigation_ids: []
        },
        tags: []
      };

      return context;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start investigation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { startInvestigation, loading, error };
};

// Hook for pattern detection and anomaly analysis
export const usePatternDetection = (scope?: InvestigationScope) => {
  const patterns = useSpendingPatterns();
  const overview = useFinancialOverview();
  
  const [detectedPatterns, setDetectedPatterns] = useState<PatternDetectionResult[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);

  useEffect(() => {
    if (!patterns.data || !overview.data) return;

    // Convert spending patterns to detection results
    const detectionResults: PatternDetectionResult[] = patterns.data.patterns.map(pattern => ({
      pattern_id: `pattern_${pattern.type}`,
      pattern_type: pattern.type === 'subscription_creep' ? 'trending' : 
                   pattern.type === 'seasonal_spikes' ? 'seasonal' : 'recurring',
      description: pattern.message,
      confidence: 0.85, // Would calculate based on statistical analysis
      time_frame: {
        start: patterns.data!.analysis_period.start,
        end: patterns.data!.analysis_period.end
      },
      affected_categories: Object.keys(overview.data!.category_statistics),
      statistical_measures: {
        mean: 0, // Would calculate from actual data
        median: 0,
        std_deviation: 0,
        variance: 0
      },
      investigation_recommendations: []
    }));

    // Convert patterns to anomaly alerts
    const anomalyAlerts: AnomalyAlert[] = patterns.data.patterns
      .filter(p => p.severity === 'warning')
      .map(pattern => ({
        id: `anomaly_${pattern.type}`,
        type: pattern.type as AnomalyAlert['type'],
        severity: 'medium',
        title: `${pattern.type.replace('_', ' ').toUpperCase()} Detected`,
        description: pattern.message,
        detailed_explanation: pattern.message,
        detected_at: new Date().toISOString(),
        confidence: 0.85,
        false_positive_likelihood: 0.15,
        investigation_context: {
          id: `inv_${pattern.type}`,
          type: 'anomaly',
          scope: { anomalyType: pattern.type },
          title: `Investigate ${pattern.type}`,
          startedAt: new Date().toISOString(),
          breadcrumbs: [],
          metadata: {
            source: 'alert',
            depth_level: 0
          },
          tags: ['auto-detected']
        },
        affected_data: {
          estimated_impact: 0 // Would calculate based on pattern data
        },
        auto_investigation_available: true
      }));

    setDetectedPatterns(detectionResults);
    setAnomalies(anomalyAlerts);
  }, [patterns.data, overview.data]);

  return {
    patterns: detectedPatterns,
    anomalies,
    loading: patterns.loading || overview.loading,
    error: patterns.error || overview.error,
    refetch: () => {
      patterns.refetch();
      overview.refetch();
    }
  };
};

// Hook for handling chart interactions that trigger investigations
export const useChartInvestigation = () => {
  const { startInvestigation } = useStartInvestigation();

  const handleChartInteraction = useCallback(async (event: ChartInteractionEvent) => {
    if (event.type !== 'click') return null;

    // Determine investigation type based on chart interaction
    let investigationType: InvestigationContext['type'] = 'transaction';
    let scope: InvestigationScope = {};
    let title = 'Chart Investigation';

    if (event.data_point.category) {
      investigationType = 'category';
      scope.category = event.data_point.category;
      title = `Investigate ${event.data_point.category}`;
    }

    if (typeof event.data_point.x === 'string' && event.data_point.x.includes('-')) {
      // Looks like a date
      investigationType = 'monthly';
      scope.month = event.data_point.x;
      title = `Investigate ${event.data_point.x}`;
    }

    return startInvestigation({
      type: investigationType,
      scope,
      title,
      source: 'chart_click',
      trigger_data: {
        chart_id: event.chart_id,
        data_point: event.data_point,
        metadata: event.metadata
      }
    });
  }, [startInvestigation]);

  return { handleChartInteraction };
};

// Hook for investigation drill-down functionality
export const useInvestigationDrillDown = (
  parentContext: InvestigationContext | null,
  drillDownOption: DrillDownOption | null
) => {
  const { startInvestigation } = useStartInvestigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeDrillDown = useCallback(async () => {
    if (!parentContext || !drillDownOption) return null;

    setLoading(true);
    setError(null);

    try {
      const childContext = await startInvestigation({
        type: drillDownOption.investigation_type,
        scope: drillDownOption.scope,
        title: drillDownOption.title,
        source: 'manual'
      });

      // Update child context with parent relationship
      childContext.metadata.parent_investigation_id = parentContext.id;
      childContext.metadata.depth_level = parentContext.metadata.depth_level + 1;

      // Update breadcrumbs to include parent
      childContext.breadcrumbs = [
        ...parentContext.breadcrumbs.slice(0, -1), // Remove parent's active breadcrumb
        {
          ...parentContext.breadcrumbs[parentContext.breadcrumbs.length - 1],
          active: false,
          clickable: true
        },
        {
          id: childContext.id,
          label: drillDownOption.title,
          investigationType: drillDownOption.investigation_type,
          scope: drillDownOption.scope,
          active: true,
          clickable: false
        }
      ];

      return childContext;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Drill-down failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [parentContext, drillDownOption, startInvestigation]);

  return { executeDrillDown, loading, error };
};

// Hook for investigation comparison analysis
export const useInvestigationComparison = (
  comparisonScope: {
    type: 'period' | 'category' | 'cross_category';
    periods?: string[];
    categories?: string[];
    baselineContext?: InvestigationContext;
  }
) => {
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get comparison data based on scope
  const yearComparison = useYearComparison();
  const overview = useFinancialOverview();

  useEffect(() => {
    if (!comparisonScope.periods && !comparisonScope.categories) return;

    setLoading(true);
    setError(null);

    try {
      // This would normally do sophisticated comparison analysis
      // For now, we'll create a basic structure
      const results = {
        comparison_type: comparisonScope.type,
        baseline: comparisonScope.baselineContext,
        comparisons: [],
        insights: [],
        significance_tests: [],
        recommendations: []
      };

      setComparisonResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison analysis failed');
    } finally {
      setLoading(false);
    }
  }, [comparisonScope, yearComparison.data, overview.data]);

  return {
    results: comparisonResults,
    loading: loading || yearComparison.loading || overview.loading,
    error: error || yearComparison.error || overview.error,
    refetch: () => {
      yearComparison.refetch();
      overview.refetch();
    }
  };
};

// ==================== Enhanced Existing Investigation Hooks ====================

export const useInvestigateCategory = (
  category: string, 
  dateRange?: { start: string; end: string },
  options?: UseApiOptions
) => {
  // Combine multiple endpoints for comprehensive category analysis
  const transactionFilters: TransactionFilters = { 
    category,
    start_date: dateRange?.start,
    end_date: dateRange?.end
  };
  
  const transactions = useTransactions(transactionFilters);
  const overview = useFinancialOverview();
  const patterns = useSpendingPatterns();

  const enabled = options?.enabled !== false;

  return {
    transactions: enabled ? transactions.data : null,
    categoryStats: enabled && overview.data ? overview.data.category_statistics[category] : null,
    relatedPatterns: enabled && patterns.data ? patterns.data.patterns.filter(p => 
      p.message.toLowerCase().includes(category.toLowerCase())
    ) : null,
    loading: enabled ? (transactions.loading || overview.loading || patterns.loading) : false,
    error: enabled ? (transactions.error || overview.error || patterns.error) : null,
    refetch: () => {
      if (enabled) {
        transactions.refetch();
        overview.refetch();
        patterns.refetch();
      }
    }
  };
};

export const useInvestigateMonth = (
  monthYear: string,
  options?: UseApiOptions
) => {
  // Combine multiple endpoints for comprehensive monthly analysis
  const summary = useMonthlySummary(monthYear);
  const transactions = useTransactions({ month: monthYear });
  const budgetAnalysis = useBudgetAnalysis(monthYear);
  const patterns = useSpendingPatterns();

  const enabled = options?.enabled !== false;

  return {
    summary: enabled ? summary.data : null,
    transactions: enabled ? transactions.data : null,
    budget: enabled ? budgetAnalysis.data : null,
    relevantPatterns: enabled && patterns.data ? patterns.data.patterns : null,
    loading: enabled ? (summary.loading || transactions.loading || budgetAnalysis.loading || patterns.loading) : false,
    error: enabled ? (summary.error || transactions.error || budgetAnalysis.error || patterns.error) : null,
    refetch: () => {
      if (enabled) {
        summary.refetch();
        transactions.refetch();
        budgetAnalysis.refetch();
        patterns.refetch();
      }
    }
  };
};

export const useInvestigateAnomaly = (anomalyType: string) => {
  // Get patterns and filter for specific anomaly type
  const patterns = useSpendingPatterns();
  const overview = useFinancialOverview();

  return {
    anomaly: patterns.data?.patterns.find(p => p.type === anomalyType),
    relatedStats: overview.data,
    loading: patterns.loading || overview.loading,
    error: patterns.error || overview.error,
    refetch: () => {
      patterns.refetch();
      overview.refetch();
    }
  };
};

export const useFileUpload = () => {
  return useApiMutation<FileUploadResponse, FormData>('/transactions/upload', {
    onSuccess: () => {
      // Clear transaction and summary caches when new data is uploaded
      apiCache.clear();
    }
  });
};

export const useFilePreview = () => {
  return useApiMutation<FilePreviewResponse, FormData>('/transactions/upload/preview');
};

export const useConfirmUpload = () => {
  return useApiMutation('/transactions/upload/confirm', {
    onSuccess: () => {
      // Clear caches after confirming upload
      apiCache.clear();
    }
  });
};

// ==================== Investigation Analytics and Metrics ====================

export const useInvestigationMetrics = (investigationId: string) => {
  const [metrics, setMetrics] = useState<InvestigationMetrics | null>(null);
  const [startTime] = useState(Date.now());
  const [interactions, setInteractions] = useState(0);

  const trackInteraction = useCallback(() => {
    setInteractions(prev => prev + 1);
  }, []);

  const generateMetrics = useCallback((): InvestigationMetrics => {
    const endTime = Date.now();
    return {
      investigation_id: investigationId,
      performance: {
        load_time_ms: endTime - startTime,
        data_processing_time_ms: 0, // Would track actual processing time
        chart_render_time_ms: 0, // Would track chart rendering
        total_time_ms: endTime - startTime
      },
      user_engagement: {
        time_spent_seconds: Math.floor((endTime - startTime) / 1000),
        interactions_count: interactions,
        drill_downs_performed: 0, // Would track from context
        insights_viewed: 0, // Would track from UI interactions
        bookmarked: false // Would track from state
      },
      data_quality: {
        completeness_percentage: 95, // Would calculate from actual data
        confidence_score: 0.85, // Would calculate from analysis
        data_points_analyzed: 0 // Would count from actual data
      }
    };
  }, [investigationId, startTime, interactions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [generateMetrics]);

  return { metrics, trackInteraction };
};

// ==================== Investigation Cache Management ====================

export const useInvestigationCache = () => {
  const clearInvestigationCache = useCallback((investigationId?: string) => {
    if (investigationId) {
      // Clear specific investigation cache
      const keysToDelete: string[] = [];
      apiCache.forEach((_, key) => {
        if (key.includes(investigationId)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => apiCache.delete(key));
    } else {
      // Clear all investigation-related cache
      const keysToDelete: string[] = [];
      apiCache.forEach((_, key) => {
        if (key.includes('investigation') || key.includes('pattern') || key.includes('anomaly')) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => apiCache.delete(key));
    }
  }, []);

  const preloadInvestigationData = useCallback(async (context: InvestigationContext) => {
    // Preload data that will likely be needed for this investigation
    const promises: Promise<any>[] = [];

    if (context.type === 'category' && context.scope.category) {
      // Preload category-related data
      promises.push(
        fetch(`${API_BASE_URL}/transactions?category=${context.scope.category}&page_size=100`)
      );
    }

    if (context.type === 'monthly' && context.scope.month) {
      // Preload monthly data
      promises.push(
        fetch(`${API_BASE_URL}/monthly-summary/${context.scope.month}`)
      );
    }

    // Always preload patterns and overview for context
    promises.push(
      fetch(`${API_BASE_URL}/statistics/patterns`),
      fetch(`${API_BASE_URL}/statistics/overview`)
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to preload some investigation data:', error);
    }
  }, []);

  return { clearInvestigationCache, preloadInvestigationData };
};

// ==================== File Upload Hooks ====================

export const useRefreshAllData = () => {
  const refreshAll = useCallback(() => {
    apiCache.clear();
    // Trigger refetch on all cached queries
    window.location.reload(); // Simple approach - could be more sophisticated
  }, []);

  return refreshAll;
};

export const useClearApiCache = () => {
  return useCallback((pattern?: string) => {
    if (pattern) {
      // Clear specific cache entries matching pattern
      const keysToDelete: string[] = [];
      apiCache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => apiCache.delete(key));
    } else {
      // Clear all cache
      apiCache.clear();
    }
  }, []);
};

// ==================== Export Functions ====================

export const exportTransactions = async (filters?: TransactionFilters) => {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.start_date) queryParams.append('start_date', filters.start_date);
  if (filters?.end_date) queryParams.append('end_date', filters.end_date);
  if (filters?.month) queryParams.append('month', filters.month);
  queryParams.append('format', 'csv');

  const response = await fetch(`${API_BASE_URL}/exports/export/transactions?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Export failed');
  }

  // Download the file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const exportMonthlySummary = async (year?: number) => {
  const queryParams = new URLSearchParams();
  if (year) queryParams.append('year', year.toString());

  const response = await fetch(`${API_BASE_URL}/exports/export/monthly-summary?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Export failed');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `monthly_summary_${year || 'all'}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};