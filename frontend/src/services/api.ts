import { FinancialOverview } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

class FinanceApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getFinancialOverview(): Promise<FinancialOverview> {
    return this.request<FinancialOverview>('/statistics/overview');
  }

  async getYearComparison() {
    return this.request('/statistics/year-comparison');
  }

  async getMonthlySummaries(year?: number) {
    const params = year ? `?year=${year}` : '';
    return this.request(`/monthly-summary${params}`);
  }

  async getTransactions(params: {
    category?: string;
    month?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.category) searchParams.append('category', params.category);
    if (params.month) searchParams.append('month', params.month);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('page_size', params.pageSize.toString());
    
    const queryString = searchParams.toString();
    return this.request(`/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async getCategories() {
    return this.request('/categories');
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export const financeApi = new FinanceApi();
export default FinanceApi;