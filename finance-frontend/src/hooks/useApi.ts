import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';
import {
  Transaction,
  TransactionFilters,
  TransactionListResponse,
  MonthlySummary,
  MonthlySummaryListResponse,
  Category,
  CategoryListResponse,
  BudgetAnalysis,
  ApiResponse,
  PagedResponse
} from '../types';

// Generic API hook for making requests
export const useApi = <T>(endpoint: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
};

// Specific hooks for different API endpoints
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

  return useApi<PagedResponse<Transaction>>(endpoint);
};

export const useMonthlySummaries = (year?: number) => {
  const endpoint = year ? `/monthly-summary?year=${year}` : '/monthly-summary';
  return useApi<MonthlySummaryListResponse>(endpoint);
};

export const useMonthlySummary = (monthYear: string) => {
  return useApi<MonthlySummary>(`/monthly-summary/${monthYear}`);
};

export const useCategories = () => {
  return useApi<CategoryListResponse>('/categories');
};

export const useBudgetAnalysis = (monthYear: string) => {
  return useApi<BudgetAnalysis>(`/budgets/analysis/${monthYear}`);
};

export const useBudgets = () => {
  return useApi<Record<string, number>>('/budgets');
};