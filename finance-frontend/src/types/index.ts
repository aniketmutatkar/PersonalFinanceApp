// Core domain types matching the Python backend exactly

export interface Transaction {
  id?: number;
  date: string; // ISO date string
  description: string;
  amount: number; // Python Decimal becomes number in TypeScript
  category: string;
  source: string;
  transaction_hash: string;
  month_str: string; // YYYY-MM format
}

export interface TransactionCreate {
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
}

export interface MonthlySummary {
  id?: number;
  month: string;
  year: number;
  month_year: string;
  category_totals: Record<string, number>; // Dict[str, Decimal] in Python
  investment_total: number;
  total: number;
  total_minus_invest: number;
}

export interface Category {
  name: string;
  keywords: string[];
  budget?: number;
  is_investment: boolean;
  is_income: boolean;
  is_payment: boolean;
}

// ==================== NEW STATISTICS TYPES ====================

export interface CategoryStatistic {
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

export interface YearlyTotal {
  total_spending: number;
  total_investments: number;
  total_income: number;
  months: number;
  categories: Record<string, number>;
  average_monthly_spending?: number;
  average_monthly_income?: number;
  average_monthly_investments?: number;
}

export interface GrowthTrend {
  spending_growth: number;
  previous_year_spending: number;
  current_year_spending: number;
}

export interface FinancialSummary {
  total_income: number;
  total_spending: number;
  total_investments: number;
  net_worth_change: number;
  overall_savings_rate: number;
}

export interface FinancialStatistics {
  data_available: boolean;
  date_range: {
    start_month: string;
    end_month: string;
    total_months: number;
  };
  spending_extremes: {
    highest_month: SpendingExtreme;
    lowest_month: SpendingExtreme;
  };
  category_statistics: Record<string, CategoryStatistic>;
  yearly_totals: Record<string, YearlyTotal>;
  growth_trends: Record<string, GrowthTrend>;
  volatility_rankings: {
    most_volatile: VolatilityRanking;
    least_volatile: VolatilityRanking;
  };
  top_categories: TopCategory[];
  financial_summary: FinancialSummary;
}

export interface YearComparisonData {
  years: Record<string, YearlyTotal>;
  available_years: number[];
  comparison_ready: boolean;
}

export interface SpendingPattern {
  type: 'subscription_creep' | 'seasonal_spikes' | 'consistent_investing';
  severity: 'positive' | 'warning' | 'info';
  message: string;
  data: any;
}

export interface SpendingPatterns {
  patterns: SpendingPattern[];
  pattern_count: number;
  analysis_period: {
    start: string;
    end: string;
    months_analyzed: number;
  };
}

// ==================== EXISTING TYPES ====================

// API Response wrappers
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

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

export interface MonthlySummaryListResponse {
  summaries: MonthlySummary[];
  total: number;
}

export interface CategoryListResponse {
  categories: Category[];
}

// Upload related types
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

export interface CategoryUpdate {
  temp_id: string;
  new_category: string;
}

export interface UploadConfirmation {
  session_id: string;
  category_updates: CategoryUpdate[];
}

// Filter and query types
export interface TransactionFilters {
  category?: string;
  start_date?: string;
  end_date?: string;
  month?: string;
  page?: number;
  page_size?: number;
}