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
  showEditButton?: boolean;
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
    // Parse date string as UTC to avoid timezone issues
    const date = new Date(dateString + 'T12:00:00.000Z'); // Force UTC midday
    
    // More compact format - just month/day for current year, month/day/year for others
    const currentYear = new Date().getFullYear();
    const year = date.getUTCFullYear();
    
    if (year === currentYear) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC' // Force UTC to prevent timezone shifts
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
        timeZone: 'UTC' // Force UTC to prevent timezone shifts
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

function getSortIcon(field: string, currentField: string, currentDirection: string) {
  if (field !== currentField) {
    return <ChevronUp className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100" />;
  }
  
  return currentDirection === 'asc' 
    ? <ChevronUp className="w-3 h-3 text-blue-400" />
    : <ChevronDown className="w-3 h-3 text-blue-400" />;
}

function handleSort(field: string, currentField: string, currentDirection: string, onSortChange: (field: string, direction: string) => void) {
  if (field === currentField) {
    // Toggle direction if same field
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  } else {
    // Default to desc for new field
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
  showEditButton = true
}: TransactionTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalPages = Math.ceil(totalTransactions / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalTransactions);

  return (
    <div>
      {/* Table with fixed layout and proper constraints */}
      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed min-w-[700px]">
          <thead className="bg-gray-700">
            <tr>
              {/* Date - Fixed width */}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-20">
                <button
                  onClick={() => handleSort('date', sortField, sortDirection, onSortChange)}
                  className="group flex items-center gap-1 hover:text-white transition-colors"
                >
                  Date
                  {getSortIcon('date', sortField, sortDirection)}
                </button>
              </th>
              
              {/* Description - Fixed width with proper constraints */}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-80">
                <button
                  onClick={() => handleSort('description', sortField, sortDirection, onSortChange)}
                  className="group flex items-center gap-1 hover:text-white transition-colors"
                >
                  Description
                  {getSortIcon('description', sortField, sortDirection)}
                </button>
              </th>
              
              {/* Category - Fixed width */}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-28">
                <button
                  onClick={() => handleSort('category', sortField, sortDirection, onSortChange)}
                  className="group flex items-center gap-1 hover:text-white transition-colors"
                >
                  Category
                  {getSortIcon('category', sortField, sortDirection)}
                </button>
              </th>
              
              {/* Amount - Fixed width */}
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-300 w-24">
                <button
                  onClick={() => handleSort('amount', sortField, sortDirection, onSortChange)}
                  className="group flex items-center justify-end gap-1 hover:text-white transition-colors"
                >
                  Amount
                  {getSortIcon('amount', sortField, sortDirection)}
                </button>
              </th>
              
              {/* Source - Fixed width */}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-20">
                <button
                  onClick={() => handleSort('source', sortField, sortDirection, onSortChange)}
                  className="group flex items-center gap-1 hover:text-white transition-colors"
                >
                  Source
                  {getSortIcon('source', sortField, sortDirection)}
                </button>
              </th>
              
              {/* Actions - Fixed width */}
              {showEditButton && (
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-300 w-12">
                  Edit
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-700">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-700/50">
                {/* Date - Fixed width with overflow handling */}
                <td className="px-2 py-2 text-xs text-gray-300 w-20">
                  <div className="truncate">
                    {formatDate(transaction.date)}
                  </div>
                </td>
                
                {/* Description - Fixed width with proper truncation */}
                <td className="px-2 py-2 text-xs text-white w-80">
                  <div 
                    className="truncate" 
                    title={transaction.description}
                  >
                    {transaction.description}
                  </div>
                </td>
                
                {/* Category - Fixed width with truncation */}
                <td className="px-2 py-2 text-xs w-28">
                  <div className="truncate">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400">
                      {transaction.category}
                    </span>
                  </div>
                </td>
                
                {/* Amount - Fixed width, right aligned */}
                <td className="px-2 py-2 text-xs text-right font-mono w-24">
                  <div className="truncate">
                    <span className={transaction.amount > 0 ? 'text-red-400' : 'text-green-400'}>
                      {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </td>
                
                {/* Source - Fixed width with truncation */}
                <td className="px-2 py-2 text-xs text-gray-400 w-20">
                  <div className="truncate capitalize" title={transaction.source}>
                    {transaction.source}
                  </div>
                </td>
                
                {/* Actions - Fixed width */}
                {showEditButton && (
                  <td className="px-1 py-2 text-center w-12">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="text-gray-400 hover:text-blue-400 transition-colors p-0.5"
                      title="Edit transaction"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compact Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-3 border-t border-gray-700 gap-3">
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400">
            {startIndex}-{endIndex} of {totalTransactions.toLocaleString()}
          </div>
          
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
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
                  className={`px-2 py-1 text-xs rounded ${
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
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Transaction Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null);
            // You might want to refetch data here
          }}
        />
      )}
    </div>
  );
}