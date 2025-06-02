// src/services/types.ts

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
  transaction_hash: string;
  month_str: string;
}

export interface MonthlySummary {
  id: number;
  month: string;
  year: number;
  month_year: string;
  category_totals: Record<string, number>;
  investment_total: number;
  total: number;
  total_minus_invest: number;
}

export interface Category {
  name: string;
  keywords: string[];
  budget: number | null;
  is_investment: boolean;
  is_income: boolean;
  is_payment: boolean;
}

export interface FinancialOverview {
  data_available: boolean;
  date_range: {
    start_month: string;
    end_month: string;
    total_months: number;
  };
  spending_extremes: {
    highest_month: {
      month_year: string;
      amount: number;
    };
    lowest_month: {
      month_year: string;
      amount: number;
    };
  };
  category_statistics: Record<string, {
    total: number;
    average: number;
    volatility: number;
    months_active: number;
    consistency_score: number;
  }>;
  yearly_totals: Record<string, {
    total_spending: number;
    total_investments: number;
    total_income: number;
    months: number;
    categories: Record<string, number>;
  }>;
  financial_summary: {
    total_income: number;
    total_spending: number;
    total_investments: number;
    net_worth_change: number;
    overall_savings_rate: number;
  };
}

export interface ApiResponse<T> {
  items: T[];
  total: number;
  page?: number;
  page_size?: number;
  pages?: number;
}