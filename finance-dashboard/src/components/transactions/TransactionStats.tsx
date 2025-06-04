// src/components/transactions/TransactionStats.tsx
import React from 'react';
import { CreditCard, Search, Tag, Calendar } from 'lucide-react';
import { Transaction } from '../../types/api';

interface TransactionStatsProps {
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
  transactions: Transaction[];
  totalSum: number;
  avgAmount: number;
}

function formatCurrency(amount: number): string {
  // Add validation to prevent NaN
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function safeNumber(value: any): number {
  // Convert to number and validate
  const num = typeof value === 'number' ? value : parseFloat(value);
  return (typeof num === 'number' && isFinite(num)) ? num : 0;
}

export default function TransactionStats({ 
  totalTransactions, 
  currentPage, 
  pageSize, 
  transactions,
  totalSum,
  avgAmount
}: TransactionStatsProps) {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalTransactions);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Results</p>
            <p className="text-xl font-bold text-white">{(totalTransactions || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Showing</p>
            <p className="text-xl font-bold text-white">{startIndex}-{endIndex}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Amount</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalSum)}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Average</p>
            <p className="text-xl font-bold text-white">{formatCurrency(avgAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}