// src/components/monthly/TransactionTable.tsx
import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Transaction } from '../../types/api';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

type SortField = 'date' | 'amount' | 'category' | 'description';
type SortOrder = 'asc' | 'desc';

export default function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));
    return uniqueCategories.sort();
  }, [transactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'amount') {
        aValue = Math.abs(aValue);
        bValue = Math.abs(bValue);
      }
      
      if (sortField === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, searchTerm, selectedCategory, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  function formatDate(dateString: string): string {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
        <h3 className="text-white font-semibold text-3xl mb-6">Transactions</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-semibold text-3xl">Transactions</h3>
        <span className="text-gray-400 text-lg">
          {filteredAndSortedTransactions.length} of {transactions.length} transactions
        </span>
      </div>
      
      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg
              text-white placeholder-gray-400 focus:outline-none focus:border-blue-500
            "
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="
            px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
            focus:outline-none focus:border-blue-500 min-w-[150px]
          "
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th 
                className="text-left py-4 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center space-x-2">
                  <span>Date</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
              <th 
                className="text-left py-4 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center space-x-2">
                  <span>Description</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
              <th 
                className="text-left py-4 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center space-x-2">
                  <span>Category</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
              <th 
                className="text-right py-4 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end space-x-2">
                  <span>Amount</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedTransactions.map((transaction, index) => (
              <tr 
                key={transaction.id || index} 
                className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
              >
                <td className="py-4 px-4 text-gray-300">
                  {formatDate(transaction.date)}
                </td>
                <td className="py-4 px-4 text-white font-medium">
                  {transaction.description}
                </td>
                <td className="py-4 px-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm">
                    {transaction.category}
                  </span>
                </td>
                <td className="py-4 px-4 text-right text-white font-semibold">
                  {formatCurrency(transaction.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredAndSortedTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No transactions found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}