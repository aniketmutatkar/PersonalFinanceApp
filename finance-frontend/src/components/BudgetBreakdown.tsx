import React from 'react';

interface BudgetItem {
  category: string;
  budget: number;
  actual: number;
  percentage: number;
  status: 'under' | 'near' | 'over';
}

interface BudgetBreakdownProps {
  budgetItems: BudgetItem[];
  className?: string;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({
  budgetItems,
  className = ''
}) => {
  const getStatusColor = (status: BudgetItem['status']): string => {
    switch (status) {
      case 'under':
        return 'text-success-400';
      case 'near':
        return 'text-yellow-400';
      case 'over':
        return 'text-danger-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: BudgetItem['status']): string => {
    switch (status) {
      case 'under':
        return '✓';
      case 'near':
        return '⚠';
      case 'over':
        return '⚠';
      default:
        return '—';
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${Math.abs(amount).toFixed(0)}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {budgetItems.map((item) => (
        <div key={item.category} className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className={getStatusColor(item.status)}>
              {getStatusIcon(item.status)}
            </span>
            <span className="text-gray-300">{item.category}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">
              {formatCurrency(item.actual)} / {formatCurrency(item.budget)}
            </span>
            <span className={`font-medium ${getStatusColor(item.status)}`}>
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};