// api-client.js - Complete Finance Tracker API Client

/**
 * API Client for Finance Tracker
 * Use this to connect your React frontend to the Finance Tracker API
 */
class FinanceTrackerApi {
  constructor(baseUrl = 'http://localhost:8000/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    try {
      const response = await fetch(url, config);
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }
      
      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Get auth token if implemented
   */
  getAuthToken() {
    // Implement your auth token retrieval logic here
    // For example: return localStorage.getItem('authToken');
    return null;
  }

  // ==================== Transactions API ====================
  
  /**
   * Get transactions with optional filters
   */
  async getTransactions(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add optional parameters
    if (params.category) queryParams.append('category', params.category);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    if (params.month) queryParams.append('month', params.month);
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('page_size', params.pageSize);
    
    const queryString = queryParams.toString();
    return this.request(`/transactions?${queryString}`);
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(transactionId) {
    return this.request(`/transactions/${transactionId}`);
  }

  /**
   * Create a new transaction manually
   */
  async createTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  /**
   * Upload transaction file (legacy single file endpoint)
   */
  async uploadTransactionFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/transactions/upload', {
      method: 'POST',
      headers: {
        // Remove Content-Type so browser can set it properly with boundary
      },
      body: formData,
    });
  }

  /**
   * Preview files and get transactions needing review
   */
  async uploadFilesPreview(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return this.request('/transactions/upload/preview', {
      method: 'POST',
      headers: {
        // Remove Content-Type so browser can set it properly with boundary
      },
      body: formData,
    });
  }

  /**
   * Confirm upload with reviewed categories
   */
  async confirmUpload(sessionId, categoryUpdates) {
    return this.request('/transactions/upload/confirm', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        category_updates: categoryUpdates
      }),
    });
  }

  // ==================== Monthly Summary API ====================
  
  /**
   * Get monthly summaries
   */
  async getMonthlySummaries(year) {
    const queryParams = year ? `?year=${year}` : '';
    return this.request(`/monthly-summary${queryParams}`);
  }
  
  /**
   * Get specific monthly summary
   */
  async getMonthlySummary(monthYear) {
    return this.request(`/monthly-summary/${monthYear}`);
  }
  
  // ==================== Categories API ====================
  
  /**
   * Get all categories
   */
  async getCategories() {
    return this.request('/categories');
  }
  
  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(category, params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('page_size', params.pageSize);
    
    const queryString = queryParams.toString();
    return this.request(`/categories/${category}/transactions?${queryString}`);
  }
  
  /**
   * Get category statistics
   */
  async getCategoryStatistics(category) {
    return this.request(`/categories/${category}/statistics`);
  }
  
  // ==================== Budget API ====================
  
  /**
   * Get all budget values
   */
  async getBudgets() {
    return this.request('/budgets');
  }
  
  /**
   * Get budget analysis for a month
   */
  async getBudgetAnalysis(monthYear) {
    return this.request(`/budgets/analysis/${monthYear}`);
  }
  
  /**
   * Get yearly budget analysis
   */
  async getYearlyBudgetAnalysis(year) {
    return this.request(`/budgets/yearly-analysis/${year}`);
  }

  // ==================== Export API ====================

  /**
   * Export transactions as CSV
   */
  async exportTransactions(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.category) queryParams.append('category', params.category);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    if (params.month) queryParams.append('month', params.month);
    queryParams.append('format', 'csv');
    
    const authToken = this.getAuthToken();
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${this.baseUrl}/exports/export/transactions?${queryParams}`, {
      method: 'GET',
      headers: headers
    });
    
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
  }

  /**
   * Export monthly summary as CSV
   */
  async exportMonthlySummary(year) {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year);
    
    const authToken = this.getAuthToken();
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${this.baseUrl}/exports/export/monthly-summary?${queryParams}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly_summary_${year || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Export budget analysis as CSV
   */
  async exportBudgetAnalysis(year) {
    const queryParams = new URLSearchParams();
    queryParams.append('year', year);
    
    const authToken = this.getAuthToken();
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${this.baseUrl}/exports/export/budget-analysis?${queryParams}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_analysis_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // ==================== Health Check ====================

  /**
   * Check API health
   */
  async checkHealth() {
    const response = await fetch(`${this.baseUrl.replace('/api', '')}/api/health`);
    return response.json();
  }
}

export default FinanceTrackerApi;