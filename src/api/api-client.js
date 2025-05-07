// api-client.js - Add this to your React project

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
  
    // Transactions API
    
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
     * Upload transaction file
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
    
    // Monthly Summary API
    
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
    
    // Categories API
    
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
    
    // Budget API
    
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
  }
  
  export default FinanceTrackerApi;