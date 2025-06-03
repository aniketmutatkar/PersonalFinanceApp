// src/components/cards/MetricCard.tsx
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'hero' | 'accent' | 'warning';
  className?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  variant = 'default',
  className = '' 
}: MetricCardProps) {
  const getCardStyles = () => {
    switch (variant) {
      case 'hero':
        return 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600';
      case 'accent':
        return 'bg-gray-800 border-gray-600';
      case 'warning':
        return 'bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-800/30';
      default:
        return 'bg-gray-800 border-gray-600 hover:border-gray-500';
    }
  };

  const getValueStyles = () => {
    switch (variant) {
      case 'hero':
        return 'text-2xl lg:text-3xl font-bold text-teal-400 leading-none';
      case 'accent':
        return 'text-xl lg:text-2xl font-bold text-yellow-400 leading-none';
      case 'warning':
        return 'text-lg lg:text-xl font-semibold text-red-400 leading-none';
      default:
        return 'text-lg lg:text-xl font-semibold text-white leading-none';
    }
  };

  const getTitleStyles = () => {
    switch (variant) {
      case 'hero':
        return 'text-sm text-gray-300 font-medium';
      default:
        return 'text-sm text-gray-400 font-medium';
    }
  };

  const getTrendStyles = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return 'bg-teal-400/10 text-teal-400';
      case 'down':
        return 'bg-red-400/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div className={`
      rounded-lg border transition-all duration-200 p-10 flex flex-col justify-center h-full
      ${getCardStyles()}
      ${className}
    `}>
      <div className="flex flex-col h-full justify-center">
        <div className={getValueStyles()}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        <div className={`mt-4 ${getTitleStyles()}`}>
          {title}
        </div>
        
        {subtitle && (
          <div className="mt-2 text-xs text-gray-500">
            {subtitle}
          </div>
        )}
        
        {trend && (
          <div className="mt-4">
            <div className={`
              inline-flex items-center px-3 py-1 rounded text-xs font-medium
              ${getTrendStyles()}
            `}>
              <span className="mr-1">{getTrendIcon()}</span>
              {trend.value}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}