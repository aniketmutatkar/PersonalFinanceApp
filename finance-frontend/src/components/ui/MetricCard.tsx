import React, { useState } from 'react';
import { useInvestigation } from '../../contexts/InvestigationContext';
import { InvestigationContext as IInvestigationContext, InvestigationScope } from '../../types';

interface MetricCardProps {
  // Display properties
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
    isPositive?: boolean;
  };
  
  // Investigation configuration
  investigationType: IInvestigationContext['type'];
  investigationScope: InvestigationScope;
  investigationTitle: string;
  
  // Styling
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  
  // Interaction
  disabled?: boolean;
  onInvestigationStart?: (investigation: IInvestigationContext) => void;
  
  // Additional content
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  investigationType,
  investigationScope,
  investigationTitle,
  variant = 'default',
  size = 'md',
  disabled = false,
  onInvestigationStart,
  icon,
  children
}) => {
  const { actions } = useInvestigation();
  const [isStartingInvestigation, setIsStartingInvestigation] = useState(false);

  // Handle investigation trigger
  const handleInvestigate = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (disabled || isStartingInvestigation) return;

    try {
      setIsStartingInvestigation(true);
      
      const investigation = await actions.startInvestigation({
        type: investigationType,
        scope: investigationScope,
        title: investigationTitle,
        metadata: {
          source: 'dashboard',
          trigger_data: {
            metric_card: {
              title,
              value,
              variant
            }
          },
          depth_level: 0
        },
        tags: ['metric-card-triggered']
      });

      onInvestigationStart?.(investigation);
    } catch (error) {
      console.error('Failed to start investigation:', error);
    } finally {
      setIsStartingInvestigation(false);
    }
  };

  // Variant styles
  const variantStyles = {
    default: 'border-gray-200 hover:border-blue-300 hover:shadow-blue-100',
    success: 'border-green-200 hover:border-green-300 hover:shadow-green-100',
    warning: 'border-yellow-200 hover:border-yellow-300 hover:shadow-yellow-100',
    danger: 'border-red-200 hover:border-red-300 hover:shadow-red-100',
    info: 'border-blue-200 hover:border-blue-300 hover:shadow-blue-100'
  };

  // Size styles
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  // Value size styles
  const valueSizeStyles = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  // Trend icon
  const getTrendIcon = () => {
    if (!trend) return null;
    
    const baseClasses = "inline-flex items-center ml-2 text-sm font-medium";
    const positiveClasses = trend.isPositive !== false ? "text-green-600" : "text-red-600";
    const negativeClasses = trend.isPositive !== false ? "text-red-600" : "text-green-600";
    
    switch (trend.direction) {
      case 'up':
        return (
          <span className={`${baseClasses} ${positiveClasses}`}>
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {trend.value}
          </span>
        );
      case 'down':
        return (
          <span className={`${baseClasses} ${negativeClasses}`}>
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {trend.value}
          </span>
        );
      case 'stable':
        return (
          <span className={`${baseClasses} text-gray-600`}>
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            {trend.value}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={handleInvestigate}
      className={`
        relative
        bg-white
        border-2
        rounded-xl
        ${sizeStyles[size]}
        transition-all
        duration-200
        cursor-pointer
        group
        ${disabled ? 'opacity-50 cursor-not-allowed' : variantStyles[variant]}
        ${isStartingInvestigation ? 'scale-[0.98] shadow-inner' : 'hover:scale-[1.02] hover:shadow-lg'}
      `}
    >
      {/* Loading overlay */}
      {isStartingInvestigation && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium text-gray-600">Starting investigation...</span>
          </div>
        </div>
      )}

      {/* Investigation hint */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <span>Investigate</span>
        </div>
      </div>

      {/* Card content */}
      <div className="relative">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>
          {icon && (
            <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
              {icon}
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="flex items-baseline">
          <span className={`font-bold text-gray-900 ${valueSizeStyles[size]}`}>
            {value}
          </span>
          {getTrendIcon()}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>
        )}

        {/* Additional content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}

        {/* Investigation type hint */}
        <div className="mt-3 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Click to investigate: {investigationTitle}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;