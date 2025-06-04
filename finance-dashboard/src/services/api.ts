// src/services/api.ts
import {
  FinancialOverview,
  MonthlySummaryListResponse,
  MonthlySummary,
  Transaction,
  PagedResponse,
  BudgetAnalysisResponse,
  TransactionListResponse,
  ApiResponse,
  FilePreviewResponse,
  UploadConfirmation,
  UploadSummaryResponse
} from '../types/api';

// API Client Class
export class FinanceTrackerApi {
  private baseUrl: string;

  constructor(baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000/api' 
    : '/api'
  ) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    try {
      console.log(`API Request: ${url}`); // Debug log for development
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  private async requestWithFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      console.log(`API File Upload: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API file upload error:', error);
      throw error;
    }
  }

  // Statistics API
  async getFinancialOverview(): Promise<FinancialOverview> {
    return this.request<FinancialOverview>('/statistics/overview');
  }

  async getYearComparison(): Promise<any> {
    return this.request<any>('/statistics/year-comparison');
  }

  async getSpendingPatterns(): Promise<any> {
    return this.request<any>('/statistics/patterns');
  }

  // Monthly Summary API
  async getMonthlySummaries(year?: number): Promise<MonthlySummaryListResponse> {
    const queryParams = year ? `?year=${year}` : '';
    return this.request<MonthlySummaryListResponse>(`/monthly-summary${queryParams}`);
  }
  
  async getMonthlySummary(monthYear: string): Promise<MonthlySummary> {
    return this.request<MonthlySummary>(`/monthly-summary/${monthYear}`);
  }

  // Transactions API
  async getTransactions(params: {
    categories?: string[];
    category?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    month?: string;
    page?: number;
    page_size?: number;
    sort_field?: string;     // ADD THIS
    sort_direction?: string; // ADD THIS
  } = {}): Promise<PagedResponse<Transaction>> {
    const queryParams = new URLSearchParams();
    
    // Handle multiple categories
    if (params.categories && params.categories.length > 0) {
      params.categories.forEach(category => {
        queryParams.append('categories', category);
      });
    }
    // Legacy single category
    else if (params.category) {
      queryParams.append('category', params.category);
    }
    
    // Add description search
    if (params.description) {
      queryParams.append('description', params.description);
    }
    
    // Add other parameters  
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && 
          key !== 'categories' && key !== 'category' && key !== 'description') {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.request<PagedResponse<Transaction>>(`/transactions?${queryParams}`);
  }

  async getTransaction(transactionId: number): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${transactionId}`);
  }

  async uploadFilesPreview(files: File[]): Promise<ApiResponse<FilePreviewResponse>> {
    const formData = new FormData();
    
    // Add each file to the form data
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return this.requestWithFile<ApiResponse<FilePreviewResponse>>('/transactions/upload/preview', formData);
  }

  async confirmUpload(confirmation: UploadConfirmation): Promise<ApiResponse<UploadSummaryResponse>> {
    return this.request<ApiResponse<UploadSummaryResponse>>('/transactions/upload/confirm', {
      method: 'POST',
      body: JSON.stringify(confirmation),
    });
  }

  // Budget API
  async getBudgets(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/budgets');
  }
  
  async getBudgetAnalysis(monthYear: string): Promise<BudgetAnalysisResponse> {
    return this.request<BudgetAnalysisResponse>(`/budgets/analysis/${monthYear}`);
  }
  
  async getYearlyBudgetAnalysis(year: number): Promise<any> {
    return this.request<any>(`/budgets/yearly-analysis/${year}`);
  }

  // Categories API
  async getCategories(): Promise<any> {
    return this.request<any>('/categories');
  }

  async getTransactionsByCategory(category: string, params: {
    page?: number;
    page_size?: number;
  } = {}): Promise<TransactionListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return this.request<TransactionListResponse>(`/categories/${category}/transactions?${queryString}`);
  }

  // Health Check
  async checkHealth(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl.replace('/api', '')}/api/health`);
    return response.json();
  }
}

// Export singleton instance
export const api = new FinanceTrackerApi();