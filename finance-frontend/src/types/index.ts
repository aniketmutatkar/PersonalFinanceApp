// ==================== Base API Types ====================

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
  message?: string;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

// ==================== Core Financial Domain Types ====================

export interface Transaction {
  id?: number;
  date: string; // ISO date string
  description: string;
  amount: number;
  category: string;
  source: string;
  transaction_hash: string;
  month_str: string; // YYYY-MM format
}

export interface TransactionFilters {
  category?: string;
  start_date?: string;
  end_date?: string;
  month?: string;
  page?: number;
  page_size?: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

export interface MonthlySummary {
  id?: number;
  month: string;
  year: number;
  month_year: string;
  category_totals: Record<string, number>;
  investment_total: number;
  total: number;
  total_minus_invest: number;
}

export interface MonthlySummaryListResponse {
  summaries: MonthlySummary[];
  total: number;
}

export interface Category {
  name: string;
  keywords: string[];
  budget?: number;
  is_investment: boolean;
  is_income: boolean;
  is_payment: boolean;
}

export interface CategoryListResponse {
  categories: Category[];
}

// ==================== Statistics API Types (Exact Match to Backend) ====================

export interface CategoryStatistics {
  total: number;
  average: number;
  volatility: number;
  months_active: number;
  consistency_score: number;
}

export interface SpendingExtreme {
  month_year: string;
  amount: number;
}

export interface VolatilityRanking {
  category: string;
  volatility: number;
}

export interface TopCategory {
  category: string;
  total: number;
}

export interface FinancialSummary {
  total_income: number;
  total_spending: number;
  total_investments: number;
  net_worth_change: number;
  overall_savings_rate: number;
}

export interface GrowthTrend {
  spending_growth: number;
  previous_year_spending: number;
  current_year_spending: number;
}

export interface DateRange {
  start_month: string;
  end_month: string;
  total_months: number;
}

// Main statistics overview response - matches /api/statistics/overview exactly
export interface FinancialOverview {
  data_available: boolean;
  date_range: DateRange;
  spending_extremes: {
    highest_month: SpendingExtreme;
    lowest_month: SpendingExtreme;
  };
  category_statistics: Record<string, CategoryStatistics>;
  yearly_totals: Record<string, {
    total_spending: number;
    total_investments: number;
    total_income: number;
    months: number;
    categories: Record<string, number>;
    average_monthly_spending?: number;
    average_monthly_income?: number;
    average_monthly_investments?: number;
  }>;
  growth_trends: Record<string, GrowthTrend>;
  volatility_rankings: {
    most_volatile: VolatilityRanking;
    least_volatile: VolatilityRanking;
  };
  top_categories: TopCategory[];
  financial_summary: FinancialSummary;
}

// Year comparison response - matches /api/statistics/year-comparison exactly
export interface YearComparison {
  years: Record<string, {
    categories: Record<string, number>;
    investments: number;
    income: number;
    total_spending: number;
    months_count: number;
    average_monthly_spending?: number;
    average_monthly_income?: number;
    average_monthly_investments?: number;
  }>;
  available_years: number[];
  comparison_ready: boolean;
}

export interface SpendingPattern {
  type: 'subscription_creep' | 'seasonal_spikes' | 'consistent_investing';
  severity: 'warning' | 'info' | 'positive';
  message: string;
  data: Record<string, any>;
}

export interface AnalysisPeriod {
  start: string;
  end: string;
  months_analyzed: number;
}

// Spending patterns response - matches /api/statistics/patterns exactly
export interface SpendingPatterns {
  patterns: SpendingPattern[];
  pattern_count: number;
  analysis_period: AnalysisPeriod;
}

// ==================== Investigation System Types ====================

// Core Investigation Types
export interface InvestigationContext {
  id: string;
  type: 'monthly' | 'category' | 'anomaly' | 'pattern' | 'transaction' | 'comparison' | 'trend';
  scope: InvestigationScope;
  title: string;
  description?: string;
  startedAt: string;
  lastUpdated?: string;
  breadcrumbs: BreadcrumbItem[];
  metadata: InvestigationMetadata;
  tags: string[];
}

export interface InvestigationScope {
  category?: string;
  month?: string;
  year?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  transactionId?: number;
  transactionIds?: number[];
  anomalyType?: string;
  patternType?: string;
  comparisonPeriods?: string[];
  filters?: InvestigationFilter[];
}

export interface InvestigationMetadata {
  source: 'dashboard' | 'chart_click' | 'alert' | 'manual' | 'suggestion';
  trigger_data?: Record<string, any>;
  depth_level: number; // 0 = overview, 1 = category/month, 2 = transaction
  parent_investigation_id?: string;
  child_investigation_ids?: string[];
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  investigationType: InvestigationContext['type'];
  scope: Partial<InvestigationScope>;
  active: boolean;
  clickable: boolean;
}

// Investigation State Management
export interface InvestigationState {
  currentInvestigation: InvestigationContext | null;
  isInvestigating: boolean;
  investigationPanel: {
    isOpen: boolean;
    width: number;
    position: 'right' | 'bottom';
  };
  history: InvestigationContext[];
  bookmarks: BookmarkedInvestigation[];
  recentInvestigations: InvestigationContext[];
  investigationCache: Record<string, InvestigationResult>;
}

export interface BookmarkedInvestigation {
  id: string;
  investigation: InvestigationContext;
  bookmarked_at: string;
  notes?: string;
  custom_title?: string;
  tags: string[];
}

// Investigation Results and Analysis
export interface InvestigationResult {
  context: InvestigationContext;
  summary: InvestigationSummary;
  insights: PatternInsight[];
  data_sections: InvestigationDataSection[];
  related_transactions: Transaction[];
  suggestions: InvestigationSuggestion[];
  drill_down_options: DrillDownOption[];
  confidence: number;
  statistical_significance?: number;
  generated_at: string;
}

export interface InvestigationSummary {
  title: string;
  key_finding: string;
  impact_level: 'high' | 'medium' | 'low';
  primary_metric: {
    value: number;
    change: number;
    change_percentage: number;
    period_comparison: string;
  };
  quick_stats: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }>;
}

export interface InvestigationDataSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'metrics' | 'text' | 'comparison';
  data: any;
  chart_config?: ChartConfig;
  interactions_enabled: boolean;
  investigation_triggers?: InvestigationTrigger[];
}

export interface PatternInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'correlation' | 'statistical' | 'seasonal' | 'behavioral';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  explanation: string;
  confidence: number;
  supporting_data: Record<string, any>;
  visual_evidence?: {
    chart_type: string;
    data: any;
    highlight_points?: any[];
  };
  related_patterns?: string[];
}

export interface InvestigationSuggestion {
  id: string;
  type: 'drill_down' | 'compare' | 'analyze_trend' | 'find_related' | 'external_action';
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  investigation_config: {
    type: InvestigationContext['type'];
    scope: InvestigationScope;
    title: string;
  };
  estimated_insights: number;
}

export interface DrillDownOption {
  id: string;
  title: string;
  description: string;
  investigation_type: InvestigationContext['type'];
  scope: InvestigationScope;
  preview_data?: any;
  estimated_complexity: 'simple' | 'moderate' | 'complex';
}

// Investigation Triggers and Interactions
export interface InvestigationTrigger {
  id: string;
  trigger_type: 'click' | 'hover' | 'selection' | 'filter';
  target_element: string;
  investigation_config: {
    type: InvestigationContext['type'];
    scope: InvestigationScope;
    title: string;
    auto_execute?: boolean;
  };
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
}

export interface ChartInteractionEvent {
  type: 'click' | 'hover' | 'select' | 'brush';
  chart_id: string;
  data_point: ChartDataPoint;
  selection?: ChartDataPoint[];
  metadata: {
    chart_type: string;
    series_name?: string;
    index: number;
  };
  investigation_context?: Partial<InvestigationContext>;
}

// Anomaly and Pattern Detection
export interface AnomalyAlert {
  id: string;
  type: 'spending_spike' | 'subscription_creep' | 'unusual_transaction' | 'pattern_break' | 'seasonal_deviation' | 'category_drift';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detailed_explanation: string;
  detected_at: string;
  confidence: number;
  false_positive_likelihood: number;
  investigation_context: InvestigationContext;
  affected_data: {
    transactions?: number[];
    categories?: string[];
    time_periods?: string[];
    estimated_impact: number;
  };
  auto_investigation_available: boolean;
}

export interface PatternDetectionResult {
  pattern_id: string;
  pattern_type: 'recurring' | 'seasonal' | 'trending' | 'anomalous' | 'cyclic';
  description: string;
  confidence: number;
  time_frame: {
    start: string;
    end: string;
    frequency?: string;
  };
  affected_categories: string[];
  statistical_measures: {
    mean: number;
    median: number;
    std_deviation: number;
    variance: number;
  };
  investigation_recommendations: InvestigationSuggestion[];
}

// Investigation Navigation and Flow
export interface InvestigationFlow {
  current_step: number;
  total_steps: number;
  steps: InvestigationStep[];
  flow_type: 'linear' | 'branching' | 'exploratory';
  completion_percentage: number;
}

export interface InvestigationStep {
  id: string;
  title: string;
  description: string;
  step_type: 'data_collection' | 'analysis' | 'visualization' | 'decision_point';
  required: boolean;
  completed: boolean;
  data_requirements: string[];
  expected_outcomes: string[];
  next_steps: string[];
}

// Investigation Templates and Presets
export interface InvestigationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'monthly_analysis' | 'category_deep_dive' | 'anomaly_investigation' | 'trend_analysis' | 'comparison';
  investigation_type: InvestigationContext['type'];
  scope_template: Partial<InvestigationScope>;
  predefined_steps: InvestigationStep[];
  required_parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'date' | 'category' | 'transaction_id';
    required: boolean;
    default_value?: any;
  }>;
  estimated_duration: number; // in minutes
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
}

// Investigation Sharing and Export
export interface InvestigationShareConfig {
  include_raw_data: boolean;
  include_charts: boolean;
  include_insights: boolean;
  include_recommendations: boolean;
  format: 'json' | 'pdf' | 'csv' | 'url';
  access_level: 'public' | 'restricted' | 'private';
  expiration_date?: string;
}

export interface SharedInvestigation {
  id: string;
  investigation: InvestigationContext;
  result: InvestigationResult;
  share_config: InvestigationShareConfig;
  shared_at: string;
  shared_by: string;
  access_count: number;
  last_accessed?: string;
}

// Investigation Performance and Analytics
export interface InvestigationMetrics {
  investigation_id: string;
  performance: {
    load_time_ms: number;
    data_processing_time_ms: number;
    chart_render_time_ms: number;
    total_time_ms: number;
  };
  user_engagement: {
    time_spent_seconds: number;
    interactions_count: number;
    drill_downs_performed: number;
    insights_viewed: number;
    bookmarked: boolean;
  };
  data_quality: {
    completeness_percentage: number;
    confidence_score: number;
    data_points_analyzed: number;
  };
}

// ==================== Chart and UI Data Types ====================

export interface ChartDataPoint {
  x: string | number;
  y: number;
  category?: string;
  metadata?: Record<string, any>;
  investigation_context?: {
    type: InvestigationContext['type'];
    scope: InvestigationScope;
    title: string;
  };
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'heatmap';
  title: string;
  subtitle?: string;
  x_axis: {
    label: string;
    type: 'category' | 'datetime' | 'numeric';
    format?: string;
  };
  y_axis: {
    label: string;
    format?: string;
    scale?: 'linear' | 'log';
  };
  series: Array<{
    name: string;
    data: ChartDataPoint[];
    color?: string;
    investigation_enabled?: boolean;
  }>;
  interactions: {
    click_to_investigate: boolean;
    hover_insights: boolean;
    zoom_enabled: boolean;
    brush_selection: boolean;
  };
  investigation_triggers?: InvestigationTrigger[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
  comparison_value?: number;
  anomaly_detected?: boolean;
  investigation_context?: Partial<InvestigationContext>;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
  change_amount?: number;
  change_percentage?: number;
  investigation_available?: boolean;
}

// ==================== Filter and State Types ====================

export interface GlobalFilters {
  dateRange: {
    start: string;
    end: string;
    preset?: 'last_30_days' | 'last_3_months' | 'last_6_months' | 'last_year' | 'ytd' | 'custom';
  };
  categories: string[];
  excludeCategories: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  sources?: string[];
  investigationContext?: Partial<InvestigationContext>;
}

export interface InvestigationFilter {
  id: string;
  type: 'category' | 'date' | 'amount' | 'pattern' | 'anomaly' | 'source';
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  label: string;
  active: boolean;
  removable: boolean;
  investigation_impact: 'high' | 'medium' | 'low';
}

export interface NavigationState {
  currentPage: string;
  investigationOpen: boolean;
  sidebarCollapsed: boolean;
  activeFilters: InvestigationFilter[];
  breadcrumbs: BreadcrumbItem[];
  investigationHistory: string[]; // investigation IDs
}

// ==================== Investigation Context Actions ====================

export interface InvestigationAction {
  type: 'START_INVESTIGATION' | 'UPDATE_INVESTIGATION' | 'COMPLETE_INVESTIGATION' | 
        'BOOKMARK_INVESTIGATION' | 'SHARE_INVESTIGATION' | 'DRILL_DOWN' | 
        'ADD_FILTER' | 'REMOVE_FILTER' | 'CHANGE_SCOPE' | 'NAVIGATE_BREADCRUMB';
  payload: {
    investigation?: InvestigationContext;
    scope?: InvestigationScope;
    filter?: InvestigationFilter;
    breadcrumb?: BreadcrumbItem;
    metadata?: Record<string, any>;
  };
}

export interface InvestigationContextValue {
  state: InvestigationState;
  actions: {
    startInvestigation: (config: Partial<InvestigationContext>) => void;
    updateInvestigation: (updates: Partial<InvestigationContext>) => void;
    completeInvestigation: () => void;
    drillDown: (drillDownOption: DrillDownOption) => void;
    addFilter: (filter: InvestigationFilter) => void;
    removeFilter: (filterId: string) => void;
    navigateToBreadcrumb: (breadcrumbId: string) => void;
    bookmarkInvestigation: (notes?: string) => void;
    shareInvestigation: (shareConfig: InvestigationShareConfig) => void;
    clearHistory: () => void;
  };
  utils: {
    generateInvestigationId: () => string;
    buildBreadcrumbs: (context: InvestigationContext) => BreadcrumbItem[];
    createInvestigationUrl: (context: InvestigationContext) => string;
    parseInvestigationUrl: (url: string) => Partial<InvestigationContext> | null;
  };
}

// ==================== Export and Utility Types ====================

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  scope: 'current_view' | 'filtered_data' | 'investigation_results' | 'full_dataset';
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  includeInsights?: boolean;
  includeCharts?: boolean;
  includeRawData?: boolean;
  customFields?: string[];
}

export interface InvestigationHistory {
  investigations: InvestigationContext[];
  bookmarks: BookmarkedInvestigation[];
  recent: InvestigationContext[];
  templates: InvestigationTemplate[];
  shared: SharedInvestigation[];
}

// ==================== Quick Investigation Types ====================

export interface QuickInvestigationAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  investigation_template: InvestigationTemplate;
  required_parameters: string[];
  estimated_time_minutes: number;
  popular: boolean;
}

export interface InvestigationShortcut {
  id: string;
  title: string;
  hotkey?: string;
  investigation_config: Partial<InvestigationContext>;
  context_dependent: boolean;
  available_contexts: InvestigationContext['type'][];
}

// ==================== Investigation UI State Types ====================

export interface InvestigationPanelState {
  isOpen: boolean;
  position: 'right' | 'bottom' | 'modal';
  width: number;
  height: number;
  resizable: boolean;
  pinned: boolean;
  activeTab: 'overview' | 'insights' | 'data' | 'suggestions' | 'history';
}

export interface InvestigationToolbarState {
  visible: boolean;
  position: 'top' | 'floating';
  tools: Array<{
    id: string;
    icon: string;
    label: string;
    action: () => void;
    disabled?: boolean;
    active?: boolean;
  }>;
}

// ==================== Investigation Routing Types ====================

export interface InvestigationRoute {
  path: string;
  investigation_type: InvestigationContext['type'];
  scope_params: Record<string, string>;
  query_params: Record<string, string>;
  shareable: boolean;
}

export interface InvestigationUrlConfig {
  base_path: string;
  param_mapping: Record<string, string>;
  default_params: Record<string, any>;
  validation_rules: Record<string, (value: any) => boolean>;
}

// ==================== Budget Types ====================

export interface BudgetItem {
  category: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  is_over_budget: boolean;
}

export interface BudgetAnalysis {
  month_year: string;
  budget_items: BudgetItem[];
  total_budget: number;
  total_actual: number;
  total_variance: number;
}

// ==================== Upload Types ====================

export interface FileUploadResponse {
  message: string;
  transactions_count: number;
  categories: string[];
}

export interface TransactionPreview {
  temp_id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
  suggested_categories: string[];
}

export interface FilePreviewResponse {
  session_id: string;
  total_transactions: number;
  misc_transactions: TransactionPreview[];
  requires_review: boolean;
  files_processed: number;
}