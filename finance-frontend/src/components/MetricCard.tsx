import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  details?: React.ReactNode;
  dropdown?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  details,
  dropdown,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (val: number): string => {
    // Handle NaN or invalid numbers
    if (isNaN(val) || !isFinite(val)) {
      return '$0.00';
    }
    
    // Always show exact values with commas and 2 decimal places
    if (val < 0) {
      return `-${Math.abs(val).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    } else {
      return `${val.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    }
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return formatCurrency(val);
    }
    
    // If it's already a string, check if it needs currency formatting
    const strVal = val.toString();
    if (strVal.includes('%') || strVal.includes('$')) {
      return strVal; // Already formatted or is percentage
    }
    
    // Try to parse as number for currency formatting
    const numVal = parseFloat(strVal);
    if (!isNaN(numVal) && isFinite(numVal)) {
      return formatCurrency(numVal); // Use the currency formatter
    }
    
    return strVal;
  };

  const getChangeColorClass = (): string => {
    switch (changeType) {
      case 'positive':
        return 'text-success-400';
      case 'negative':
        return 'text-danger-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatChange = (changeVal: number): string => {
    const sign = changeVal >= 0 ? '+' : '';
    return `${sign}${changeVal.toFixed(1)}%`;
  };

  return (
    <div className={`card ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        {dropdown && (
          <div className="text-xs">
            {dropdown}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-bold text-white">
          {formatValue(value)}
        </span>
        {change !== undefined && (
          <span className={`text-sm font-medium ${getChangeColorClass()}`}>
            {formatChange(change)}
          </span>
        )}
      </div>

      {details && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-sm text-gray-300 hover:text-white transition-colors"
          >
            <span>View Details</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-dark-600">
              {details}
            </div>
          )}
        </div>
      )}
    </div>
  );
};