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