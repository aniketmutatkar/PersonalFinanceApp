// src/components/transactions/TransactionTable.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Edit3 } from 'lucide-react';
import { Transaction } from '../../types/api';
import TransactionEditModal from './TransactionEditModal';

interface TransactionTableProps {
  transactions: Transaction[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
  sortField?: string;
  sortDirection?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (field: string, direction: string) => void;
  showEditButton?: boolean; // NEW: Make edit functionality optional
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Parse date components directly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create date object with local timezone (month is 0-indexed)
    const date = new Date(year, month - 1, day);
    
    // Format as readable date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Fallback to original string
  }
}

function getSortIcon(field: string, currentField: string, currentDirection: string) {
  if (field !== currentField) {
    return <ChevronUp className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100" />;
  }
  
  return currentDirection === 'asc' 
    ? <ChevronUp className="w-4 h-4 text-blue-400" />
    : <ChevronDown className="w-4 h-4 text-blue-400" />;
}

function handleSort(field: string, currentField: string, currentDirection: string, onSortChange: (field: string, direction: string) => void) {
  if (field === currentField) {
    // Toggle direction if same field
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  } else {
    // Default to desc for new field (except amount, which should default to desc for largest first)
    const defaultDirection = field === 'amount' ? 'desc' : 'desc';
    onSortChange(field, defaultDirection);
  }
}

export default function TransactionTable({ 
  transactions, 
  totalTransactions, 
  currentPage, 
  pageSize, 
  sortField = 'date',
  sortDirection = 'desc',
  onPageChange, 
  onPageSizeChange,
  onSortChange,
  showEditButton = true // NEW: Default to true
}: TransactionTableProps) {
  // NEW: Add state for edit modal
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalPages = Math.ceil(totalTransactions / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalTransactions);

  return (
      <div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-24">
                  <button
                    onClick={() => handleSort('date', sortField, sortDirection, onSortChange)}
                    className="group flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Date
                    {getSortIcon('date', sortField, sortDirection)}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-2/5">
                  <button
                    onClick={() => handleSort('description', sortField, sortDirection, onSortChange)}
                    className="group flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Description
                    {getSortIcon('description', sortField, sortDirection)}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-28">
                  <button
                    onClick={() => handleSort('category', sortField, sortDirection, onSortChange)}
                    className="group flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Category
                    {getSortIcon('category', sortField, sortDirection)}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 w-24">
                  <button
                    onClick={() => handleSort('amount', sortField, sortDirection, onSortChange)}
                    className="group flex items-center gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Amount
                    {getSortIcon('amount', sortField, sortDirection)}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-20">
                  <button
                    onClick={() => handleSort('source', sortField, sortDirection, onSortChange)}
                    className="group flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Source
                    {getSortIcon('source', sortField, sortDirection)}
                  </button>
                </th>
                {showEditButton && (
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300 w-16">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    <div className="max-w-full truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    <span className={transaction.amount > 0 ? 'text-red-400' : 'text-green-400'}>
                      {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 capitalize">
                    {transaction.source}
                  </td>
                  {/* NEW: Actions column */}
                  {showEditButton && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                        title="Edit transaction"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-gray-700 gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Showing {startIndex} to {endIndex} of {totalTransactions.toLocaleString()} results
          </div>
          
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number; // Fix: Explicitly type pageNum as number
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NEW: Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            // Transaction table will automatically update due to query invalidation
            console.log('Transaction updated successfully');
          }}
        />
      )}
    </div>
  );
}