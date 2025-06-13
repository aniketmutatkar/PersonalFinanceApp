// src/components/cards/MetricCard.tsx - PHASE 2 ENHANCEMENT
import React from 'react';

interface StatItem {
  label: string;
  value: string;
  variant?: 'positive' | 'negative' | 'neutral';
}

interface TrendInfo {
  value: string;
  direction: 'up' | 'down' | 'neutral';
  isPositive?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendInfo;
  variant?: 'default' | 'hero' | 'accent' | 'warning' | 'success' | 'danger' | 'info';
  className?: string;
  chart?: React.ReactNode;
  stats?: StatItem[];
  indicator?: 'success' | 'warning' | 'danger' | 'info';
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

  const getCardClass = () => {
    switch (variant) {
      case 'hero':
        return 'card-hero h-full';
      case 'success':
        return 'card-success h-full';
      case 'danger':
        return 'card-danger h-full';
      case 'warning':
        return 'card-warning h-full';
      case 'info':
        return 'card-info h-full';
      case 'accent':
        return 'card-elevated h-full';
      default:
        return 'card-elevated h-full';
    }
  };

  const getMetricClass = () => {
    switch (variant) {
      case 'hero':
        return 'metric-hero';
      case 'success':
        return 'metric-large text-success';
      case 'danger':
        return 'metric-large text-danger';
      case 'warning':
        return 'metric-large text-warning';
      case 'info':
        return 'metric-large text-info';
      case 'accent':
        return 'metric-large text-accent';
      default:
        return 'metric-large';
    }
  };

  const getTrendClass = () => {
    if (!trend) return '';
    const isPositive = trend.isPositive !== undefined ? 
      trend.isPositive : 
      trend.direction === 'up';
    
    if (isPositive) return 'text-success';
    if (trend.direction === 'down') return 'text-danger';
    return 'text-muted';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getIndicatorClass = () => {
    if (!indicator) return '';
    switch (indicator) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'danger': return 'bg-danger';
      case 'info': return 'bg-info';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`${getCardClass()} ${className} flex flex-col`}>
      {/* Top Section: Status Indicator + Title - DESIGN SYSTEM */}
      <div className="flex-shrink-0">
        {indicator && (
          <div className="flex items-center justify-end tight-gap">
            <div className={`w-2 h-2 rounded-full ${getIndicatorClass()}`}></div>
          </div>
        )}

        <div className="label-primary tight-gap">
          {title}
        </div>
      </div>

      {/* Middle Section: Main Value - DESIGN SYSTEM */}
      <div className="flex-1 flex flex-col justify-center">
        <div className={`${getMetricClass()}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {/* Mini Chart */}
        {chart && (
          <div className="mt-2 h-8">
            {chart}
          </div>
        )}
      </div>

      {/* Bottom Section: Subtitle + Trend - DESIGN SYSTEM */}
      <div className="flex-shrink-0 space-y-2">
        {subtitle && (
          <div className="text-secondary text-sm">
            {subtitle}
          </div>
        )}

        {trend && (
          <div className={`flex items-center text-sm ${getTrendClass()}`}>
            <span className="mr-1">{getTrendIcon()}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {/* Stats Breakdown (for hero cards) - DESIGN SYSTEM */}
      {stats && stats.length > 0 && (
        <div className="mt-4 p-3 bg-black/20 rounded-lg grid grid-cols-2 lg:grid-cols-4 grid-tight flex-shrink-0">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="label-secondary tight-gap">
                {stat.label}
              </div>
              <div className={`text-sm font-bold ${
                stat.variant === 'positive' ? 'text-success' :
                stat.variant === 'negative' ? 'text-danger' : 
                'text-primary'
              }`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}