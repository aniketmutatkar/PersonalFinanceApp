// src/types/api.ts

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
  total_sum?: number;
  avg_amount?: number;
}

// Financial Overview Types
export interface FinancialSummary {
  total_income: number;
  total_spending: number;
  total_investments: number;
  financial_growth: number;
  monthly_financial_growth: number;
  overall_savings_rate: number;
}

export interface CashFlowAnalysis {
  monthly_income: number;
  monthly_spending: number;
  monthly_investments: number;
  monthly_cash_flow: number;
  investment_rate: number;
}

export interface TopCategory {
  category: string;
  total_amount: number;
  monthly_average: number;
}

export interface SpendingIntelligence {
  top_categories: TopCategory[];
  spending_patterns: {
    fixed_expenses: number;
    discretionary_expenses: number;
    discretionary_ratio: number;
    three_month_trend: number;
  };
  discretionary_ratio: number;
  fixed_expenses: number;
}

export interface AlertFlag {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface BudgetHealth {
  adherence_score: number;
  categories_on_track: number;
  total_categories: number;
  alert_flags: AlertFlag[];
}

export interface SpendingExtreme {
  month_year: string;
  amount: number;
}

export interface FinancialOverview {
  data_available: boolean;
  date_range: {
    start_month: string;
    end_month: string;
    total_months: number;
  };
  financial_summary: FinancialSummary;
  cash_flow_analysis: CashFlowAnalysis;
  spending_intelligence: SpendingIntelligence;
  budget_health: BudgetHealth;
  yearly_trends: Record<string, any>;
  spending_extremes: {
    highest_month: SpendingExtreme;
    lowest_month: SpendingExtreme;
  };
}

// Monthly Summary Types
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

// Transaction Types
export interface Transaction {
  id?: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
  transaction_hash: string;
  month_str: string;
  total_sum?: number;
  avg_amount?: number; 
}

export interface TransactionUpdate {
  date?: string;
  description?: string;
  amount?: number;
  category?: string;
  source?: string;
}

export interface TransactionUpdateResponse {
  updated_transaction: Transaction;
  monthly_summaries_affected: string[];
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

// Budget Types
export interface BudgetItem {
  category: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  is_over_budget: boolean;
}

export interface BudgetAnalysisResponse {
  month_year: string;
  budget_items: BudgetItem[];
  total_budget: number;
  total_actual: number;
  total_variance: number;
}

// Upload Types
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

export interface UploadSummaryResponse {
  files_processed: number;
  total_transactions: number;
  new_transactions: number;           // NEW
  duplicate_transactions: number;     // NEW
  transactions_by_file: Record<string, number>;
  message: string;
  processed_transactions: ProcessedTransaction[];  // NEW
}

export interface UploadValidationError {
  file: string;
  error: string;
  type: 'size' | 'format' | 'content';
}

// Sort Types
export interface SortConfig {
  field: 'date' | 'description' | 'category' | 'amount' | 'source';
  direction: 'asc' | 'desc';
}

export interface ProcessedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
  original_filename: string;
  was_duplicate: boolean;
  was_reviewed: boolean;
}