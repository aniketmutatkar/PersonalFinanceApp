// src/components/cards/MetricCard.tsx - Enhanced Version
import React from 'react';

interface StatItem {
  label: string;
  value: string;
  variant?: 'positive' | 'negative' | 'neutral';
}

interface TrendInfo {
  value: string;
  direction: 'up' | 'down' | 'neutral';
  isPositive?: boolean; // Override color logic - sometimes "up" trends are bad (like overspending)
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendInfo;
  variant?: 'default' | 'hero' | 'accent' | 'warning' | 'success' | 'danger' | 'info';
  className?: string;
  
  // Enhanced features
  chart?: React.ReactNode; // Mini chart component
  stats?: StatItem[]; // Breakdown stats (for hero cards)
  indicator?: 'success' | 'warning' | 'danger' | 'info'; // Status indicator dot
}

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  variant = 'default',
  className = '',
  chart,
  stats,
  indicator
}: MetricCardProps) {
  const getCardStyles = () => {
    const baseStyles = 'border transition-all duration-300 hover:transform hover:-translate-y-1';
    
    switch (variant) {
      case 'hero':
        return `${baseStyles} bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20`;
      case 'success':
        return `${baseStyles} bg-gradient-to-br from-slate-800 to-emerald-900/20 border-emerald-800/30 hover:border-emerald-600`;
      case 'danger':
        return `${baseStyles} bg-gradient-to-br from-slate-800 to-red-900/20 border-red-800/30 hover:border-red-600`;
      case 'warning':
        return `${baseStyles} bg-gradient-to-br from-slate-800 to-amber-900/20 border-amber-800/30 hover:border-amber-600`;
      case 'info':
        return `${baseStyles} bg-gradient-to-br from-slate-800 to-cyan-900/20 border-cyan-800/30 hover:border-cyan-600`;
      case 'accent':
        return `${baseStyles} bg-slate-800 border-slate-600 hover:border-yellow-500`;
      default:
        return `${baseStyles} bg-slate-800 border-slate-600 hover:border-slate-500`;
    }
  };

  const getValueStyles = () => {
    const baseStyles = 'font-bold leading-none';
    
    switch (variant) {
      case 'hero':
        return `${baseStyles} text-3xl lg:text-4xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent`;
      case 'success':
        return `${baseStyles} text-2xl text-emerald-400`;
      case 'danger':
        return `${baseStyles} text-2xl text-red-400`;
      case 'warning':
        return `${baseStyles} text-2xl text-amber-400`;
      case 'info':
        return `${baseStyles} text-2xl text-cyan-400`;
      case 'accent':
        return `${baseStyles} text-xl lg:text-2xl text-yellow-400`;
      default:
        return `${baseStyles} text-xl lg:text-2xl text-white`;
    }
  };

  const getTitleStyles = () => {
    const baseStyles = 'text-sm font-semibold uppercase tracking-wider';
    
    switch (variant) {
      case 'hero':
        return `${baseStyles} text-slate-400`;
      default:
        return `${baseStyles} text-slate-500`;
    }
  };

  const getTrendStyles = () => {
    if (!trend) return '';
    
    // Use isPositive override if provided, otherwise use direction
    const isPositive = trend.isPositive !== undefined ? trend.isPositive : trend.direction === 'down';
    
    if (isPositive) {
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    } else if (trend.direction === 'up') {
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    } else {
      return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getIndicatorStyles = () => {
    if (!indicator) return '';
    
    switch (indicator) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-red-500';
      case 'info':
        return 'bg-cyan-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatItemStyles = (statVariant?: string) => {
    switch (statVariant) {
      case 'positive':
        return 'text-emerald-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className={`
      rounded-xl p-4 flex flex-col justify-between h-full
      ${getCardStyles()}
      ${className}
    `}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={getTitleStyles()}>{title}</div>
          {indicator && (
            <div className={`w-2 h-2 rounded-full ${getIndicatorStyles()}`} />
          )}
        </div>
        
        {trend && (
          <div className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${getTrendStyles()}`}>
            <span>{getTrendIcon()}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`mb-1 ${getValueStyles()}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className={`text-sm mb-2 ${variant === 'hero' ? 'text-slate-300' : 'text-slate-400'}`}>
          {subtitle}
        </div>
      )}

      {/* Mini Chart */}
      {chart && (
        <div className="mb-2 h-8">
          {chart}
        </div>
      )}

      {/* Stats Breakdown (for hero cards) */}
      {stats && stats.length > 0 && (
        <div className="mt-2 p-3 bg-black/20 rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-2">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">
                {stat.label}
              </div>
              <div className={`text-sm font-bold ${getStatItemStyles(stat.variant)}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}