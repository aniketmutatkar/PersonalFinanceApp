// src/pages/TransactionExplorerPage.tsx
import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download } from 'lucide-react';

import { api } from '../services/api';
import { PagedResponse, Transaction } from '../types/api';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionStats from '../components/transactions/TransactionStats';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import PageHeader from '../components/layout/PageHeader';

interface Filters {
  categories: string[];
  description: string;
  startDate: string;
  endDate: string;
  month: string;
  page: number;
  pageSize: number;
  sortField: string;
  sortDirection: string;
}

export default function TransactionExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL parameters for initial state
  const getInitialFilters = (): Filters => {
    return {
      categories: searchParams.getAll('categories'),
      description: searchParams.get('description') || '',
      startDate: searchParams.get('start_date') || '',
      endDate: searchParams.get('end_date') || '',
      month: searchParams.get('month') || '',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('page_size') || '50'),
      sortField: searchParams.get('sort_field') || 'date',        // ADD THIS
      sortDirection: searchParams.get('sort_direction') || 'desc' // ADD THIS
    };
  };

  const [filters, setFilters] = useState<Filters>(getInitialFilters);

  // Update URL when filters change
  const updateUrlParams = (newFilters: Filters) => {
    const params = new URLSearchParams();
    
    // Add non-empty filters to URL
    if (newFilters.categories.length > 0) {
      newFilters.categories.forEach(cat => params.append('categories', cat));
    }
    if (newFilters.description) params.set('description', newFilters.description);
    if (newFilters.startDate) params.set('start_date', newFilters.startDate);
    if (newFilters.endDate) params.set('end_date', newFilters.endDate);
    if (newFilters.month) params.set('month', newFilters.month);
    if (newFilters.page > 1) params.set('page', newFilters.page.toString());
    if (newFilters.pageSize !== 50) params.set('page_size', newFilters.pageSize.toString());
    if (newFilters.sortField !== 'date') params.set('sort_field', newFilters.sortField);
    if (newFilters.sortDirection !== 'desc') params.set('sort_direction', newFilters.sortDirection);
  
    setSearchParams(params);
  };

  // Update filters and URL together
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    const updatedFilters = { 
      ...filters, 
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1 // Reset to page 1 when filters change
    };
    
    setFilters(updatedFilters);
    updateUrlParams(updatedFilters);
  };

  const handleSortChange = (field: string, direction: string) => {
    const updatedFilters = {
      ...filters,
      sortField: field,
      sortDirection: direction,
      page: 1 // Reset to page 1 when sorting changes
    };
    
    setFilters(updatedFilters);
    updateUrlParams(updatedFilters);
  };

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch transactions with current filters
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery<PagedResponse<Transaction>>({
    queryKey: ['transactions', filters],
    queryFn: () => {
      const params: any = {
        page: filters.page,
        page_size: filters.pageSize
      };

      // Handle multiple categories - need to update API client
      if (filters.categories.length > 0) {
        params.categories = filters.categories;
      }
      if (filters.description) {
        params.description = filters.description;
      }
      if (filters.startDate) {
        params.start_date = filters.startDate;
      }
      if (filters.endDate) {
        params.end_date = filters.endDate;
      }
      if (filters.month) {
        params.month = filters.month;
      }
      if (filters.sortField) {
        params.sort_field = filters.sortField;
      }
      if (filters.sortDirection) {
        params.sort_direction = filters.sortDirection;
      }

      return api.getTransactions(params);
    },
    placeholderData: (previousData) => previousData, // Updated from keepPreviousData
  });

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters: Filters = {
      categories: [],
      description: '',
      startDate: '',
      endDate: '',
      month: '',
      page: 1,
      pageSize: 50,
      sortField: 'date',
      sortDirection: 'desc'
    };
    
    setFilters(clearedFilters);
    setSearchParams(new URLSearchParams());
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.categories.length > 0 || 
           filters.description ||
           filters.startDate ||
           filters.endDate ||
           filters.month;
  }, [filters]);

  if (transactionsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Transactions</h2>
          <p className="text-gray-400">{transactionsError?.message || 'Failed to load transactions'}</p>
          <button 
            onClick={() => refetchTransactions()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (transactionsLoading && !transactionsData) {
    return (
      <div className="h-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Transaction Explorer</h1>
          <div className="h-4 w-64 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-6">
          <LoadingSkeleton variant="metric" className="h-32" />
          <LoadingSkeleton variant="metric" className="h-20" />
          <LoadingSkeleton variant="list" lines={10} className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Transaction Explorer"
        subtitle="Search and filter your financial transactions with advanced controls"
        actions={
          <button className="btn-primary btn-sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        }
      />

      {/* Stats */}
      {transactionsData && (
        <TransactionStats
          totalTransactions={transactionsData.total}
          currentPage={filters.page}
          pageSize={filters.pageSize}
          transactions={transactionsData.items}
          totalSum={transactionsData.total_sum || 0}
          avgAmount={transactionsData.avg_amount || 0}
        />
      )}

      {/* Main Content Area - Filters + Table */}
      <div className="flex-1 flex gap-4">
        {/* Left Sidebar for Filters - Made narrower */}
        <div className="w-64 flex-shrink-0 bg-gray-800 border border-gray-700 rounded-lg h-fit">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-medium text-white">Filters</h2>
              {(filters.categories.length > 0 || filters.description || filters.month) && (
                <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full ml-auto">
                  {filters.categories.length + (filters.description ? 1 : 0) + (filters.month ? 1 : 0)}
                </span>
              )}
            </div>

            {/* Use the existing TransactionFilters component with sidebar variant */}
            <TransactionFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              categories={categoriesData?.categories || []}
              variant="sidebar"
            />

            {/* Clear All Button */}
            {hasActiveFilters && (
              <div className="mt-4">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-600 rounded-md hover:border-gray-500 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700">
          {transactionsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading transactions...</p>
            </div>
          ) : transactionsData && transactionsData.items.length > 0 ? (
            <TransactionTable
              transactions={transactionsData.items}
              totalTransactions={transactionsData.total}
              currentPage={filters.page}
              pageSize={filters.pageSize}
              sortField={filters.sortField}
              sortDirection={filters.sortDirection}
              onPageChange={(page: number) => handleFilterChange({ page })}
              onPageSizeChange={(pageSize: number) => handleFilterChange({ pageSize, page: 1 })}
              onSortChange={handleSortChange}
            />
          ) : (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results.'
                  : 'No transactions available.'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-blue-400 hover:text-blue-300"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}