// src/components/transactions/TransactionFilters.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, Search, ChevronRight, X } from 'lucide-react';

interface Filters {
  categories: string[];
  description: string;
  startDate: string;
  endDate: string;
  month: string;
  page: number;
  pageSize: number;
}

interface Category {
  name: string;
  keywords: string[];
  budget: number | null;
  is_investment: boolean;
  is_income: boolean;
  is_payment: boolean;
}

interface TransactionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  categories: Category[];
  variant?: 'horizontal' | 'sidebar';
}

// Helper function to parse natural language month input
const parseMonthInput = (input: string): string | null => {
  if (!input.trim()) return null;
  
  const cleaned = input.trim().toLowerCase();
  
  // Check if already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(input)) {
    return input;
  }
  
  // Month name mappings
  const monthNames: { [key: string]: string } = {
    'january': '01', 'jan': '01',
    'february': '02', 'feb': '02',
    'march': '03', 'mar': '03',
    'april': '04', 'apr': '04',
    'may': '05',
    'june': '06', 'jun': '06',
    'july': '07', 'jul': '07',
    'august': '08', 'aug': '08',
    'september': '09', 'sep': '09', 'sept': '09',
    'october': '10', 'oct': '10',
    'november': '11', 'nov': '11',
    'december': '12', 'dec': '12'
  };
  
  // Try to match "month year" format (e.g., "January 2024", "Jan 2024")
  const monthYearMatch = cleaned.match(/^(\w+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    const monthNum = monthNames[month];
    if (monthNum) {
      return `${year}-${monthNum}`;
    }
  }
  
  return null; // Invalid format
};

export default function TransactionFilters({ 
  filters, 
  onFiltersChange, 
  categories,
  variant = 'horizontal'
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [monthInput, setMonthInput] = useState(filters.month || '');
  const [monthError, setMonthError] = useState<string>('');
  
  // Simple local state - no debouncing
  const [searchInput, setSearchInput] = useState(filters.description);

  // Handle search submission
  const handleSearch = () => {
    onFiltersChange({ description: searchInput, page: 1 });
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle clear
  const handleClearSearch = () => {
    setSearchInput('');
    onFiltersChange({ description: '', page: 1 });
  };

  // Handle month input change
  const handleMonthChange = (value: string) => {
    setMonthInput(value);
    
    if (!value.trim()) {
      setMonthError('');
      onFiltersChange({ month: '' });
      return;
    }
    
    const parsedMonth = parseMonthInput(value);
    if (parsedMonth) {
      setMonthError('');
      onFiltersChange({ month: parsedMonth });
    } else {
      setMonthError('Enter format like "January 2024", "Jan 2024", or "2024-01"');
    }
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryName: string) => {
    const isSelected = filters.categories.includes(categoryName);
    const newCategories = isSelected
      ? filters.categories.filter(cat => cat !== categoryName)
      : [...filters.categories, categoryName];
    
    onFiltersChange({ categories: newCategories, page: 1 });
  };

  // Sidebar variant - compact version
  if (variant === 'sidebar') {
    return (
      <div className="space-y-4">
        {/* Description Search */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Search Description
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search descriptions..."
              className="w-full pl-8 pr-16 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-9 top-2.5 text-gray-500 hover:text-gray-300"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="absolute right-2 top-2 p-1 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white rounded transition-colors"
              type="button"
              title="Search (Enter)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Categories - Compact Multi-Select */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Categories ({filters.categories.length})
          </label>
          <div className="space-y-1.5">
            {categories
              .filter(cat => !cat.is_income && !cat.is_payment)
              .map(category => (
                <label key={category.name} className="flex items-center text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.name)}
                    onChange={() => handleCategoryToggle(category.name)}
                    className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-1 mr-2"
                  />
                  <span className="text-gray-300 hover:text-white truncate">
                    {category.name}
                  </span>
                </label>
              ))}
          </div>
        </div>

        {/* Month Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Month
          </label>
          <input
            type="text"
            value={monthInput}
            onChange={(e) => handleMonthChange(e.target.value)}
            placeholder="e.g., Jan 2024, 2024-01"
            className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            autoComplete="off"
          />
          {monthError && (
            <p className="mt-1 text-xs text-red-400">{monthError}</p>
          )}
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Date Range
          </label>
          <div className="space-y-1.5">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ startDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ endDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  // Default horizontal variant
  return (
    <div className="card-standard">
      <div className="flex items-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center w-full"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-white">Transaction Filters</span>
            </div>
            {(filters.categories.length > 0 || filters.description || filters.month) && (
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                {filters.categories.length + (filters.description ? 1 : 0) + (filters.month ? 1 : 0)}
              </span>
            )}
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </button>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Description Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Description
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search transaction descriptions..."
                className="w-full pl-10 pr-24 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-14 top-3 text-gray-500 hover:text-gray-300"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSearch}
                className="absolute right-3 top-2.5 p-1.5 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white rounded transition-colors"
                type="button"
                title="Search (Enter)"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Categories ({filters.categories.length} selected)
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {categories
                .filter(cat => !cat.is_income && !cat.is_payment)
                .map(category => (
                  <label key={category.name} className="flex items-center text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.name)}
                      onChange={() => handleCategoryToggle(category.name)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2 mr-2"
                    />
                    <span className="text-gray-300 hover:text-white truncate">
                      {category.name}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          {/* Month and Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Month
              </label>
              <input
                type="text"
                value={monthInput}
                onChange={(e) => handleMonthChange(e.target.value)}
                placeholder="e.g., January 2024, Jan 2024, 2024-01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
              {monthError && (
                <p className="mt-1 text-sm text-red-400">{monthError}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFiltersChange({ startDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFiltersChange({ endDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}