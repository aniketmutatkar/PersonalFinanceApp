import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Transaction } from '../types';
import { ROUTES } from '../utils/constants';

interface TransactionTableProps {
  transactions: Transaction[];
  className?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  className = ''
}) => {
  const navigate = useNavigate();

  const getCategoryColor = (category: string): string => {
    // Investment categories - Blue
    if (['Acorns', 'Wealthfront', 'Robinhood', 'Schwab'].includes(category)) {
      return 'bg-blue-600 text-blue-100';
    }
    // Income - Green
    if (category === 'Pay') {
      return 'bg-success-600 text-success-100';
    }
    // Payment/Transfer - Gray
    if (category === 'Payment') {
      return 'bg-gray-600 text-gray-100';
    }
    // High expense categories - Red/Orange
    if (['Rent', 'Car', 'Insurance'].includes(category)) {
      return 'bg-danger-600 text-danger-100';
    }
    // Regular expenses - Orange
    return 'bg-orange-600 text-orange-100';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatAmount = (amount: number): string => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = `$${absAmount.toFixed(2)}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  const handleCategoryClick = (category: string) => {
    navigate(`${ROUTES.TRANSACTIONS}?category=${category}`);
  };

  const handleViewAll = () => {
    navigate(ROUTES.TRANSACTIONS);
  };

  if (transactions.length === 0) {
    return (
      <div className={`card ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
        <p className="text-gray-400 text-center py-8">No transactions found</p>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
        <button
          onClick={handleViewAll}
          className="flex items-center text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-2">
                Date
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-2">
                Description
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-2">
                Category
              </th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-2">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {transactions.map((transaction, index) => (
              <tr key={transaction.id || index} className="hover:bg-dark-700 transition-colors">
                <td className="py-3 text-sm text-gray-300">
                  {formatDate(transaction.date)}
                </td>
                <td className="py-3 text-sm text-white max-w-xs truncate">
                  {transaction.description}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleCategoryClick(transaction.category)}
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(transaction.category)} hover:opacity-80 transition-opacity`}
                  >
                    {transaction.category}
                  </button>
                </td>
                <td className="py-3 text-sm text-right">
                  <span className={transaction.amount < 0 ? 'text-success-400' : 'text-white'}>
                    {formatAmount(transaction.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};