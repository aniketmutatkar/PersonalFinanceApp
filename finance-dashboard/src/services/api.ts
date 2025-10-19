
// src/services/api.ts
import {
  FinancialOverview,
  MonthlySummaryListResponse,
  MonthlySummary,
  Transaction,
  TransactionUpdate,
  TransactionUpdateResponse,
  PagedResponse,
  BudgetAnalysisResponse,
  TransactionListResponse,
  ApiResponse,
  FilePreviewResponse,
  UploadConfirmation,
  UploadSummaryResponse,
  InvestmentOverviewData,
  InvestmentTrendsData,
  InvestmentAccount,
  INVESTMENT_ACCOUNT_COLORS,
  PortfolioOverview,
  PortfolioTrends,
  AccountPerformance,
  InstitutionBreakdown,
  AccountListResponse,
  ManualBalanceCreate,
  BalanceResponse,
  BalanceListResponse,
} from '../types/api';

export interface MonthlySummariesParams {
  year?: number;
  sort_direction?: 'asc' | 'desc';
}

// API Client Class
export class FinanceTrackerApi {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (process.env.NODE_ENV === 'development') {
      // Use environment variables in development
      const host = process.env.REACT_APP_API_HOST || 'localhost';
      const port = process.env.REACT_APP_API_PORT || '8000';
      this.baseUrl = `http://${host}:${port}/api`;
    } else {
      // Production uses relative URLs
      this.baseUrl = '/api';
    }
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
      console.log(`📡 API Request: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ API request error:', error);
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
  async getMonthlySummaries(params?: MonthlySummariesParams): Promise<MonthlySummaryListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.year) {
      queryParams.append('year', params.year.toString());
    }
    
    if (params?.sort_direction) {
      queryParams.append('sort_direction', params.sort_direction);
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/monthly-summary?${queryString}` : '/monthly-summary';
    
    return this.request<MonthlySummaryListResponse>(url);
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

  async updateTransaction(transactionId: number, updates: TransactionUpdate): Promise<TransactionUpdateResponse> {
    return this.request<TransactionUpdateResponse>(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
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

  private safeNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  // Investment Analytics API Methods
  async getInvestmentOverview(): Promise<InvestmentOverviewData> {
    try {
      // Get all investment transactions using individual calls for each category
      // This avoids the 422 error with multiple categories
      const investmentCategories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab'];
      
      const allTransactions: Transaction[] = [];
      
      // Fetch transactions for each investment category separately
      for (const category of investmentCategories) {
        try {
          const response = await this.getTransactions({
            category: category, // Use single category instead of categories array
            page_size: 1000 // Reasonable limit per category
          });
          allTransactions.push(...response.items);
        } catch (error) {
          console.warn(`Failed to fetch ${category} transactions:`, error);
          // Continue with other categories
        }
      }

      // Get monthly summaries for investment rate calculation
      const monthlySummaries = await this.getMonthlySummaries();

      return this.processInvestmentOverview(allTransactions, monthlySummaries.summaries);
    } catch (error) {
      console.error('Error in getInvestmentOverview:', error);
      throw error;
    }
  }

  async getInvestmentTrends(): Promise<InvestmentTrendsData> {
    try {
      // Get monthly summaries to extract investment data by month
      const monthlySummaries = await this.getMonthlySummaries();
      return this.processInvestmentTrends(monthlySummaries.summaries);
    } catch (error) {
      console.error('Error in getInvestmentTrends:', error);
      throw error;
    }
  }

  private processInvestmentOverview(transactions: Transaction[], monthlySummaries: MonthlySummary[]): InvestmentOverviewData {
    const investmentCategories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab'];

    // Separate deposits (positive) and withdrawals (negative)
    const investmentTransactions = transactions.filter(tx => investmentCategories.includes(tx.category));

    const totalDeposits = investmentTransactions
      .filter(tx => this.safeNumber(tx.amount) > 0)
      .reduce((sum, tx) => sum + this.safeNumber(tx.amount), 0);

    const totalWithdrawals = Math.abs(investmentTransactions
      .filter(tx => this.safeNumber(tx.amount) < 0)
      .reduce((sum, tx) => sum + this.safeNumber(tx.amount), 0));

    const netInvested = totalDeposits - totalWithdrawals;

    // Calculate account breakdown
    const accountBreakdown: InvestmentAccount[] = investmentCategories.map(account => {
      const accountTransactions = transactions.filter(tx => tx.category === account);

      // Separate deposits and withdrawals per account
      const accountDeposits = accountTransactions
        .filter(tx => this.safeNumber(tx.amount) > 0)
        .reduce((sum, tx) => sum + this.safeNumber(tx.amount), 0);

      const accountWithdrawals = Math.abs(accountTransactions
        .filter(tx => this.safeNumber(tx.amount) < 0)
        .reduce((sum, tx) => sum + this.safeNumber(tx.amount), 0));

      const accountNet = accountDeposits - accountWithdrawals;
      const transactionCount = accountTransactions.length;
      
      // Calculate monthly average (only for months with activity)
      const monthsWithActivity = new Set(accountTransactions.map(tx => tx.month_str)).size;
      const monthlyAverage = monthsWithActivity > 0 ? accountDeposits / monthsWithActivity : 0;

      // Get last deposit date (only from positive transactions)
      const depositTransactions = accountTransactions.filter(tx => this.safeNumber(tx.amount) > 0);
      const lastDepositDate = depositTransactions.length > 0
        ? depositTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : undefined;

      // Calculate consistency score (based on regular deposits)
      const consistencyScore = this.calculateConsistencyScore(depositTransactions);

      return {
        name: account,
        total_deposits: accountDeposits,
        total_withdrawals: accountWithdrawals,
        net_invested: accountNet,
        monthly_average: monthlyAverage,
        transaction_count: transactionCount,
        last_deposit_date: lastDepositDate,
        consistency_score: consistencyScore
      };
    }).filter(account => account.total_deposits > 0 || account.total_withdrawals > 0);

    // Calculate overall monthly average (based on deposits)
    const totalMonths = monthlySummaries.length || 1;
    const monthlyAverage = totalDeposits / totalMonths;

    // Find best month (based on deposits only, ignoring withdrawals)
    const monthlyInvestments = monthlySummaries.map(summary => {
      const monthDeposits = this.safeNumber(summary.investment_total) > 0
        ? this.safeNumber(summary.investment_total)
        : 0;
      return {
        month_year: summary.month_year,
        amount: monthDeposits
      };
    });

    const bestMonth = monthlyInvestments.length > 0
      ? monthlyInvestments.reduce((best, current) =>
          current.amount > best.amount ? current : best,
          { month_year: 'None', amount: 0 }
        )
      : { month_year: 'None', amount: 0 };

    // Calculate investment rate (deposits as % of income)
    // Income is negative in database, so we use Math.abs to get positive value
    const totalIncome = Math.abs(monthlySummaries.reduce((sum, summary) =>
      sum + this.safeNumber(summary.category_totals['Pay']), 0
    ));
    const investmentRate = totalIncome > 0 ? (totalDeposits / totalIncome) * 100 : 0;

    // Calculate overall consistency score
    const overallConsistencyScore = accountBreakdown.length > 0
      ? accountBreakdown.reduce((sum, account) => sum + account.consistency_score, 0) / accountBreakdown.length
      : 0;

    // Determine period covered
    const sortedSummaries = monthlySummaries.sort((a, b) => 
      new Date(a.year, this.getMonthNumber(a.month)).getTime() - 
      new Date(b.year, this.getMonthNumber(b.month)).getTime()
    );

    return {
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      net_invested: netInvested,
      monthly_average: monthlyAverage,
      active_accounts: accountBreakdown.length,
      investment_rate: investmentRate,
      account_breakdown: accountBreakdown,
      best_month: {
        month: bestMonth.month_year,
        amount: bestMonth.amount
      },
      consistency_score: overallConsistencyScore,
      period_covered: {
        start_month: sortedSummaries[0]?.month_year || 'N/A',
        end_month: sortedSummaries[sortedSummaries.length - 1]?.month_year || 'N/A',
        total_months: totalMonths
      }
    };
  }

  private processInvestmentTrends(monthlySummaries: MonthlySummary[]): InvestmentTrendsData {
    const investmentCategories = ['Acorns', 'Wealthfront', 'Robinhood', 'Schwab'];
    
    // Sort summaries by date
    const sortedSummaries = monthlySummaries.sort((a, b) => 
      new Date(a.year, this.getMonthNumber(a.month)).getTime() - 
      new Date(b.year, this.getMonthNumber(b.month)).getTime()
    );

    // Process monthly trends - FIX: Convert all category totals to numbers
    const monthlyTrends = sortedSummaries.map(summary => {
      const monthDisplay = `${summary.month.slice(0, 3)} ${summary.year}`;
      
      return {
        month: summary.month,
        year: summary.year,
        month_display: monthDisplay,
        acorns: this.safeNumber(summary.category_totals['Acorns']),
        wealthfront: this.safeNumber(summary.category_totals['Wealthfront']),
        robinhood: this.safeNumber(summary.category_totals['Robinhood']),
        schwab: this.safeNumber(summary.category_totals['Schwab']),
        total: this.safeNumber(summary.investment_total)
      };
    });

    // Calculate account allocation - FIX: Convert category totals to numbers
    const accountTotals = investmentCategories.map(account => {
      const total = monthlySummaries.reduce((sum, summary) => 
        sum + this.safeNumber(summary.category_totals[account]), 0
      );
      return { account, total };
    }).filter(item => item.total > 0);

    const grandTotal = accountTotals.reduce((sum, item) => sum + item.total, 0);

    const accountAllocation = accountTotals.map(item => ({
      account: item.account,
      percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
      total: item.total,
      color: INVESTMENT_ACCOUNT_COLORS[item.account as keyof typeof INVESTMENT_ACCOUNT_COLORS] || '#6B7280',
      monthly_average: monthlySummaries.length > 0 ? item.total / monthlySummaries.length : 0
    }));

    // Find peak month
    const peakMonth = monthlyTrends.length > 0 
      ? monthlyTrends.reduce((peak, current) => 
          current.total > peak.total ? current : peak,
          { month_display: 'None', total: 0 }
        )
      : { month_display: 'None', total: 0 };

    return {
      monthly_trends: monthlyTrends,
      account_allocation: accountAllocation,
      peak_month: {
        month: peakMonth.month_display,
        amount: peakMonth.total
      }
    };
  }

  private calculateConsistencyScore(transactions: Transaction[]): number {
    if (transactions.length < 2) return transactions.length * 50;
    
    // Group by month and calculate monthly totals - FIX: Convert amounts to numbers
    const monthlyTotals = transactions.reduce((acc, tx) => {
      const month = tx.month_str;
      acc[month] = (acc[month] || 0) + this.safeNumber(tx.amount);
      return acc;
    }, {} as Record<string, number>);

    const amounts = Object.values(monthlyTotals);
    if (amounts.length === 0) return 0;
    
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    if (average === 0) return 0;
    
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / average;
    
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  }

  private getMonthNumber(monthName: string): number {
    const months = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3,
      'May': 4, 'June': 5, 'July': 6, 'August': 7,
      'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    return months[monthName as keyof typeof months] || 0;
  }

  // Portfolio Overview
  async getPortfolioOverview(asOfDate?: string): Promise<PortfolioOverview> {
    const params = asOfDate ? `?as_of_date=${asOfDate}` : '';
    return this.request(`/portfolio/overview${params}`);
  }

  // Portfolio Trends
  async getPortfolioTrends(period?: string): Promise<PortfolioTrends> {
  const params = period ? `?period=${period}` : '';
  return this.request<PortfolioTrends>(`/portfolio/trends${params}`);
}

  // Account Performance
  async getAccountPerformance(accountId: number, period: string = "1y"): Promise<AccountPerformance> {
    return this.request(`/portfolio/performance/${accountId}?period=${period}`);
  }

  // Institution Breakdown
  async getInstitutionBreakdown(): Promise<InstitutionBreakdown> {
    return this.request('/portfolio/institutions');
  }

  // Account Management
  async getAllAccounts(): Promise<AccountListResponse> {
    return this.request('/portfolio/accounts');
  }

  // Manual Balance Entry
  async addManualBalance(balanceData: ManualBalanceCreate): Promise<BalanceResponse> {
    return this.request('/portfolio/balances', {
      method: 'POST',
      body: JSON.stringify(balanceData)
    });
  }

  // Balance History
  async getBalanceHistory(accountId?: number, startDate?: string, endDate?: string): Promise<BalanceListResponse> {
    const params = new URLSearchParams();
    if (accountId) params.append('account_id', accountId.toString());
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request(`/portfolio/balances?${params}`);
  }

  // Historical Net Worth
  async getHistoricalNetWorth(period: string = "2y"): Promise<Array<{
    month: string;
    date: string;
    net_worth: number;
    liquid_assets: number;
    investment_assets: number;
    bank_balance: number;
    wealthfront_cash: number;
  }>> {
    return this.request(`/financial-metrics/net-worth/history?period=${period}`);
  }

}

// Export singleton instance
export const api = new FinanceTrackerApi();